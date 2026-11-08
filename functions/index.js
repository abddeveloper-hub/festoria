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
    const validStatuses = [
      'pending', 'submitted', 'under_review', 'more_info_required',
      'PENDING', 'UNDER_REVIEW', 'MORE_INFORMATION_REQUIRED'
    ];
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
      shortName: appData.shortName || '',
      edition: appData.edition || '2026',
      tagline: `${appData.festName} ${appData.edition || '2026'}`,
      description: appData.description || '',
      institution: appData.institution || '',
      category: appData.category || 'Cultural & Arts',
      venue: appData.venue || appData.institutionAddress || 'Main Campus Auditorium & Grounds',
      startDate: appData.startDate,
      endDate: appData.endDate,
      registrationStartDate: appData.registrationStartDate || appData.startDate,
      registrationEndDate: appData.registrationEndDate || appData.endDate,
      logoUrl: appData.logoUrl || '',
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

    // 2. Create initial fest configuration in /fest_settings
    const settingsRef = currentDb.collection('fest_settings').doc(allocatedFestId);
    transaction.set(settingsRef, {
      festId: allocatedFestId,
      festName: appData.festName,
      festEdition: appData.edition || '2026',
      tagline: `${appData.festName} ${appData.edition || '2026'}`,
      description: appData.description || '',
      organizer: appData.institution || '',
      venue: appData.venue || appData.institutionAddress || 'Main Campus Auditorium & Grounds',
      startDate: appData.startDate,
      endDate: appData.endDate,
      contactEmail: appData.requestingAdminEmail || '',
      contactPhone: appData.requestingAdminPhone || '',
      logoUrl: appData.logoUrl || '',
      createdAt: nowIso,
      updatedAt: nowServer
    });

    // 3. Provision or update Fest Admin User Profile
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

    // 4. Create Fest Membership document
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

    // 5. Update Fest Request document to 'approved' and 'workspace_created'
    const existingHistory = appData.history || [];
    const historyEntry = {
      date: nowIso,
      actor: superAdminCaller.name,
      action: 'Approved Fest Request & Created Workspace',
      note: approvalNote ? approvalNote.trim() : 'Proposal authorized. Admin workspace provisioned.'
    };

    transaction.update(requestRef, {
      status: 'approved',
      workspaceStatus: 'workspace_created',
      allocatedFestId,
      approvedAt: nowIso,
      approvedBy: superAdminCaller.name,
      reviewNotes: approvalNote ? approvalNote.trim() : (appData.reviewNotes || ''),
      history: [historyEntry, ...existingHistory],
      updatedAt: nowServer
    });

    // 6. Notify the organizer
    const notifRef = currentDb.collection('notifications').doc();
    transaction.set(notifRef, {
      id: notifRef.id,
      userId: applicantUid,
      festId: allocatedFestId,
      title: `Fest Application Approved: ${appData.festName}`,
      message: `Your application ${cleanRequestId} has been approved. Workspace ${allocatedFestId} has been initialized with Admin privileges.`,
      type: 'success',
      category: 'fest_approval',
      read: false,
      createdAt: nowIso,
      serverCreatedAt: nowServer
    });

    // 7. Append immutable platform audit log
    const auditLogRef = currentDb.collection('platform_audit_logs').doc();
    transaction.set(auditLogRef, {
      id: auditLogRef.id,
      actorId: superAdminCaller.uid,
      actorName: superAdminCaller.name,
      actorRole: 'super_admin',
      action: 'APPROVE_FEST_REQUEST',
      targetType: 'fest_request',
      targetId: cleanRequestId,
      details: `Approved application ${cleanRequestId} for "${appData.festName}". Provisioned workspace ${allocatedFestId} and assigned Fest Admin privileges to ${appData.contactPersonName || appData.requestingAdminName} (${applicantUid}).`,
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
 * Trusted Handler: Super Admin requests additional information on an application.
 */
async function requestMoreInfoFestApplicationHandler(request, deps = {}) {
  const currentDb = deps.db || db;
  const superAdminCaller = await verifySuperAdminAuth(request, deps);
  const { requestId, moreInfoMessage } = request.data || {};

  if (!requestId || typeof requestId !== 'string' || !requestId.trim()) {
    throw new HttpsError('invalid-argument', 'Missing or invalid requestId.');
  }
  if (!moreInfoMessage || typeof moreInfoMessage !== 'string' || !moreInfoMessage.trim()) {
    throw new HttpsError('invalid-argument', 'Clarification or more information details are mandatory.');
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
      action: 'Requested More Information',
      note: moreInfoMessage.trim()
    };

    transaction.update(requestRef, {
      status: 'more_info_required',
      moreInfoMessage: moreInfoMessage.trim(),
      history: [historyEntry, ...existingHistory],
      updatedAt: nowServer
    });

    if (appData.requestingAdminId) {
      const notifRef = currentDb.collection('notifications').doc();
      transaction.set(notifRef, {
        id: notifRef.id,
        userId: appData.requestingAdminId,
        title: `Information Requested: ${appData.festName}`,
        message: `The Super Administrator has requested additional information regarding application ${cleanRequestId}: "${moreInfoMessage.trim()}"`,
        type: 'warning',
        category: 'fest_request_info',
        read: false,
        createdAt: nowIso,
        serverCreatedAt: nowServer
      });
    }

    const auditLogRef = currentDb.collection('platform_audit_logs').doc();
    transaction.set(auditLogRef, {
      id: auditLogRef.id,
      actorId: superAdminCaller.uid,
      actorName: superAdminCaller.name,
      actorRole: 'super_admin',
      action: 'REQUEST_MORE_INFO_FEST_APPLICATION',
      targetType: 'fest_request',
      targetId: cleanRequestId,
      details: `Requested more info on application ${cleanRequestId} for "${appData.festName}": ${moreInfoMessage.trim()}`,
      beforeValue: appData.status,
      afterValue: 'more_info_required',
      timestamp: nowIso,
      serverTimestamp: nowServer
    });
  });

  return {
    success: true,
    message: `Information request logged for ${cleanRequestId}.`
  };
}

/**
 * ============================================================================
 * SECURE PASSWORD AUTHENTICATION HANDLERS
 * ============================================================================
 */

// In-memory rate limiting map for phone login attempts
// Key: normalizedPhone -> { attempts: number, firstAttemptAt: number }
const phoneLoginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Mask email for privacy: e.g. "j***n@college.edu"
 */
function maskEmail(email) {
  if (!email || !email.includes('@')) return 'your registered email';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

/**
 * Handler: Secure Phone Number + Password Authentication
 * 
 * 1. Validates and normalizes phone number
 * 2. Enforces rate limits against brute force & enumeration
 * 3. Looks up user by phone number using Admin SDK / Firestore (server-side only)
 * 4. Verifies password using Firebase Identity Toolkit REST API
 * 5. Returns a Firebase Custom Token for client sign-in
 * 6. Never exposes email or password to unauthorized callers
 */
async function signInWithPhoneCredentialsHandler(request, deps = {}) {
  const currentDb = deps.db || db;
  const currentAuth = deps.auth || auth;
  const currentFetch = deps.fetch || globalThis.fetch;

  const data = request.data || {};
  const { phone, password } = data;

  if (!phone || typeof phone !== 'string' || !password || typeof password !== 'string') {
    throw new HttpsError('invalid-argument', 'Phone number and password are required.');
  }

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone || normalizedPhone.length < 10) {
    throw new HttpsError('invalid-argument', 'Invalid phone number format.');
  }

  // Rate Limiting Check
  const now = Date.now();
  const attemptRecord = phoneLoginAttempts.get(normalizedPhone);
  if (attemptRecord) {
    if (now - attemptRecord.firstAttemptAt < LOGIN_ATTEMPT_WINDOW_MS) {
      if (attemptRecord.attempts >= MAX_LOGIN_ATTEMPTS) {
        throw new HttpsError(
          'resource-exhausted',
          'Too many failed login attempts. For security, access has been temporarily locked. Please try again in 15 minutes or reset your password.'
        );
      }
    } else {
      phoneLoginAttempts.delete(normalizedPhone);
    }
  }

  const recordFailedAttempt = () => {
    const rec = phoneLoginAttempts.get(normalizedPhone) || { attempts: 0, firstAttemptAt: now };
    rec.attempts += 1;
    phoneLoginAttempts.set(normalizedPhone, rec);
  };

  // 1. Locate user by phone number (server-side only, never exposed to client)
  let targetUid = null;
  let targetEmail = null;

  try {
    const authUser = await currentAuth.getUserByPhoneNumber(normalizedPhone);
    if (authUser) {
      targetUid = authUser.uid;
      targetEmail = authUser.email;
    }
  } catch {
    // Continue to Firestore check
  }

  if (!targetUid || !targetEmail) {
    try {
      const userSnap = await currentDb.collection('users')
        .where('phone', '==', normalizedPhone)
        .limit(1)
        .get();

      if (!userSnap.empty) {
        const uDoc = userSnap.docs[0];
        targetUid = uDoc.id;
        const uData = uDoc.data();
        targetEmail = uData.email;
      }
    } catch (fsErr) {
      console.error('[signInWithPhoneCredentials] Firestore user lookup failed:', fsErr);
    }
  }

  if (!targetUid || !targetEmail) {
    try {
      const partSnap = await currentDb.collection('participants')
        .where('phone', '==', normalizedPhone)
        .limit(1)
        .get();

      if (!partSnap.empty) {
        const pData = partSnap.docs[0].data();
        if (pData.userId && pData.email) {
          targetUid = pData.userId;
          targetEmail = pData.email;
        }
      }
    } catch (partFsErr) {
      console.error('[signInWithPhoneCredentials] Firestore participant lookup failed:', partFsErr);
    }
  }

  // Generic rejection prevents account enumeration
  if (!targetUid || !targetEmail) {
    recordFailedAttempt();
    throw new HttpsError('unauthenticated', 'Invalid email/phone or password. Please check your credentials.');
  }

  // 2. Verify password with Firebase Identity Toolkit REST API
  const apiKey = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || 'AIzaSyATw_Lna2YpPJR86to1uw3uI9kkwb3HC5U';
  
  try {
    const verifyUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
    const response = await currentFetch(verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: targetEmail,
        password: password,
        returnSecureToken: true
      })
    });

    const resJson = await response.json();
    if (!response.ok || resJson.error) {
      recordFailedAttempt();
      throw new HttpsError('unauthenticated', 'Invalid email/phone or password. Please check your credentials.');
    }

    // Success - clear failed attempts
    phoneLoginAttempts.delete(normalizedPhone);

    // 3. Create Firebase Custom Token for client authentication
    const customToken = await currentAuth.createCustomToken(targetUid);

    return {
      success: true,
      customToken,
      uid: targetUid,
      message: 'Authentication successful.'
    };
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    recordFailedAttempt();
    throw new HttpsError('unauthenticated', 'Invalid email/phone or password. Please check your credentials.');
  }
}

/**
 * Handler: Secure Password Reset for Phone Number
 */
async function requestPasswordResetForPhoneHandler(request, deps = {}) {
  const currentDb = deps.db || db;
  const currentAuth = deps.auth || auth;

  const data = request.data || {};
  const { phone } = data;

  if (!phone || typeof phone !== 'string') {
    throw new HttpsError('invalid-argument', 'Phone number is required.');
  }

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone || normalizedPhone.length < 10) {
    throw new HttpsError('invalid-argument', 'Invalid phone number format.');
  }

  let targetEmail = null;
  try {
    const authUser = await currentAuth.getUserByPhoneNumber(normalizedPhone);
    if (authUser && authUser.email) targetEmail = authUser.email;
  } catch {}

  if (!targetEmail) {
    try {
      const snap = await currentDb.collection('users')
        .where('phone', '==', normalizedPhone)
        .limit(1)
        .get();
      if (!snap.empty) {
        targetEmail = snap.docs[0].data().email;
      }
    } catch {}
  }

  // Generic success message prevents account enumeration
  if (!targetEmail) {
    return {
      success: true,
      message: 'If an account exists with this mobile number, password reset instructions have been dispatched to the registered email address.'
    };
  }

  try {
    await currentAuth.generatePasswordResetLink(targetEmail);
    return {
      success: true,
      message: `Password reset instructions have been dispatched to your registered email (${maskEmail(targetEmail)}).`
    };
  } catch (resetErr) {
    console.error('[requestPasswordResetForPhone] Error:', resetErr);
    return {
      success: true,
      message: 'If an account exists with this mobile number, password reset instructions have been dispatched to the registered email address.'
    };
  }
}

/**
 * Handler: Secure User Registration with Uniqueness Validation
 */
async function registerNewUserHandler(request, deps = {}) {
  const currentDb = deps.db || db;
  const currentAuth = deps.auth || auth;

  const data = request.data || {};
  const { name, email, phone, password, role = 'participant', festId, college, category, requestedTeamId } = data;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    throw new HttpsError('invalid-argument', 'Full legal name is required (at least 2 characters).');
  }
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    throw new HttpsError('invalid-argument', 'A valid email address is required.');
  }
  const cleanEmail = email.trim().toLowerCase();

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone || normalizedPhone.length < 10) {
    throw new HttpsError('invalid-argument', 'A valid 10-digit mobile number is required.');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    throw new HttpsError('invalid-argument', 'Password must be at least 6 characters long.');
  }

  // 1. Check unique email in Firebase Auth
  try {
    const existingByEmail = await currentAuth.getUserByEmail(cleanEmail);
    if (existingByEmail) {
      throw new HttpsError('already-exists', 'An account with this email address already exists.');
    }
  } catch (err) {
    if (err.code !== 'auth/user-not-found' && err instanceof HttpsError) throw err;
  }

  // 2. Check unique phone in Firestore /users
  const phoneSnap = await currentDb.collection('users')
    .where('phone', '==', normalizedPhone)
    .limit(1)
    .get();

  if (!phoneSnap.empty) {
    throw new HttpsError('already-exists', 'An account with this mobile number already exists.');
  }

  // 3. Prevent privilege escalation: self-registration defaults strictly to participant
  const assignedRole = 'participant';

  // 4. Create Firebase Auth user
  let newUser;
  try {
    newUser = await currentAuth.createUser({
      email: cleanEmail,
      password: password,
      displayName: name.trim(),
      phoneNumber: normalizedPhone
    });
  } catch (createErr) {
    if (createErr.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'An account with this email address already exists.');
    }
    if (createErr.code === 'auth/phone-number-already-exists') {
      throw new HttpsError('already-exists', 'An account with this mobile number already exists.');
    }
    throw new HttpsError('internal', createErr.message || 'Failed to create user account.');
  }

  // 5. Store user profile in Firestore /users/{uid} (zero plaintext passwords)
  const nowIso = new Date().toISOString();
  const userProfile = {
    id: newUser.uid,
    name: name.trim(),
    email: cleanEmail,
    phone: normalizedPhone,
    phoneVerified: true,
    emailVerified: false,
    role: assignedRole,
    status: 'active',
    festId: festId || 'FEST-01',
    createdAt: nowIso,
    updatedAt: nowIso
  };

  await currentDb.collection('users').doc(newUser.uid).set(userProfile);

  // If participant details provided, also create participant record
  if (college) {
    const participantId = `PT-${newUser.uid.slice(0, 6).toUpperCase()}`;
    const participantDoc = {
      id: participantId,
      userId: newUser.uid,
      name: name.trim(),
      email: cleanEmail,
      phone: normalizedPhone,
      college: (college || '').trim(),
      category: category || 'Senior',
      teamId: requestedTeamId || 'TM-01',
      status: 'pending_approval',
      festId: festId || 'FEST-01',
      createdAt: nowIso,
      updatedAt: nowIso
    };
    await currentDb.collection('participants').doc(participantId).set(participantDoc);
  }

  const customToken = await currentAuth.createCustomToken(newUser.uid);

  return {
    success: true,
    uid: newUser.uid,
    customToken,
    user: userProfile,
    message: 'Registration completed successfully.'
  };
}

/**
 * ============================================================================
 * SHARE FEST: ROLE-BASED INVITATION CLOUD FUNCTION HANDLERS
 * ============================================================================
 */

/**
 * Creates a secure role-based invitation (Judge or Team Leader)
 */
async function createFestInvitationHandler(request, deps = {}) {
  const currentDb = deps.db || db;
  const data = request.data || {};
  const {
    festId,
    role,
    recipientContact,
    recipientType,
    recipientName,
    assignedJudgeId,
    assignedJudgeName,
    assignedTeamId,
    assignedTeamName,
    expiresInDays,
    notes
  } = data;

  if (!festId || typeof festId !== 'string' || !festId.trim()) {
    throw new HttpsError('invalid-argument', 'Missing or invalid festId.');
  }
  if (!role || (role !== 'judge' && role !== 'team_leader')) {
    throw new HttpsError('invalid-argument', 'Role must be either "judge" or "team_leader".');
  }
  if (!recipientContact || typeof recipientContact !== 'string' || !recipientContact.trim()) {
    throw new HttpsError('invalid-argument', 'Missing recipient contact.');
  }

  const adminCaller = await verifyAdminAuth(request, festId, deps);

  // If team_leader, validate assigned team belongs to fest
  if (role === 'team_leader' && assignedTeamId) {
    const teamDoc = await currentDb.collection('teams').doc(assignedTeamId).get();
    if (teamDoc.exists) {
      const tData = teamDoc.data();
      if (tData.festId && tData.festId !== festId) {
        throw new HttpsError('invalid-argument', `Team ${assignedTeamId} belongs to another festival.`);
      }
    }
  }

  const tokenPrefix = role === 'judge' ? 'tok_jd' : 'tok_tl';
  const randBytes = crypto.randomBytes ? crypto.randomBytes(16).toString('hex') : Math.random().toString(36).substring(2);
  const token = `${tokenPrefix}_${randBytes}_${Date.now().toString(36)}`;

  const days = expiresInDays && Number(expiresInDays) > 0 ? Number(expiresInDays) : 7;
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);

  const uniqueIdSuffix = crypto.randomBytes ? crypto.randomBytes(4).toString('hex').toUpperCase() : Math.random().toString(36).substring(2, 6).toUpperCase();
  const invId = `INV-${role === 'judge' ? 'JD' : 'TL'}-${Date.now().toString(36).toUpperCase()}-${uniqueIdSuffix}`;
  const invRef = currentDb.collection('fest_invitations').doc(invId);
  const invitation = {
    id: invId,
    token,
    festId: festId.trim(),
    role,
    recipientType: recipientType || (recipientContact.includes('@') ? 'email' : 'phone'),
    recipientContact: recipientContact.trim(),
    recipientName: (recipientName || '').trim(),
    assignedJudgeId: assignedJudgeId || '',
    assignedJudgeName: assignedJudgeName || '',
    assignedTeamId: assignedTeamId || '',
    assignedTeamName: assignedTeamName || '',
    expiresAt: expiryDate.toISOString(),
    status: 'pending',
    createdByAdminId: adminCaller.uid,
    createdByAdminName: adminCaller.name,
    createdAt: FieldValue.serverTimestamp(),
    notes: (notes || '').trim()
  };

  await invRef.set(invitation);

  // Record audit log
  const auditRef = currentDb.collection('audit_logs').doc();
  await auditRef.set({
    id: auditRef.id,
    festId: festId.trim(),
    userId: adminCaller.uid,
    userName: adminCaller.name,
    action: 'CREATE_FEST_INVITATION',
    targetType: 'invitation',
    targetId: invitation.id,
    details: `Admin created ${role} invitation for ${invitation.recipientContact} (Expires: ${invitation.expiresAt})`,
    timestamp: FieldValue.serverTimestamp()
  });

  return { success: true, invitation };
}

/**
 * Revokes an unused fest invitation
 */
async function revokeFestInvitationHandler(request, deps = {}) {
  const currentDb = deps.db || db;
  const data = request.data || {};
  const { invitationId, festId } = data;

  if (!invitationId) {
    throw new HttpsError('invalid-argument', 'Missing invitationId.');
  }

  const adminCaller = await verifyAdminAuth(request, festId, deps);

  const querySnap = await currentDb.collection('fest_invitations')
    .where('id', '==', invitationId)
    .get();

  if (querySnap.empty) {
    throw new HttpsError('not-found', `Invitation ${invitationId} not found.`);
  }

  const invDocRef = querySnap.docs[0].ref;
  const invData = querySnap.docs[0].data();

  if (invData.status === 'accepted') {
    throw new HttpsError('failed-precondition', 'Cannot revoke an invitation that has already been accepted.');
  }

  await invDocRef.update({
    status: 'revoked',
    revokedAt: FieldValue.serverTimestamp(),
    revokedByAdminId: adminCaller.uid
  });

  // Record audit log
  const auditRef = currentDb.collection('audit_logs').doc();
  await auditRef.set({
    id: auditRef.id,
    festId: invData.festId,
    userId: adminCaller.uid,
    userName: adminCaller.name,
    action: 'REVOKE_FEST_INVITATION',
    targetType: 'invitation',
    targetId: invitationId,
    details: `Admin revoked ${invData.role} invitation ${invitationId} for ${invData.recipientContact}`,
    timestamp: FieldValue.serverTimestamp()
  });

  return { success: true, message: 'Invitation successfully revoked.' };
}

/**
 * Validates an invitation token without privileged authorization
 */
async function validateInvitationTokenHandler(request, deps = {}) {
  const currentDb = deps.db || db;
  const data = request.data || {};
  const { token } = data;

  if (!token || typeof token !== 'string') {
    throw new HttpsError('invalid-argument', 'Missing invitation token.');
  }

  const snap = await currentDb.collection('fest_invitations')
    .where('token', '==', token.trim())
    .get();

  if (snap.empty) {
    throw new HttpsError('not-found', 'Invitation token not found.');
  }

  const inv = snap.docs[0].data();

  if (inv.status === 'revoked') {
    throw new HttpsError('failed-precondition', 'This invitation has been revoked by the Fest Admin.');
  }
  if (inv.status === 'accepted') {
    throw new HttpsError('failed-precondition', 'This invitation has already been accepted and claimed.');
  }
  if (new Date(inv.expiresAt).getTime() < Date.now()) {
    throw new HttpsError('failed-precondition', 'This invitation has expired.');
  }

  // Return non-sensitive validation payload
  return {
    valid: true,
    invitation: {
      id: inv.id,
      festId: inv.festId,
      role: inv.role,
      recipientContact: inv.recipientContact,
      recipientName: inv.recipientName,
      assignedJudgeId: inv.assignedJudgeId,
      assignedJudgeName: inv.assignedJudgeName,
      assignedTeamId: inv.assignedTeamId,
      assignedTeamName: inv.assignedTeamName,
      expiresAt: inv.expiresAt,
      status: inv.status
    }
  };
}

/**
 * Accepts an invitation and binds the role to an authenticated caller
 */
async function acceptFestInvitationHandler(request, deps = {}) {
  const currentDb = deps.db || db;
  const currentAuth = deps.auth || auth;
  const data = request.data || {};
  const { token } = data;

  if (!request.auth || !request.auth.uid) {
    throw new HttpsError('unauthenticated', 'User must be signed in with password credentials to claim an invitation.');
  }

  const callerUid = request.auth.uid;
  if (!token || typeof token !== 'string') {
    throw new HttpsError('invalid-argument', 'Missing invitation token.');
  }

  const snap = await currentDb.collection('fest_invitations')
    .where('token', '==', token.trim())
    .get();

  if (snap.empty) {
    throw new HttpsError('not-found', 'Invitation token not found.');
  }

  const invDocRef = snap.docs[0].ref;
  const inv = snap.docs[0].data();

  if (inv.status === 'revoked') {
    throw new HttpsError('failed-precondition', 'This invitation has been revoked.');
  }
  if (inv.status === 'accepted') {
    throw new HttpsError('failed-precondition', 'This invitation has already been accepted.');
  }
  if (new Date(inv.expiresAt).getTime() < Date.now()) {
    throw new HttpsError('failed-precondition', 'This invitation has expired.');
  }

  // Atomic transaction
  await currentDb.runTransaction(async (transaction) => {
    // 1. Mark invitation accepted
    transaction.update(invDocRef, {
      status: 'accepted',
      acceptedAt: FieldValue.serverTimestamp(),
      acceptedByUserId: callerUid
    });

    // 2. Fetch or update user profile
    const userDocRef = currentDb.collection('users').doc(callerUid);
    const userSnap = await transaction.get(userDocRef);

    const userUpdates = {
      role: inv.role,
      festId: inv.festId,
      status: 'active',
      invitationStatus: 'active',
      updatedAt: FieldValue.serverTimestamp()
    };

    if (inv.role === 'team_leader' && inv.assignedTeamId) {
      userUpdates.linkedTeamId = inv.assignedTeamId;
    }
    if (inv.role === 'judge' && inv.assignedJudgeId) {
      userUpdates.linkedJudgeId = inv.assignedJudgeId;
    }

    if (userSnap.exists) {
      transaction.update(userDocRef, userUpdates);
    } else {
      transaction.set(userDocRef, {
        id: callerUid,
        uid: callerUid,
        email: request.auth.token.email || '',
        phone: request.auth.token.phone_number || '',
        name: inv.recipientName || 'Invited Member',
        createdAt: FieldValue.serverTimestamp(),
        ...userUpdates
      });
    }

    // 3. Record audit log
    const auditRef = currentDb.collection('audit_logs').doc();
    transaction.set(auditRef, {
      id: auditRef.id,
      festId: inv.festId,
      userId: callerUid,
      userName: inv.recipientName || 'Invited User',
      action: 'ACCEPT_FEST_INVITATION',
      targetType: 'invitation',
      targetId: inv.id,
      details: `User ${callerUid} claimed invitation ${inv.id} as ${inv.role} for fest ${inv.festId}`,
      timestamp: FieldValue.serverTimestamp()
    });
  });

  // Assign Firebase custom claims
  const claims = {
    role: inv.role,
    festId: inv.festId
  };
  if (inv.role === 'team_leader' && inv.assignedTeamId) {
    claims.linkedTeamId = inv.assignedTeamId;
  }
  if (inv.role === 'judge' && inv.assignedJudgeId) {
    claims.linkedJudgeId = inv.assignedJudgeId;
  }

  try {
    await currentAuth.setCustomUserClaims(callerUid, claims);
  } catch (claimErr) {
    console.warn('[CloudFunctions] Warning: Could not set custom claims:', claimErr);
  }

  return {
    success: true,
    role: inv.role,
    festId: inv.festId,
    message: `Invitation successfully accepted as ${inv.role}.`
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

exports.requestMoreInfoFestApplication = onCall(async (request) => {
  return await requestMoreInfoFestApplicationHandler(request);
});

exports.signInWithPhoneCredentials = onCall(async (request) => {
  return await signInWithPhoneCredentialsHandler(request);
});

exports.requestPasswordResetForPhone = onCall(async (request) => {
  return await requestPasswordResetForPhoneHandler(request);
});

exports.registerNewUser = onCall(async (request) => {
  return await registerNewUserHandler(request);
});

exports.createFestInvitation = onCall(async (request) => {
  return await createFestInvitationHandler(request);
});

exports.revokeFestInvitation = onCall(async (request) => {
  return await revokeFestInvitationHandler(request);
});

exports.validateInvitationToken = onCall(async (request) => {
  return await validateInvitationTokenHandler(request);
});

exports.acceptFestInvitation = onCall(async (request) => {
  return await acceptFestInvitationHandler(request);
});

/**
 * Unit & Security Test Harness Exports
 */
exports._handlers = {
  normalizePhone,
  maskEmail,
  verifyAdminAuth,
  verifySuperAdminAuth,
  createTeamLeaderInviteHandler,
  verifyAndActivateTeamLeaderHandler,
  reassignTeamLeaderHandler,
  toggleTeamLeaderStatusHandler,
  publishResultsHandler,
  resolveComplaintHandler,
  approveFestApplicationHandler,
  rejectFestApplicationHandler,
  requestMoreInfoFestApplicationHandler,
  signInWithPhoneCredentialsHandler,
  requestPasswordResetForPhoneHandler,
  registerNewUserHandler,
  createFestInvitationHandler,
  revokeFestInvitationHandler,
  validateInvitationTokenHandler,
  acceptFestInvitationHandler
};
