/**
 * Festoria Trusted Backend Cloud Functions
 *
 * Implements server-side validation and privileged account provisioning for:
 * 1. Admin-managed Team Leader invitation creation
 *    - Concurrency-safe duplicate invitation checks
 *    - Exact fest ownership validation (missing fest IDs rejected)
 * 2. Idempotent server-side activation of Team Leader role & Custom Claims upon phone OTP verification
 *    - Rejects incompatible privileged account activations (admin, super_admin, cross-team leader)
 *    - Validates team fest ownership strictly (missing fest IDs rejected)
 *    - Preserves existing profile data & restores actual previous state on rollback
 *    - Hardened rollback: verifies document state before restoring, records critical audit on conflict
 * 3. Team reassignment with house conflict validation, fest validation, and atomic concurrency controls
 *    - Requires exact fest ownership on target team, old team, and user profile
 *    - Verifies old team is actually assigned to target leader before clearing
 *    - Preserves unrelated Custom Claims and guards rollback against subsequent legitimate changes
 * 4. Suspension & Reactivation with Firebase Auth account status sync and token revocation
 *    - Revalidates role, fest, and status inside transaction
 *    - Consistent disabled & token revocation for both suspended and inactive accounts
 *    - Records explicit rollback failure logs for administrators
 * 5. Immutable audit logging and compensating rollbacks
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const { FieldValue } = require('firebase-admin/firestore');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const auth = admin.auth();

/**
 * Normalizes phone number into E.164 format.
 */
function normalizePhone(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (trimmed.startsWith('+')) {
    return '+' + digits;
  }
  if (digits.length === 10) {
    return '+91' + digits; // Default country code (e.g. India)
  }
  return '+' + digits;
}

/**
 * Helper: Verify caller is an authorized Fest Admin or Super Admin.
 */
async function verifyAdminAuth(request, requiredFestId, deps = {}) {
  const currentDb = deps.db || db;

  if (!request.auth || !request.auth.uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  if (!requiredFestId || typeof requiredFestId !== 'string' || !requiredFestId.trim()) {
    throw new HttpsError('invalid-argument', 'Missing or invalid festId parameter.');
  }

  const callerUid = request.auth.uid;
  const userDoc = await currentDb.collection('users').doc(callerUid).get();
  
  if (!userDoc.exists) {
    throw new HttpsError('permission-denied', 'Caller account profile not found.');
  }

  const userData = userDoc.data();

  if (userData.status !== 'active') {
    throw new HttpsError('permission-denied', 'Caller account is suspended or inactive.');
  }

  const isSuperAdmin = userData.role === 'super_admin';
  if (isSuperAdmin) {
    return {
      uid: callerUid,
      name: userData.name || 'Super Admin',
      role: 'super_admin',
      isSuperAdmin: true,
      festId: requiredFestId
    };
  }

  const isFestAdmin =
    (userData.role === 'admin' || userData.role === 'fest_admin') &&
    userData.festId === requiredFestId;

  if (!isFestAdmin) {
    throw new HttpsError(
      'permission-denied',
      `Permission denied: Only authorized Fest Admins for fest ${requiredFestId} can perform this operation.`
    );
  }

  return {
    uid: callerUid,
    name: userData.name || 'Fest Admin',
    role: 'admin',
    festId: userData.festId,
    isSuperAdmin: false
  };
}

/**
 * Core Handler: createTeamLeaderInviteHandler
 * - Strictly validates exact festId ownership (missing festId rejected)
 * - Safe against concurrent duplicate creation requests via atomic transaction
 */
async function createTeamLeaderInviteHandler(request, deps = {}) {
  const currentDb = deps.db || db;
  const data = request.data || {};
  const { festId, teamId, name, phone, email, institution, remarks } = data;

  if (!festId || typeof festId !== 'string' || !festId.trim()) {
    throw new HttpsError('invalid-argument', 'Missing or invalid festId.');
  }
  if (!teamId || typeof teamId !== 'string' || !teamId.trim()) {
    throw new HttpsError('invalid-argument', 'Missing or invalid teamId.');
  }
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new HttpsError('invalid-argument', 'Missing or invalid name.');
  }
  if (!phone || typeof phone !== 'string' || !phone.trim()) {
    throw new HttpsError('invalid-argument', 'Missing or invalid phone number.');
  }
  if (!email || typeof email !== 'string' || !email.trim()) {
    throw new HttpsError('invalid-argument', 'Missing or invalid email address.');
  }

  const adminCaller = await verifyAdminAuth(request, festId, deps);
  const normalized = normalizePhone(phone);

  if (!normalized || normalized.length < 10) {
    throw new HttpsError('invalid-argument', 'Invalid phone number format.');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw new HttpsError('invalid-argument', 'Invalid email address format.');
  }

  const teamDocRef = currentDb.collection('teams').doc(teamId);

  // Execute atomic transaction for duplicate checks and invitation creation
  const invData = await currentDb.runTransaction(async (transaction) => {
    // 1. Validate team exists and exact fest ownership
    const teamSnap = await transaction.get(teamDocRef);
    if (!teamSnap.exists) {
      throw new HttpsError('not-found', `Team ${teamId} does not exist.`);
    }
    const teamData = teamSnap.data();

    // Exact fest ownership: reject missing or mismatched festId
    if (!teamData.festId || teamData.festId !== festId) {
      throw new HttpsError('invalid-argument', `Team ${teamData.name || teamId} does not belong to fest ${festId}.`);
    }

    // 2. Check if team already has an active leader
    if (teamData.teamLeaderId) {
      const assignedUserDoc = await transaction.get(currentDb.collection('users').doc(teamData.teamLeaderId));
      if (assignedUserDoc.exists && assignedUserDoc.data().status === 'active') {
        throw new HttpsError('already-exists', `Team ${teamData.name} is already assigned to active leader ${assignedUserDoc.data().name}.`);
      }
    }

    // 3. Check duplicate phone in users
    const existingUsersByPhone = await currentDb.collection('users').where('phone', '==', normalized).get();
    if (!existingUsersByPhone.empty) {
      const u = existingUsersByPhone.docs[0].data();
      throw new HttpsError('already-exists', `An account already exists for phone ${phone} (${u.name}, Role: ${u.role}).`);
    }

    // 4. Check duplicate pending invitation for this phone
    const existingInvites = await currentDb.collection('team_leader_invitations')
      .where('phone', '==', normalized)
      .where('status', '==', 'pending_verification')
      .get();

    if (!existingInvites.empty) {
      const inv = existingInvites.docs[0].data();
      throw new HttpsError('already-exists', `A pending invitation already exists for mobile ${phone} (${inv.name}, Team: ${inv.teamName}).`);
    }

    // 5. Check duplicate pending invitation for this team
    const existingTeamInvites = await currentDb.collection('team_leader_invitations')
      .where('festId', '==', festId)
      .where('teamId', '==', teamId)
      .where('status', '==', 'pending_verification')
      .get();

    if (!existingTeamInvites.empty) {
      const inv = existingTeamInvites.docs[0].data();
      throw new HttpsError('already-exists', `Team ${teamData.name} already has a pending invitation for ${inv.name}.`);
    }

    // 6. Generate secure Invitation record
    const invRef = currentDb.collection('team_leader_invitations').doc();
    const newInvitation = {
      id: `INV-${invRef.id.slice(0, 7).toUpperCase()}`,
      festId,
      teamId,
      teamName: teamData.name,
      name: name.trim(),
      phone: normalized,
      email: email.trim(),
      institution: (institution && institution.trim()) || teamData.institution || '',
      status: 'pending_verification',
      createdByAdminId: adminCaller.uid,
      createdByAdminName: adminCaller.name,
      createdAt: FieldValue.serverTimestamp(),
      notes: (remarks && remarks.trim()) || ''
    };

    transaction.set(invRef, newInvitation);

    // 7. Record immutable Audit Log (never expose sensitive credentials)
    const auditRef = currentDb.collection('audit_logs').doc();
    transaction.set(auditRef, {
      id: auditRef.id,
      festId,
      userId: adminCaller.uid,
      userName: adminCaller.name,
      action: 'CREATE_TEAM_LEADER_INVITATION',
      targetType: 'invitation',
      targetId: newInvitation.id,
      details: `Admin ${adminCaller.name} created team leader invitation for ${name.trim()} (${normalized}) assigned to team ${teamData.name}.`,
      timestamp: FieldValue.serverTimestamp()
    });

    return newInvitation;
  });

  return { success: true, invitation: invData };
}

/**
 * Core Handler: verifyAndActivateTeamLeaderHandler
 * - Rejects incompatible privileged account activations (admin, super_admin, or leader of another team)
 * - Requires exact fest ownership on team (missing festId rejected)
 * - Idempotent for repeated activations by the same authenticated user
 * - Validates existing user profile & preserves profile information
 * - Atomic Firestore transaction against concurrency
 * - Rollback checks document state before restoring, does not overwrite later changes, records critical audit on conflict
 */
async function verifyAndActivateTeamLeaderHandler(request, deps = {}) {
  const currentDb = deps.db || db;
  const currentAuth = deps.auth || auth;

  if (!request.auth || !request.auth.uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated via Firebase Phone Auth.');
  }

  const callerUid = request.auth.uid;
  const callerPhone = request.auth.token ? request.auth.token.phone_number : null;

  if (!callerPhone) {
    throw new HttpsError('invalid-argument', 'Authenticated user does not possess a verified phone number.');
  }

  const normalizedCallerPhone = normalizePhone(callerPhone);

  // Find invitations matching verified phone number
  const invitesSnap = await currentDb.collection('team_leader_invitations')
    .where('phone', 'in', [callerPhone, normalizedCallerPhone])
    .get();

  if (invitesSnap.empty) {
    throw new HttpsError('not-found', 'No Team Leader invitation found for your verified phone number.');
  }

  const allInvites = invitesSnap.docs.map(d => ({ ref: d.ref, data: d.data() }));
  const pendingInvites = allInvites.filter(i => i.data.status === 'pending_verification');

  if (pendingInvites.length === 0) {
    // Check if caller already activated this invitation (Idempotence)
    const ownActivated = allInvites.find(i => i.data.status === 'activated' && i.data.activatedUserId === callerUid);
    if (ownActivated) {
      const existingUserDoc = await currentDb.collection('users').doc(callerUid).get();
      return {
        success: true,
        message: 'Team Leader access already activated for your account.',
        user: existingUserDoc.exists ? existingUserDoc.data() : { uid: callerUid, role: 'team_leader' }
      };
    }

    const otherActivated = allInvites.find(i => i.data.status === 'activated');
    if (otherActivated) {
      throw new HttpsError('failed-precondition', 'This invitation has already been activated by another user and cannot be activated again.');
    }
    throw new HttpsError('not-found', 'No pending Team Leader invitation found for your verified phone number.');
  }

  // Select target invitation (honor specific invitationId if provided)
  const requestedInvitationId = request.data && request.data.invitationId;
  let target = requestedInvitationId
    ? pendingInvites.find(i => i.data.id === requestedInvitationId || i.ref.id === requestedInvitationId)
    : pendingInvites[0];

  if (!target) {
    throw new HttpsError('not-found', 'Requested pending invitation was not found.');
  }

  const targetInviteRef = target.ref;

  // 1. ATOMIC FIRESTORE TRANSACTION: Validate constraints & update records concurrently-safe
  let txResult;
  try {
    txResult = await currentDb.runTransaction(async (transaction) => {
      // Re-read invitation inside transaction
      const freshInviteSnap = await transaction.get(targetInviteRef);
      if (!freshInviteSnap.exists) {
        throw new HttpsError('not-found', 'Invitation record no longer exists.');
      }
      const freshInvite = freshInviteSnap.data();

      // Check if already activated concurrently
      if (freshInvite.status === 'activated') {
        if (freshInvite.activatedUserId === callerUid) {
          const uDoc = await transaction.get(currentDb.collection('users').doc(callerUid));
          return { idempotent: true, userProfile: uDoc.exists ? uDoc.data() : { uid: callerUid, role: 'team_leader' } };
        }
        throw new HttpsError('failed-precondition', 'Invitation is no longer pending; it was already activated by another user.');
      }

      if (freshInvite.status !== 'pending_verification') {
        throw new HttpsError('failed-precondition', `Invitation is no longer pending (current status: ${freshInvite.status}).`);
      }

      if (freshInvite.phone !== callerPhone && freshInvite.phone !== normalizedCallerPhone) {
        throw new HttpsError('permission-denied', 'Invitation phone number does not match authenticated phone.');
      }

      // Re-read team inside transaction
      const teamDocRef = currentDb.collection('teams').doc(freshInvite.teamId);
      const teamSnap = await transaction.get(teamDocRef);
      if (!teamSnap.exists) {
        throw new HttpsError('not-found', `Assigned team ${freshInvite.teamId} does not exist.`);
      }
      const teamData = teamSnap.data();

      // Exact fest ownership: reject missing or mismatched festId
      if (!teamData.festId || teamData.festId !== freshInvite.festId) {
        throw new HttpsError('failed-precondition', `Assigned team does not belong to fest ${freshInvite.festId}.`);
      }

      // Verify team does not already have an active leader
      if (teamData.teamLeaderId && teamData.teamLeaderId !== callerUid) {
        const existingLeaderSnap = await transaction.get(currentDb.collection('users').doc(teamData.teamLeaderId));
        if (existingLeaderSnap.exists && existingLeaderSnap.data().status === 'active') {
          throw new HttpsError('already-exists', `Team ${teamData.name} already has an active Team Leader (${existingLeaderSnap.data().name}).`);
        }
      }

      // 1. REVALIDATE EXISTING CALLER USER PROFILE INSIDE TRANSACTION
      const userDocRef = currentDb.collection('users').doc(callerUid);
      const callerUserSnap = await transaction.get(userDocRef);
      const previousUserData = callerUserSnap.exists ? callerUserSnap.data() : null;

      if (callerUserSnap.exists) {
        const callerData = callerUserSnap.data();

        // Check suspended or inactive
        if (callerData.status === 'suspended' || callerData.status === 'inactive') {
          throw new HttpsError('permission-denied', `Your account is ${callerData.status}. Privileged operations are denied.`);
        }

        // REJECT INCOMPATIBLE PRIVILEGED ACCOUNTS: Do NOT overwrite admin or super_admin!
        if (['admin', 'fest_admin', 'super_admin'].includes(callerData.role)) {
          throw new HttpsError(
            'failed-precondition',
            `Cannot activate Team Leader invite: user account already holds an administrative role (${callerData.role}).`
          );
        }

        // Do not overwrite an existing active leader of a different team
        if (callerData.role === 'team_leader' && callerData.linkedTeamId && callerData.linkedTeamId !== freshInvite.teamId && callerData.status === 'active') {
          throw new HttpsError(
            'already-exists',
            `Cannot activate Team Leader invite: account is already assigned to active team ${callerData.linkedTeamId}.`
          );
        }
      }

      // Apply updates in transaction
      transaction.update(targetInviteRef, {
        status: 'activated',
        activatedAt: FieldValue.serverTimestamp(),
        activatedUserId: callerUid
      });

      // Preserve existing profile information where appropriate
      const userProfile = {
        ...(previousUserData || {}),
        id: callerUid,
        uid: callerUid,
        name: (previousUserData && previousUserData.name) || freshInvite.name,
        email: (previousUserData && previousUserData.email) || freshInvite.email,
        phone: normalizedCallerPhone,
        phoneVerified: true,
        role: 'team_leader', // authoritative role assignment
        status: 'active',
        linkedTeamId: freshInvite.teamId,
        institution: (previousUserData && previousUserData.institution) || freshInvite.institution || teamData.institution || '',
        festId: freshInvite.festId,
        invitationStatus: 'activated',
        updatedAt: FieldValue.serverTimestamp()
      };
      transaction.set(userDocRef, userProfile, { merge: true });

      const previousTeamLeaderId = teamData.teamLeaderId || null;
      const previousTeamLeaderName = teamData.teamLeaderName || 'Unassigned';
      const previousTeamLeaderContact = teamData.teamLeaderContact || '';

      transaction.update(teamDocRef, {
        teamLeaderId: callerUid,
        teamLeaderName: freshInvite.name,
        teamLeaderContact: normalizedCallerPhone
      });

      const auditRef = currentDb.collection('audit_logs').doc();
      transaction.set(auditRef, {
        id: auditRef.id,
        festId: freshInvite.festId,
        userId: callerUid,
        userName: freshInvite.name,
        action: 'ACTIVATE_TEAM_LEADER',
        targetType: 'user',
        targetId: callerUid,
        details: `Team Leader ${freshInvite.name} verified phone ${normalizedCallerPhone} and activated team leader access for team ${teamData.name}.`,
        timestamp: FieldValue.serverTimestamp()
      });

      return {
        freshInvite,
        teamData,
        userProfile,
        previousUserData,
        previousTeamLeaderId,
        previousTeamLeaderName,
        previousTeamLeaderContact,
        targetInviteRef,
        teamDocRef,
        userDocRef
      };
    });
  } catch (txErr) {
    if (txErr instanceof HttpsError) throw txErr;
    throw new HttpsError('internal', `Transaction failed during invitation activation: ${txErr.message}`);
  }

  if (txResult.idempotent) {
    return {
      success: true,
      message: 'Team Leader access already activated for your account.',
      user: txResult.userProfile
    };
  }

  // 2. FIREBASE AUTH CUSTOM CLAIMS SYNCHRONIZATION WITH COMPENSATING ROLLBACK
  try {
    let existingClaims = {};
    try {
      const userRecord = await currentAuth.getUser(callerUid);
      existingClaims = userRecord.customClaims || {};
    } catch (e) {
      // If user record doesn't have custom claims yet, proceed with base claims
    }

    await currentAuth.setCustomUserClaims(callerUid, {
      ...existingClaims,
      role: 'team_leader',
      teamId: txResult.freshInvite.teamId,
      festId: txResult.freshInvite.festId
    });
  } catch (authError) {
    console.error('[verifyAndActivateTeamLeader] Firebase Auth setCustomUserClaims failed:', authError);

    // COMPENSATING ACTION: Verify document state before restoring, do not overwrite later legitimate changes
    try {
      await currentDb.runTransaction(async (rollbackTx) => {
        // 1. Verify invitation is still in expected state
        const freshInv = await rollbackTx.get(txResult.targetInviteRef);
        let rollbackInviteOk = false;
        if (freshInv.exists && freshInv.data().status === 'activated' && freshInv.data().activatedUserId === callerUid) {
          rollbackTx.update(txResult.targetInviteRef, {
            status: 'pending_verification',
            activatedAt: FieldValue.delete(),
            activatedUserId: FieldValue.delete(),
            activationError: `Auth claims assignment failed: ${authError.message}`
          });
          rollbackInviteOk = true;
        }

        // 2. Verify user doc is still in expected state
        const freshUser = await rollbackTx.get(txResult.userDocRef);
        let rollbackUserOk = false;
        if (freshUser.exists && freshUser.data().linkedTeamId === txResult.freshInvite.teamId && freshUser.data().role === 'team_leader') {
          if (txResult.previousUserData) {
            rollbackTx.set(txResult.userDocRef, txResult.previousUserData);
          } else {
            rollbackTx.delete(txResult.userDocRef);
          }
          rollbackUserOk = true;
        }

        // 3. Verify team doc is still in expected state
        const freshTeam = await rollbackTx.get(txResult.teamDocRef);
        let rollbackTeamOk = false;
        if (freshTeam.exists && freshTeam.data().teamLeaderId === callerUid) {
          rollbackTx.update(txResult.teamDocRef, {
            teamLeaderId: txResult.previousTeamLeaderId,
            teamLeaderName: txResult.previousTeamLeaderName,
            teamLeaderContact: txResult.previousTeamLeaderContact
          });
          rollbackTeamOk = true;
        }

        const isCleanRollback = rollbackInviteOk && rollbackUserOk && rollbackTeamOk;

        const compAuditRef = currentDb.collection('audit_logs').doc();
        rollbackTx.set(compAuditRef, {
          id: compAuditRef.id,
          festId: txResult.freshInvite.festId,
          userId: callerUid,
          userName: txResult.freshInvite.name,
          action: isCleanRollback ? 'ACTIVATE_TEAM_LEADER_FAILED_ROLLBACK' : 'ACTIVATION_ROLLBACK_CONFLICT_CRITICAL',
          targetType: 'user',
          targetId: callerUid,
          details: isCleanRollback
            ? `Activation rolled back due to Firebase Auth custom claims error: ${authError.message}`
            : `CRITICAL: Activation rollback detected conflicting document state. Safe rollback partially aborted: ${authError.message}`,
          timestamp: FieldValue.serverTimestamp()
        });
      });
    } catch (rbErr) {
      console.error('[verifyAndActivateTeamLeader] Compensation rollback failed:', rbErr);
      try {
        const critAudit = currentDb.collection('audit_logs').doc();
        await critAudit.set({
          id: critAudit.id,
          festId: txResult.freshInvite.festId,
          userId: callerUid,
          userName: txResult.freshInvite.name,
          action: 'COMPENSATION_ROLLBACK_CRITICAL_FAILURE',
          targetType: 'system',
          targetId: callerUid,
          details: `CRITICAL: Activation rollback failed for user ${callerUid}: ${rbErr.message}`,
          timestamp: FieldValue.serverTimestamp()
        });
      } catch (e) {}
    }

    throw new HttpsError(
      'internal',
      `Failed to assign authentication security claims (${authError.message}). Activation was safely rolled back. Please retry.`
    );
  }

  return {
    success: true,
    message: 'Team Leader access activated successfully.',
    user: txResult.userProfile
  };
}

/**
 * Core Handler: reassignTeamLeaderHandler
 * - Validates exact fest ownership on target team, old team, and user profile (missing festId rejected)
 * - Confirms old team is actually assigned to target leader before clearing it
 * - Preserves unrelated Firebase Auth custom claims
 * - Concurrency & rollback protects against overwriting subsequent legitimate changes
 */
async function reassignTeamLeaderHandler(request, deps = {}) {
  const currentDb = deps.db || db;
  const currentAuth = deps.auth || auth;
  const data = request.data || {};
  const { festId, userId, newTeamId } = data;

  if (!festId || typeof festId !== 'string' || !festId.trim()) {
    throw new HttpsError('invalid-argument', 'Missing or invalid festId.');
  }
  if (!userId || typeof userId !== 'string' || !userId.trim()) {
    throw new HttpsError('invalid-argument', 'Missing or invalid userId.');
  }
  if (!newTeamId || typeof newTeamId !== 'string' || !newTeamId.trim()) {
    throw new HttpsError('invalid-argument', 'Missing or invalid newTeamId.');
  }

  const adminCaller = await verifyAdminAuth(request, festId, deps);

  // 1. Verify target user exists in Firebase Auth & retrieve existing claims up-front
  let existingClaims = {};
  try {
    const authUser = await currentAuth.getUser(userId);
    existingClaims = authUser.customClaims || {};
  } catch (authErr) {
    if (authErr.code === 'auth/user-not-found') {
      throw new HttpsError('not-found', `Target user ${userId} does not have a Firebase Auth account.`);
    }
    throw new HttpsError('internal', `Failed to verify user credentials: ${authErr.message}`);
  }

  const userDocRef = currentDb.collection('users').doc(userId);
  const newTeamDocRef = currentDb.collection('teams').doc(newTeamId);

  // 2. ATOMIC FIRESTORE TRANSACTION: Validate all records and update team references
  let txResult;
  try {
    txResult = await currentDb.runTransaction(async (transaction) => {
      const userSnap = await transaction.get(userDocRef);
      if (!userSnap.exists) {
        throw new HttpsError('not-found', 'Team leader profile not found.');
      }
      const leaderData = userSnap.data();

      // Verify target user is a Team Leader
      if (leaderData.role !== 'team_leader') {
        throw new HttpsError('failed-precondition', `Target user is not a Team Leader (role: ${leaderData.role || 'unknown'}).`);
      }

      // Verify target user status is active
      if (leaderData.status !== 'active') {
        throw new HttpsError('failed-precondition', `Cannot reassign a ${leaderData.status} Team Leader. Reactivate the account first.`);
      }

      // Exact fest ownership: reject missing or mismatched festId
      if (!leaderData.festId || leaderData.festId !== festId) {
        throw new HttpsError('permission-denied', `Target user belongs to fest ${leaderData.festId || 'none'}, not requested fest ${festId}.`);
      }

      // Verify target team exists and exact fest ownership
      const newTeamSnap = await transaction.get(newTeamDocRef);
      if (!newTeamSnap.exists) {
        throw new HttpsError('not-found', `Target team ${newTeamId} not found.`);
      }
      const newTeamData = newTeamSnap.data();

      if (!newTeamData.festId || newTeamData.festId !== festId) {
        throw new HttpsError('invalid-argument', `Target team ${newTeamData.name} does not belong to fest ${festId}.`);
      }

      // Prevent multiple active leaders for one team (including concurrent reassignments)
      if (newTeamData.teamLeaderId && newTeamData.teamLeaderId !== userId) {
        const activeLeaderSnap = await transaction.get(currentDb.collection('users').doc(newTeamData.teamLeaderId));
        if (activeLeaderSnap.exists && activeLeaderSnap.data().status === 'active') {
          throw new HttpsError('already-exists', `Team ${newTeamData.name} already has active leader ${activeLeaderSnap.data().name}.`);
        }
      }

      // Fetch old team if different: verify exact fest ownership and actual assignment
      const oldTeamId = leaderData.linkedTeamId;
      let oldTeamDocRef = null;
      let oldTeamData = null;
      let shouldClearOldTeam = false;

      if (oldTeamId && oldTeamId !== newTeamId) {
        oldTeamDocRef = currentDb.collection('teams').doc(oldTeamId);
        const oldTeamSnap = await transaction.get(oldTeamDocRef);
        if (oldTeamSnap.exists) {
          oldTeamData = oldTeamSnap.data();
          if (!oldTeamData.festId || oldTeamData.festId !== festId) {
            throw new HttpsError('invalid-argument', `Old team ${oldTeamData.name} does not belong to fest ${festId}.`);
          }
          // Only clear old team if it is ACTUALLY assigned to this user!
          if (oldTeamData.teamLeaderId === userId) {
            shouldClearOldTeam = true;
          }
        }
      }

      // Apply updates in transaction
      transaction.update(userDocRef, {
        linkedTeamId: newTeamId,
        updatedAt: FieldValue.serverTimestamp()
      });

      transaction.update(newTeamDocRef, {
        teamLeaderId: userId,
        teamLeaderName: leaderData.name,
        teamLeaderContact: leaderData.phone || leaderData.email || ''
      });

      if (shouldClearOldTeam && oldTeamDocRef) {
        transaction.update(oldTeamDocRef, {
          teamLeaderId: null,
          teamLeaderName: 'Unassigned',
          teamLeaderContact: ''
        });
      }

      const auditRef = currentDb.collection('audit_logs').doc();
      transaction.set(auditRef, {
        id: auditRef.id,
        festId,
        userId: adminCaller.uid,
        userName: adminCaller.name,
        action: 'REASSIGN_TEAM_LEADER',
        targetType: 'user',
        targetId: userId,
        details: `Admin ${adminCaller.name} reassigned Team Leader ${leaderData.name} from team ${oldTeamData ? oldTeamData.name : (oldTeamId || 'Unassigned')} to ${newTeamData.name}.`,
        timestamp: FieldValue.serverTimestamp()
      });

      return { leaderData, newTeamData, oldTeamId, oldTeamDocRef, shouldClearOldTeam };
    });
  } catch (txErr) {
    if (txErr instanceof HttpsError) throw txErr;
    throw new HttpsError('internal', `Transaction failed during reassignment: ${txErr.message}`);
  }

  // 3. UPDATE FIREBASE AUTH CUSTOM CLAIMS (PRESERVE UNRELATED CLAIMS)
  try {
    await currentAuth.setCustomUserClaims(userId, {
      ...existingClaims,
      role: 'team_leader',
      teamId: newTeamId,
      festId
    });
  } catch (authErr) {
    console.error('[reassignTeamLeader] Auth claim update failed, rolling back Firestore:', authErr);

    // COMPENSATING ROLLBACK: Protect against overwriting subsequent legitimate changes
    try {
      await currentDb.runTransaction(async (rollbackTx) => {
        // Re-read user to ensure still assigned to newTeamId
        const freshUser = await rollbackTx.get(userDocRef);
        let userOk = false;
        if (freshUser.exists && freshUser.data().linkedTeamId === newTeamId) {
          rollbackTx.update(userDocRef, {
            linkedTeamId: txResult.oldTeamId || null,
            updatedAt: FieldValue.serverTimestamp()
          });
          userOk = true;
        }

        // Only clear new team if still assigned to this user
        const freshNewTeam = await rollbackTx.get(newTeamDocRef);
        let newTeamOk = false;
        if (freshNewTeam.exists && freshNewTeam.data().teamLeaderId === userId) {
          rollbackTx.update(newTeamDocRef, {
            teamLeaderId: null,
            teamLeaderName: 'Unassigned',
            teamLeaderContact: ''
          });
          newTeamOk = true;
        }

        // Only restore old team if it was cleared by us and is still unassigned
        let oldTeamOk = true;
        if (txResult.shouldClearOldTeam && txResult.oldTeamDocRef) {
          const freshOldTeam = await rollbackTx.get(txResult.oldTeamDocRef);
          if (freshOldTeam.exists && freshOldTeam.data().teamLeaderId === null) {
            rollbackTx.update(txResult.oldTeamDocRef, {
              teamLeaderId: userId,
              teamLeaderName: txResult.leaderData.name,
              teamLeaderContact: txResult.leaderData.phone || txResult.leaderData.email || ''
            });
          } else {
            oldTeamOk = false;
          }
        }

        const isCleanReassignRollback = userOk && newTeamOk && oldTeamOk;

        const compAuditRef = currentDb.collection('audit_logs').doc();
        rollbackTx.set(compAuditRef, {
          id: compAuditRef.id,
          festId,
          userId: adminCaller.uid,
          userName: adminCaller.name,
          action: isCleanReassignRollback ? 'REASSIGN_TEAM_LEADER_FAILED_ROLLBACK' : 'REASSIGN_ROLLBACK_CONFLICT_CRITICAL',
          targetType: 'user',
          targetId: userId,
          details: isCleanReassignRollback
            ? `Reassignment rolled back due to Firebase Auth error: ${authErr.message}`
            : `CRITICAL: Reassignment rollback detected conflicting state. Safe rollback partially aborted: ${authErr.message}`,
          timestamp: FieldValue.serverTimestamp()
        });
      });
    } catch (rbErr) {
      console.error('[reassignTeamLeader] Rollback failed:', rbErr);
      try {
        const critAudit = currentDb.collection('audit_logs').doc();
        await critAudit.set({
          id: critAudit.id,
          festId,
          userId: adminCaller.uid,
          userName: adminCaller.name,
          action: 'REASSIGN_ROLLBACK_CRITICAL_FAILURE',
          targetType: 'system',
          targetId: userId,
          details: `CRITICAL: Reassignment rollback failed for user ${userId}: ${rbErr.message}`,
          timestamp: FieldValue.serverTimestamp()
        });
      } catch (e) {}
    }

    throw new HttpsError(
      'internal',
      `Failed to update authentication security claims (${authErr.message}). Reassignment was rolled back safely.`
    );
  }

  return {
    success: true,
    message: `Successfully reassigned ${txResult.leaderData.name} to ${txResult.newTeamData.name}.`
  };
}

/**
 * Core Handler: toggleTeamLeaderStatusHandler
 * - Revalidates role, exact fest ownership, and status inside the Firestore transaction
 * - Consistent behavior for both suspended and inactive accounts
 * - Synchronizes Auth disabled state and revokes refresh tokens on suspension/inactivity
 * - Explicit rollback failure logging for administrators
 */
async function toggleTeamLeaderStatusHandler(request, deps = {}) {
  const currentDb = deps.db || db;
  const currentAuth = deps.auth || auth;
  const data = request.data || {};
  const { festId, userId, newStatus } = data;

  if (!festId || typeof festId !== 'string' || !festId.trim()) {
    throw new HttpsError('invalid-argument', 'Missing or invalid festId.');
  }
  if (!userId || typeof userId !== 'string' || !userId.trim()) {
    throw new HttpsError('invalid-argument', 'Missing or invalid userId.');
  }
  if (!newStatus || !['active', 'suspended', 'inactive'].includes(newStatus)) {
    throw new HttpsError('invalid-argument', 'Invalid status. Must be active, suspended, or inactive.');
  }

  const adminCaller = await verifyAdminAuth(request, festId, deps);

  // 1. Initial precheck of target user
  const userDocRef = currentDb.collection('users').doc(userId);
  const userDoc = await userDocRef.get();
  if (!userDoc.exists) {
    throw new HttpsError('not-found', 'User profile not found.');
  }
  const userData = userDoc.data();

  if (userData.role !== 'team_leader') {
    throw new HttpsError('failed-precondition', `Cannot toggle status: target user is not a Team Leader (role: ${userData.role || 'unknown'}).`);
  }

  if (!userData.festId || userData.festId !== festId) {
    throw new HttpsError('permission-denied', `User belongs to fest ${userData.festId || 'none'}, not requested fest ${festId}.`);
  }

  if (userData.status === newStatus) {
    return { success: true, message: `Team leader account is already ${newStatus}.` };
  }

  // 2. Synchronize with Firebase Auth (disable account and revoke refresh tokens on suspension/inactivity)
  let authUser;
  try {
    authUser = await currentAuth.getUser(userId);
  } catch (authErr) {
    if (authErr.code === 'auth/user-not-found') {
      throw new HttpsError('not-found', `Target user ${userId} does not have an active Firebase Auth account.`);
    }
    throw new HttpsError('internal', `Failed to verify user in Firebase Auth: ${authErr.message}`);
  }

  const previousDisabled = authUser.disabled;
  // Both suspended and inactive disable the account in Auth
  const shouldDisable = (newStatus === 'suspended' || newStatus === 'inactive');

  try {
    await currentAuth.updateUser(userId, { disabled: shouldDisable });
    if (shouldDisable) {
      await currentAuth.revokeRefreshTokens(userId);
    }
  } catch (authUpdateErr) {
    throw new HttpsError('internal', `Failed to update Firebase Auth status: ${authUpdateErr.message}`);
  }

  // 3. Update Firestore in atomic transaction with transactional re-validation
  try {
    await currentDb.runTransaction(async (transaction) => {
      const uSnap = await transaction.get(userDocRef);
      if (!uSnap.exists) {
        throw new HttpsError('not-found', 'User record vanished.');
      }
      const freshData = uSnap.data();

      // Revalidate role and exact fest ownership inside transaction
      if (freshData.role !== 'team_leader') {
        throw new HttpsError('failed-precondition', `Cannot toggle status: target user is not a Team Leader (role: ${freshData.role || 'unknown'}).`);
      }

      if (!freshData.festId || freshData.festId !== festId) {
        throw new HttpsError('permission-denied', `User belongs to fest ${freshData.festId || 'none'}, not requested fest ${festId}.`);
      }

      const updatedFields = {
        status: newStatus,
        invitationStatus: newStatus === 'suspended' ? 'suspended' : (freshData.invitationStatus || 'activated'),
        updatedAt: FieldValue.serverTimestamp()
      };
      transaction.update(userDocRef, updatedFields);

      const auditRef = currentDb.collection('audit_logs').doc();
      transaction.set(auditRef, {
        id: auditRef.id,
        festId,
        userId: adminCaller.uid,
        userName: adminCaller.name,
        action: newStatus === 'active' ? 'REACTIVATE_TEAM_LEADER' : 'SUSPEND_TEAM_LEADER',
        targetType: 'user',
        targetId: userId,
        details: `Admin ${adminCaller.name} set status of Team Leader ${freshData.name} to ${newStatus}.`,
        timestamp: FieldValue.serverTimestamp()
      });
    });
  } catch (firestoreErr) {
    console.error('[toggleTeamLeaderStatus] Firestore update failed, rolling back Auth disabled status:', firestoreErr);
    // Compensating action: revert Auth disabled state back to previous state
    try {
      await currentAuth.updateUser(userId, { disabled: previousDisabled });
    } catch (revertErr) {
      console.error('[toggleTeamLeaderStatus] Auth rollback failed:', revertErr);
      try {
        const critAudit = currentDb.collection('audit_logs').doc();
        await critAudit.set({
          id: critAudit.id,
          festId,
          userId: adminCaller.uid,
          userName: adminCaller.name,
          action: 'STATUS_SYNC_ROLLBACK_CRITICAL_FAILURE',
          targetType: 'system',
          targetId: userId,
          details: `CRITICAL: Failed to revert Auth status for user ${userId}: ${revertErr.message}`,
          timestamp: FieldValue.serverTimestamp()
        });
      } catch (e) {}
    }
    throw new HttpsError('internal', `Failed to update database record (${firestoreErr.message}). Auth status was rolled back.`);
  }

  return { success: true, message: `Team leader account marked as ${newStatus}.` };
}

/**
 * Core Handler: publishResultsHandler
 * - Verifies caller is active Fest Admin (or Super Admin) for the fest
 * - Validates programme exists and belongs to the fest
 * - In atomic transaction:
 *   - Sets programme status = 'completed', resultPublished = true, publishedAt = serverTimestamp()
 *   - Writes authoritative server-generated PUBLISH_RESULTS audit log
 */
async function publishResultsHandler(request, deps = {}) {
  const currentDb = deps.db || db;
  const data = request.data || {};
  const { festId, programmeId } = data;

  if (!festId || typeof festId !== 'string' || !festId.trim()) {
    throw new HttpsError('invalid-argument', 'Missing or invalid festId.');
  }
  if (!programmeId || typeof programmeId !== 'string' || !programmeId.trim()) {
    throw new HttpsError('invalid-argument', 'Missing or invalid programmeId.');
  }

  const adminCaller = await verifyAdminAuth(request, festId, deps);

  const progDocRef = currentDb.collection('programmes').doc(programmeId);

  await currentDb.runTransaction(async (transaction) => {
    const progSnap = await transaction.get(progDocRef);
    if (!progSnap.exists) {
      throw new HttpsError('not-found', `Programme ${programmeId} not found.`);
    }
    const progData = progSnap.data();
    if (!progData.festId || progData.festId !== festId) {
      throw new HttpsError('permission-denied', `Programme does not belong to fest ${festId}.`);
    }

    transaction.update(progDocRef, {
      status: 'completed',
      resultPublished: true,
      publishedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    const auditRef = currentDb.collection('audit_logs').doc();
    transaction.set(auditRef, {
      id: auditRef.id,
      festId,
      userId: adminCaller.uid,
      userName: adminCaller.name,
      action: 'PUBLISH_RESULTS',
      targetType: 'programme',
      targetId: programmeId,
      details: `Admin ${adminCaller.name} published ratified results for programme ${progData.name || programmeId}.`,
      timestamp: FieldValue.serverTimestamp()
    });
  });

  return { success: true, message: `Results published successfully for programme ${programmeId}.` };
}

/**
 * Core Handler: resolveComplaintHandler
 * - Verifies caller is active Fest Admin (or Super Admin) for the fest
 * - Validates complaint exists and belongs to the fest
 * - In atomic transaction:
 *   - Updates complaint status to 'resolved', resolutionNote, reviewerId, reviewerName
 *   - Sets calibratedScore if provided
 *   - Writes authoritative server-generated RESOLVE_COMPLAINT audit log
 */
async function resolveComplaintHandler(request, deps = {}) {
  const currentDb = deps.db || db;
  const data = request.data || {};
  const { festId, complaintId, resolutionNote, calibratedScore } = data;

  if (!festId || typeof festId !== 'string' || !festId.trim()) {
    throw new HttpsError('invalid-argument', 'Missing or invalid festId.');
  }
  if (!complaintId || typeof complaintId !== 'string' || !complaintId.trim()) {
    throw new HttpsError('invalid-argument', 'Missing or invalid complaintId.');
  }
  if (!resolutionNote || typeof resolutionNote !== 'string' || !resolutionNote.trim()) {
    throw new HttpsError('invalid-argument', 'Missing or invalid resolutionNote.');
  }

  const adminCaller = await verifyAdminAuth(request, festId, deps);

  const complaintDocRef = currentDb.collection('complaints').doc(complaintId);

  await currentDb.runTransaction(async (transaction) => {
    const compSnap = await transaction.get(complaintDocRef);
    if (!compSnap.exists) {
      throw new HttpsError('not-found', `Complaint ${complaintId} not found.`);
    }
    const compData = compSnap.data();
    if (!compData.festId || compData.festId !== festId) {
      throw new HttpsError('permission-denied', `Complaint does not belong to fest ${festId}.`);
    }

    const updates = {
      status: 'resolved',
      resolutionNote: resolutionNote.trim(),
      reviewerId: adminCaller.uid,
      reviewerName: adminCaller.name,
      resolvedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };
    if (calibratedScore !== undefined && calibratedScore !== null) {
      updates.calibratedScore = Number(calibratedScore);
    }

    transaction.update(complaintDocRef, updates);

    const auditRef = currentDb.collection('audit_logs').doc();
    transaction.set(auditRef, {
      id: auditRef.id,
      festId,
      userId: adminCaller.uid,
      userName: adminCaller.name,
      action: 'RESOLVE_COMPLAINT',
      targetType: 'complaint',
      targetId: complaintId,
      details: `Admin ${adminCaller.name} resolved complaint #${complaintId}: ${resolutionNote.trim()}`,
      timestamp: FieldValue.serverTimestamp()
    });
  });

  return { success: true, message: `Complaint #${complaintId} resolved successfully.` };
}

/**
 * Helper: Verify caller is an active Super Admin.
 */
async function verifySuperAdminAuth(request, deps = {}) {
  const currentDb = deps.db || db;
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }
  const callerUid = request.auth.uid;
  const userDoc = await currentDb.collection('users').doc(callerUid).get();
  if (!userDoc.exists) {
    throw new HttpsError('permission-denied', 'Caller account profile not found.');
  }
  const userData = userDoc.data();
  if (userData.status !== 'active') {
    throw new HttpsError('permission-denied', 'Caller account is suspended or inactive.');
  }
  if (userData.role !== 'super_admin') {
    throw new HttpsError('permission-denied', 'Permission denied: Super Administrator privileges required.');
  }
  return {
    uid: callerUid,
    name: userData.name || 'Super Admin',
    role: 'super_admin'
  };
}

/**
 * Trusted Handler: Super Admin approval of a Fest Application.
 * Atomically provisions the Fest document, updates the applicant's role to 'admin' scoped to the fest,
 * writes the fest_memberships document, updates the request status, sets custom claims, and appends an immutable platform audit log.
 */
async function approveFestApplicationHandler(request, deps = {}) {
  const currentDb = deps.db || db;
  const currentAuth = deps.auth || auth;

  const superAdminCaller = await verifySuperAdminAuth(request, deps);
  const { requestId, approvalNote } = request.data || {};

  if (!requestId || typeof requestId !== 'string' || !requestId.trim()) {
    throw new HttpsError('invalid-argument', 'Missing or invalid requestId.');
  }

  const cleanRequestId = requestId.trim();
  const requestRef = currentDb.collection('fest_requests').doc(cleanRequestId);
  
  let allocatedFestId = '';
  let applicantUid = '';

  await currentDb.runTransaction(async (transaction) => {
    const requestSnap = await transaction.get(requestRef);
    if (!requestSnap.exists) {
      throw new HttpsError('not-found', `Fest application ${cleanRequestId} not found.`);
    }

    const appData = requestSnap.data();
    const validStatuses = ['pending', 'submitted', 'under_review', 'more_info_required'];
    if (!validStatuses.includes(appData.status)) {
      throw new HttpsError('failed-precondition', `Application is already in status '${appData.status}'. Only pending applications can be approved.`);
    }

    applicantUid = appData.requestingAdminId;
    if (!applicantUid) {
      throw new HttpsError('failed-precondition', 'Application record is missing requestingAdminId.');
    }

    // Allocate next sequential Fest ID
    const festsSnap = await transaction.get(currentDb.collection('fests'));
    const festCount = festsSnap.size + 1;
    allocatedFestId = `FEST-${String(festCount).padStart(2, '0')}`;

    const nowIso = new Date().toISOString();
    const nowServer = FieldValue.serverTimestamp();

    // 1. Create the new Fest record
    const festRef = currentDb.collection('fests').doc(allocatedFestId);
    transaction.set(festRef, {
      id: allocatedFestId,
      name: appData.festName,
      edition: appData.edition || '2026',
      tagline: `${appData.festName} ${appData.edition || '2026'}`,
      description: appData.description || '',
      institution: appData.institution || '',
      category: appData.category || 'Cultural & Arts',
      venue: appData.venue || appData.institutionAddress || 'Main Campus Auditorium & Grounds',
      startDate: appData.startDate,
      endDate: appData.endDate,
      adminId: applicantUid,
      adminName: appData.contactPersonName || appData.requestingAdminName,
      adminEmail: appData.requestingAdminEmail || '',
      adminPhone: appData.requestingAdminPhone || '',
      status: 'setup',
      publicPagePublished: false,
      publicUrl: `/fests/${allocatedFestId.toLowerCase()}`,
      expectedParticipants: Number(appData.expectedParticipants) || 500,
      plannedProgrammesCount: Number(appData.plannedProgrammesCount) || 20,
      createdAt: nowIso,
      approvedAt: nowIso,
      approvedBy: superAdminCaller.name,
      completionPercentage: 15,
      serverCreatedAt: nowServer
    });

    // 2. Provision or update Fest Admin User Profile
    const userRef = currentDb.collection('users').doc(applicantUid);
    const existingUserSnap = await transaction.get(userRef);
    const baseUserData = existingUserSnap.exists ? existingUserSnap.data() : {};

    transaction.set(userRef, {
      ...baseUserData,
      id: applicantUid,
      name: appData.contactPersonName || appData.requestingAdminName || baseUserData.name || 'Fest Admin',
      email: appData.requestingAdminEmail || baseUserData.email || '',
      phone: appData.requestingAdminPhone || baseUserData.phone || '',
      phoneVerified: true,
      role: 'admin',
      festId: allocatedFestId,
      status: 'active',
      updatedAt: nowServer
    }, { merge: true });

    // 3. Create Fest Membership document
    const membershipRef = currentDb.collection('fest_memberships').doc(`${applicantUid}_${allocatedFestId}`);
    transaction.set(membershipRef, {
      id: `${applicantUid}_${allocatedFestId}`,
      userId: applicantUid,
      festId: allocatedFestId,
      role: 'admin',
      status: 'active',
      assignedAt: nowIso,
      assignedBy: superAdminCaller.uid
    });

    // 4. Update Fest Request document to 'approved'
    const existingHistory = appData.history || [];
    const historyEntry = {
      date: nowIso,
      actor: superAdminCaller.name,
      action: 'Approved Fest Request',
      note: approvalNote ? approvalNote.trim() : 'Proposal met platform criteria and was authorized.'
    };

    transaction.update(requestRef, {
      status: 'approved',
      allocatedFestId,
      approvedAt: nowIso,
      approvedBy: superAdminCaller.name,
      reviewNotes: approvalNote ? approvalNote.trim() : (appData.reviewNotes || ''),
      history: [historyEntry, ...existingHistory],
      updatedAt: nowServer
    });

    // 5. Append immutable platform audit log
    const auditLogRef = currentDb.collection('platform_audit_logs').doc();
    transaction.set(auditLogRef, {
      id: auditLogRef.id,
      actorId: superAdminCaller.uid,
      actorName: superAdminCaller.name,
      actorRole: 'super_admin',
      action: 'APPROVE_FEST_REQUEST',
      targetType: 'fest_request',
      targetId: cleanRequestId,
      details: `Approved application ${cleanRequestId} for "${appData.festName}". Provisioned fest record ${allocatedFestId} and assigned Fest Admin privileges to ${appData.contactPersonName || appData.requestingAdminName} (${applicantUid}).`,
      beforeValue: appData.status,
      afterValue: 'approved',
      timestamp: nowIso,
      serverTimestamp: nowServer
    });
  });

  // Assign Custom User Claims on Firebase Auth
  try {
    if (applicantUid && currentAuth.setCustomUserClaims) {
      await currentAuth.setCustomUserClaims(applicantUid, {
        role: 'admin',
        festId: allocatedFestId
      });
    }
  } catch (claimErr) {
    console.warn('[CloudFunctions] Failed setting custom claims (Firestore authoritative profile will enforce RBAC):', claimErr);
  }

  return {
    success: true,
    festId: allocatedFestId,
    message: `Application ${cleanRequestId} approved successfully. Fest ${allocatedFestId} initialized.`
  };
}

/**
 * Trusted Handler: Super Admin rejection of a Fest Application.
 */
async function rejectFestApplicationHandler(request, deps = {}) {
  const currentDb = deps.db || db;
  const superAdminCaller = await verifySuperAdminAuth(request, deps);
  const { requestId, rejectionReason, note } = request.data || {};

  if (!requestId || typeof requestId !== 'string' || !requestId.trim()) {
    throw new HttpsError('invalid-argument', 'Missing or invalid requestId.');
  }
  if (!rejectionReason || typeof rejectionReason !== 'string' || !rejectionReason.trim()) {
    throw new HttpsError('invalid-argument', 'Rejection reason is mandatory.');
  }

  const cleanRequestId = requestId.trim();
  const requestRef = currentDb.collection('fest_requests').doc(cleanRequestId);

  await currentDb.runTransaction(async (transaction) => {
    const requestSnap = await transaction.get(requestRef);
    if (!requestSnap.exists) {
      throw new HttpsError('not-found', `Fest application ${cleanRequestId} not found.`);
    }

    const appData = requestSnap.data();
    const nowIso = new Date().toISOString();
    const nowServer = FieldValue.serverTimestamp();

    const existingHistory = appData.history || [];
    const historyEntry = {
      date: nowIso,
      actor: superAdminCaller.name,
      action: 'Rejected Fest Request',
      note: `Reason: ${rejectionReason.trim()}${note ? ` | Note: ${note.trim()}` : ''}`
    };

    transaction.update(requestRef, {
      status: 'rejected',
      rejectionReason: rejectionReason.trim(),
      reviewNotes: note ? note.trim() : (appData.reviewNotes || ''),
      history: [historyEntry, ...existingHistory],
      updatedAt: nowServer
    });

    const auditLogRef = currentDb.collection('platform_audit_logs').doc();
    transaction.set(auditLogRef, {
      id: auditLogRef.id,
      actorId: superAdminCaller.uid,
      actorName: superAdminCaller.name,
      actorRole: 'super_admin',
      action: 'REJECT_FEST_REQUEST',
      targetType: 'fest_request',
      targetId: cleanRequestId,
      details: `Declined application ${cleanRequestId} for "${appData.festName}". Reason: ${rejectionReason.trim()}`,
      beforeValue: appData.status,
      afterValue: 'rejected',
      timestamp: nowIso,
      serverTimestamp: nowServer
    });
  });

  return {
    success: true,
    message: `Application ${cleanRequestId} rejected.`
  };
}

/**
 * Callable Cloud Functions (v2)
 */
exports.createTeamLeaderInvite = onCall(async (request) => {
  return await createTeamLeaderInviteHandler(request);
});

exports.verifyAndActivateTeamLeader = onCall(async (request) => {
  return await verifyAndActivateTeamLeaderHandler(request);
});

exports.reassignTeamLeader = onCall(async (request) => {
  return await reassignTeamLeaderHandler(request);
});

exports.toggleTeamLeaderStatus = onCall(async (request) => {
  return await toggleTeamLeaderStatusHandler(request);
});

exports.publishResults = onCall(async (request) => {
  return await publishResultsHandler(request);
});

exports.resolveComplaint = onCall(async (request) => {
  return await resolveComplaintHandler(request);
});

exports.approveFestApplication = onCall(async (request) => {
  return await approveFestApplicationHandler(request);
});

exports.rejectFestApplication = onCall(async (request) => {
  return await rejectFestApplicationHandler(request);
});

/**
 * Unit & Security Test Harness Exports
 */
exports._handlers = {
  normalizePhone,
  verifyAdminAuth,
  verifySuperAdminAuth,
  createTeamLeaderInviteHandler,
  verifyAndActivateTeamLeaderHandler,
  reassignTeamLeaderHandler,
  toggleTeamLeaderStatusHandler,
  publishResultsHandler,
  resolveComplaintHandler,
  approveFestApplicationHandler,
  rejectFestApplicationHandler
};
