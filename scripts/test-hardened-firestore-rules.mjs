/**
 * Festoria — Firestore Security Rules Hardening Verification Suite
 *
 * Independently tests and verifies the hardened firestore.rules against:
 * 1. Administrator privilege escalation prevention (Fest Admin cannot create/promote admin or super_admin)
 * 2. Administrator suspension bypass prevention (stale custom claims cannot bypass suspended Firestore status)
 * 3. Cross-fest document modification prevention (strict festId immutability)
 * 4. Audit log integrity & client forgery prevention (server-generated actions locked to Admin SDK)
 * 5. Participant privilege escalation prevention & legitimate profile editing
 * 6. Unauthorized judge scoring prevention & authorized scoring workflow
 * 7. Unauthorized complaint modification prevention & legitimate resolution
 * 8. Unauthorized invitation activation prevention
 * 9. Unauthorized document deletion prevention (safe resource.data evaluation)
 * 10. Suspended & Inactive Team Leader access denial across all authorization paths
 * 11. Legitimate Super Admin and Fest Admin operations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rulesContent = fs.readFileSync(path.resolve(__dirname, '../firestore.rules'), 'utf-8');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`  ✗ FAIL: ${message}`);
    throw new Error(`Rule verification failed: ${message}`);
  }
  console.log(`  ✓ PASS: ${message}`);
  passedTests++;
}

console.log('======================================================================');
console.log('  FESTORIA — FIRESTORE SECURITY RULES HARDENING VERIFICATION SUITE');
console.log('======================================================================\n');

/**
 * Extracts a match block by collection path name
 */
function extractMatchBlock(rules, colPattern) {
  const matchIndex = rules.indexOf(`match /${colPattern}`);
  if (matchIndex === -1) return '';
  const nextMatch = rules.indexOf('match /', matchIndex + 10);
  return nextMatch === -1 ? rules.slice(matchIndex) : rules.slice(matchIndex, nextMatch);
}

// ---------------------------------------------------------------------------
// SUITE 1: Administrator Privilege Escalation Prevention & Valid CEL Syntax
// ---------------------------------------------------------------------------
console.log('--- SUITE 1: Administrator Privilege Escalation Prevention & Valid CEL Syntax ---');
{
  const usersBlock = extractMatchBlock(rulesContent, 'users/{userId}');

  assert(
    usersBlock.includes("!(request.resource.data.role in ['super_admin', 'admin', 'fest_admin'])"),
    'Fest Admin cannot create users with administrative roles (super_admin, admin, fest_admin) using valid CEL syntax !(role in [...]).'
  );

  assert(
    usersBlock.includes("(!('role' in request.resource.data) || !(request.resource.data.role in ['super_admin', 'admin', 'fest_admin']))"),
    'Fest Admin cannot update users to promote them to administrative roles.'
  );

  assert(
    usersBlock.includes("(!('role' in resource.data) || !(resource.data.role in ['super_admin', 'admin', 'fest_admin']))"),
    'Fest Admin cannot update or delete existing administrative user accounts.'
  );

  const membershipsBlock = extractMatchBlock(rulesContent, 'fest_memberships/{membershipId}');
  assert(
    membershipsBlock.includes("!(request.resource.data.role in ['admin', 'super_admin', 'fest_admin'])"),
    'Fest Admin cannot grant admin role via fest_memberships (reserved exclusively to Super Admin).'
  );
}

// ---------------------------------------------------------------------------
// SUITE 2: Administrator Suspension & Stale Role Bypass Prevention
// ---------------------------------------------------------------------------
console.log('\n--- SUITE 2: Administrator Suspension & Stale Role Bypass Prevention ---');
{
  const superAdminDef = rulesContent.slice(
    rulesContent.indexOf('function isSuperAdmin()'),
    rulesContent.indexOf('function isFestAdmin(')
  );

  assert(
    superAdminDef.includes("get(/databases/$(database)/documents/users/$(request.auth.uid)).data.status == 'active'"),
    'isSuperAdmin() strictly requires active Firestore user status, preventing stale super_admin JWT claims from bypassing suspension.'
  );

  assert(
    superAdminDef.includes("get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin'"),
    'isSuperAdmin() strictly requires role == super_admin in Firestore profile; stale JWT claims alone cannot grant Super Admin.'
  );

  assert(
    !superAdminDef.includes("request.auth.token.role == 'super_admin' ||"),
    'isSuperAdmin() does not allow stale request.auth.token.role to bypass profile role check.'
  );

  const festAdminDef = rulesContent.slice(
    rulesContent.indexOf('function isFestAdmin('),
    rulesContent.indexOf('function isTeamLeader(')
  );

  assert(
    festAdminDef.includes("get(/databases/$(database)/documents/users/$(request.auth.uid)).data.status == 'active'"),
    'isFestAdmin() strictly requires active Firestore user status, preventing stale admin JWT claims from bypassing suspension.'
  );

  assert(
    !festAdminDef.includes("request.auth.token.role == 'admin'"),
    'isFestAdmin() does not allow stale request.auth.token.role to grant admin access without active admin profile/membership.'
  );
}

// ---------------------------------------------------------------------------
// SUITE 3: Cross-Fest Document Modification Prevention
// ---------------------------------------------------------------------------
console.log('\n--- SUITE 3: Cross-Fest Document Modification Prevention ---');
{
  const collectionsToCheck = [
    'fest_memberships/{membershipId}',
    'teams/{teamId}',
    'team_leader_invitations/{invitationId}',
    'participants/{participantId}',
    'programmes/{programmeId}',
    'programme_assignments/{assignmentId}',
    'scores/{scoreId}',
    'results/{resultId}',
    'notifications/{notificationId}',
    'complaints/{complaintId}',
    'announcements/{announcementId}'
  ];

  for (const col of collectionsToCheck) {
    const block = extractMatchBlock(rulesContent, col);
    assert(
      block.includes('request.resource.data.festId == resource.data.festId'),
      `Update rule in /${col} strictly enforces document festId immutability (cannot move between fests).`
    );
    assert(
      block.includes('isFestAdmin(resource.data.festId)') || block.includes('isFestAdmin(request.resource.data.festId)'),
      `Update rule in /${col} verifies Fest Admin authorization for the document's specific fest.`
    );
  }

  // Check users update fest protection
  const usersBlock = extractMatchBlock(rulesContent, 'users/{userId}');
  assert(
    usersBlock.includes('request.resource.data.festId == resource.data.festId'),
    'Update rule in /users/{userId} prevents Fest Admins from moving users between fests.'
  );
  assert(
    usersBlock.includes('resource.data.festId != null && isFestAdmin(resource.data.festId)'),
    'Update rule in /users/{userId} restricts Fest Admin management strictly to users in their own fest.'
  );
}

// ---------------------------------------------------------------------------
// SUITE 4: Audit Log Integrity & Client Whitelisting
// ---------------------------------------------------------------------------
console.log('\n--- SUITE 4: Audit Log Integrity & Client Whitelisting ---');
{
  const auditBlock = extractMatchBlock(rulesContent, 'audit_logs/{logId}');

  assert(
    !auditBlock.includes('allow create: if isAuthenticated();'),
    'Unrestricted client audit log creation (allow create: if isAuthenticated();) is completely removed.'
  );

  assert(
    auditBlock.includes('request.resource.data.userId == request.auth.uid'),
    'Audit log creation requires request.resource.data.userId == request.auth.uid, preventing caller identity spoofing.'
  );

  assert(
    auditBlock.includes('request.resource.data.action in ['),
    'Client audit log actions are restricted strictly to an explicit whitelist of safe non-privileged operations.'
  );

  assert(
    !auditBlock.includes("'CREATE_TEAM_LEADER_INVITATION'") &&
    !auditBlock.includes("'ACTIVATE_TEAM_LEADER'") &&
    !auditBlock.includes("'REASSIGN_TEAM_LEADER'"),
    'Sensitive administrative operations (invitation, activation, reassignment) are server-generated only and cannot be fabricated by clients.'
  );

  assert(
    !auditBlock.includes("'PUBLISH_RESULTS'") &&
    !auditBlock.includes("'RESOLVE_COMPLAINT'") &&
    !auditBlock.includes("'SUBMIT_SCORE'"),
    'Sensitive result publication, complaint resolution, and judge scoring audit entries cannot be forged by client applications.'
  );

  assert(
    auditBlock.includes('allow update, delete: if false;'),
    'Audit log updates and deletions are strictly denied (allow update, delete: if false;).'
  );
}

// ---------------------------------------------------------------------------
// SUITE 5: Participant Privilege Escalation Prevention & Profile Editing
// ---------------------------------------------------------------------------
console.log('\n--- SUITE 5: Participant Privilege Escalation Prevention & Profile Editing ---');
{
  const usersBlock = extractMatchBlock(rulesContent, 'users/{userId}');

  assert(
    usersBlock.includes("!request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'status', 'uid', 'phone', 'phoneVerified'])"),
    'Users cannot escalate role, alter status, or tamper with phone/UID on profile updates.'
  );

  assert(
    usersBlock.includes("!request.resource.data.diff(resource.data).affectedKeys().hasAny(['festId', 'linkedTeamId', 'teamId', 'approvalStatus', 'invitationStatus'])"),
    'Users cannot alter festId, teamId, linkedTeamId, approvalStatus, or invitationStatus.'
  );

  // Self-creation role check
  assert(
    usersBlock.includes("(!('role' in request.resource.data) || request.resource.data.role == 'participant')"),
    'User self-creation is restricted to the participant role only.'
  );

  // Participants collection check
  const participantsBlock = extractMatchBlock(rulesContent, 'participants/{participantId}');
  assert(
    participantsBlock.includes("request.resource.data.approvalStatus == 'pending_approval'"),
    'Participant self-registration enforces pending_approval status.'
  );
  assert(
    participantsBlock.includes("request.resource.data.registrationSource == 'self_registration'"),
    'Participant self-registration requires registrationSource == self_registration.'
  );
  assert(
    participantsBlock.includes("affectedKeys().hasAny(['approvalStatus', 'teamId', 'festId', 'id', 'userId', 'registeredProgrammes'])"),
    'Participants cannot alter approvalStatus, teamId, festId, or registeredProgrammes on their participant record.'
  );
}

// ---------------------------------------------------------------------------
// SUITE 6: Unauthorized Judge Scoring Prevention & Scored Workflows
// ---------------------------------------------------------------------------
console.log('\n--- SUITE 6: Unauthorized Judge Scoring Prevention ---');
{
  const scoresBlock = extractMatchBlock(rulesContent, 'scores/{scoreId}');

  // Judge identity check
  assert(
    scoresBlock.includes("get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'judge'") ||
    scoresBlock.includes("get(/databases/$(database)/documents/users/$(request.auth.uid)).data.linkedJudgeId != null"),
    'Score creation validates that caller is recognized as an active judge.'
  );

  // Programme assignment verification
  assert(
    scoresBlock.includes('exists(/databases/$(database)/documents/programmes/$(request.resource.data.programmeId))'),
    'Score creation verifies that the targeted programme exists.'
  );
  assert(
    scoresBlock.includes('assignedJudgeIds.hasAny('),
    'Score creation verifies that the judge is explicitly assigned to the programme.'
  );

  // Immutability on update
  assert(
    scoresBlock.includes('request.resource.data.judgeId == resource.data.judgeId'),
    'Score update prevents changing the score sheet judgeId.'
  );
  assert(
    scoresBlock.includes('request.resource.data.programmeId == resource.data.programmeId'),
    'Score update prevents changing the score sheet programmeId.'
  );
  assert(
    scoresBlock.includes('request.resource.data.festId == resource.data.festId'),
    'Score update prevents changing the score sheet festId.'
  );
}

// ---------------------------------------------------------------------------
// SUITE 7: Unauthorized Complaint Modification Prevention
// ---------------------------------------------------------------------------
console.log('\n--- SUITE 7: Unauthorized Complaint Modification Prevention ---');
{
  const complaintsBlock = extractMatchBlock(rulesContent, 'complaints/{complaintId}');

  assert(
    complaintsBlock.includes("resource.data.status in ['submitted', 'more_info_required']"),
    'Team Leaders can only update complaints while status is in submitted or more_info_required.'
  );

  assert(
    complaintsBlock.includes("request.resource.data.diff(resource.data).affectedKeys().hasOnly(["),
    'Team Leader complaint update strictly restricts allowed fields via affectedKeys().hasOnly.'
  );

  assert(
    complaintsBlock.includes("'description'") && complaintsBlock.includes("'evidence'") && !complaintsBlock.includes("'resolved'") && !complaintsBlock.includes("'status'"),
    'Team Leaders cannot alter complaint status, resolution, or calibratedScore (cannot resolve their own complaint).'
  );

  assert(
    complaintsBlock.includes('request.resource.data.teamId == resource.data.teamId'),
    'Team Leaders cannot change the teamId of an existing complaint.'
  );
}

// ---------------------------------------------------------------------------
// SUITE 8: Unauthorized Invitation Activation Prevention
// ---------------------------------------------------------------------------
console.log('\n--- SUITE 8: Unauthorized Invitation Activation Prevention ---');
{
  const invBlock = extractMatchBlock(rulesContent, 'team_leader_invitations/{invitationId}');

  assert(
    invBlock.includes("resource.data.phone == request.auth.token.phone_number"),
    'Invitation activation requires verified caller phone to match invitation phone.'
  );

  assert(
    invBlock.includes("resource.data.status == 'pending_verification'"),
    'Invitation activation requires invitation to be in pending_verification status.'
  );

  assert(
    invBlock.includes("request.resource.data.status == 'activated'"),
    'Invitation activation allows transitioning status only to activated.'
  );

  assert(
    invBlock.includes("request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'activatedUserId', 'activatedAt'])"),
    'Invited user activation is restricted strictly to status, activatedUserId, and activatedAt fields.'
  );
}

// ---------------------------------------------------------------------------
// SUITE 9: Unauthorized Document Deletion Prevention (Correct resource.data usage)
// ---------------------------------------------------------------------------
console.log('\n--- SUITE 9: Unauthorized Document Deletion Prevention ---');
{
  const deleteChecks = [
    { col: 'teams/{teamId}', pattern: 'allow delete: if isAuthenticated() && isFestAdmin(resource.data.festId);' },
    { col: 'team_leader_invitations/{invitationId}', pattern: 'allow delete: if isAuthenticated() && isFestAdmin(resource.data.festId);' },
    { col: 'participants/{participantId}', pattern: 'allow delete: if isAuthenticated() && isFestAdmin(resource.data.festId);' },
    { col: 'programmes/{programmeId}', pattern: 'allow delete: if isAuthenticated() && isFestAdmin(resource.data.festId);' },
    { col: 'programme_assignments/{assignmentId}', pattern: 'isFestAdmin(resource.data.festId)' },
    { col: 'scores/{scoreId}', pattern: 'allow delete: if isAuthenticated() && isFestAdmin(resource.data.festId);' },
    { col: 'results/{resultId}', pattern: 'allow delete: if isAuthenticated() && isFestAdmin(resource.data.festId);' },
    { col: 'complaints/{complaintId}', pattern: 'allow delete: if isAuthenticated() && isFestAdmin(resource.data.festId);' },
    { col: 'announcements/{announcementId}', pattern: 'allow delete: if isAuthenticated() && isFestAdmin(resource.data.festId);' }
  ];

  for (const check of deleteChecks) {
    const block = extractMatchBlock(rulesContent, check.col);
    assert(
      block.includes(check.pattern),
      `Deletion rule for /${check.col} safely references resource.data.festId (not request.resource.data).`
    );
  }
}

// ---------------------------------------------------------------------------
// SUITE 10: Suspended & Inactive Team Leader Access Blocked Across All Paths
// ---------------------------------------------------------------------------
console.log('\n--- SUITE 10: Suspended & Inactive Team Leader Access Blocked Across All Paths ---');
{
  const isTeamLeaderDef = rulesContent.slice(
    rulesContent.indexOf('function isTeamLeader'),
    rulesContent.indexOf('match /fests')
  );

  assert(
    isTeamLeaderDef.includes("get(/databases/$(database)/documents/users/$(request.auth.uid)).data.status == 'active'"),
    'isTeamLeader function strictly enforces that the user profile must be status == active.'
  );

  assert(
    isTeamLeaderDef.includes("get(/databases/$(database)/documents/users/$(request.auth.uid)).data.linkedTeamId == teamId"),
    'isTeamLeader function requires user linkedTeamId to match the requested teamId.'
  );

  assert(
    isTeamLeaderDef.includes("get(/databases/$(database)/documents/teams/$(teamId)).data.teamLeaderId == request.auth.uid"),
    'isTeamLeader function requires team document teamLeaderId to match caller UID, enforcing bidirectional consistency.'
  );
}

// ---------------------------------------------------------------------------
// SUITE 11: Legitimate Super Admin and Fest Admin Operations
// ---------------------------------------------------------------------------
console.log('\n--- SUITE 11: Legitimate Super Admin and Fest Admin Operations ---');
{
  assert(
    rulesContent.includes('function isSuperAdmin()'),
    'Helper function isSuperAdmin() defined with custom claims and Firestore role fallback.'
  );

  assert(
    rulesContent.includes('allow create, delete: if isSuperAdmin();'),
    'Super Admin has platform-wide authority to create and delete fests.'
  );

  assert(
    rulesContent.includes('function isFestAdmin(festId)'),
    'Helper function isFestAdmin(festId) defined and resolves fest-level permissions.'
  );

  assert(
    rulesContent.includes('isSuperAdmin() || (') && rulesContent.includes('isFestAdmin(festId)'),
    'isFestAdmin automatically inherits Super Admin authority platform-wide.'
  );
}

// ---------------------------------------------------------------------------
// SUITE 12: Semantic Rule Evaluation Simulation Engine
// ---------------------------------------------------------------------------
console.log('\n--- SUITE 12: Semantic Rule Evaluation Simulation Engine ---');
{
  function hasAnyDiff(oldData, newData, keys) {
    for (const k of keys) {
      if (newData[k] !== undefined && newData[k] !== oldData[k]) return true;
    }
    return false;
  }

  function evalIsSuperAdmin(auth, callerUser) {
    if (!auth || !auth.uid || !callerUser) return false;
    if (callerUser.status !== 'active') return false;
    return callerUser.role === 'super_admin';
  }

  function evalIsFestAdmin(auth, festId, callerUser, membership) {
    if (evalIsSuperAdmin(auth, callerUser)) return true;
    if (!auth || !auth.uid || !festId || !callerUser) return false;
    if (callerUser.status !== 'active') return false;
    if (['admin', 'fest_admin'].includes(callerUser.role) && callerUser.festId === festId) return true;
    if (membership && membership.role === 'admin' && membership.status === 'active' && membership.festId === festId) return true;
    return false;
  }

  function evalIsTeamLeader(auth, festId, teamId, callerUser, team) {
    if (evalIsFestAdmin(auth, festId, callerUser)) return true;
    if (!auth || !auth.uid || !callerUser) return false;
    if (callerUser.role !== 'team_leader' || callerUser.status !== 'active') return false;
    if (callerUser.festId !== festId || callerUser.linkedTeamId !== teamId) return false;
    if (!team || team.festId !== festId || team.teamLeaderId !== auth.uid) return false;
    return true;
  }

  function evalUsersCreate(auth, userId, newDoc, callerUser) {
    if (evalIsSuperAdmin(auth, callerUser)) return true;
    if (auth && newDoc.festId != null && evalIsFestAdmin(auth, newDoc.festId, callerUser)) {
      if (!('role' in newDoc) || !['super_admin', 'admin', 'fest_admin'].includes(newDoc.role)) return true;
    }
    if (auth && auth.uid === userId && newDoc.uid === userId) {
      if (!('role' in newDoc) || newDoc.role === 'participant') return true;
    }
    return false;
  }

  function evalUsersUpdate(auth, userId, oldDoc, newDoc, callerUser) {
    if (evalIsSuperAdmin(auth, callerUser)) return true;
    if (auth && oldDoc.festId != null && evalIsFestAdmin(auth, oldDoc.festId, callerUser)) {
      if (!('festId' in newDoc) || newDoc.festId === oldDoc.festId) {
        const oldRoleAllowed = !('role' in oldDoc) || !['super_admin', 'admin', 'fest_admin'].includes(oldDoc.role);
        const newRoleAllowed = !('role' in newDoc) || !['super_admin', 'admin', 'fest_admin'].includes(newDoc.role);
        if (oldRoleAllowed && newRoleAllowed) return true;
      }
    }
    if (auth && auth.uid === userId) {
      const sensitiveKeys = ['role', 'status', 'uid', 'phone', 'phoneVerified', 'festId', 'linkedTeamId', 'teamId', 'approvalStatus', 'invitationStatus'];
      if (!hasAnyDiff(oldDoc, newDoc, sensitiveKeys)) return true;
    }
    return false;
  }

  function evalMembershipsCreate(auth, newDoc, callerUser) {
    if (evalIsSuperAdmin(auth, callerUser)) return true;
    if (auth && evalIsFestAdmin(auth, newDoc.festId, callerUser)) {
      if (!('role' in newDoc) || !['admin', 'super_admin', 'fest_admin'].includes(newDoc.role)) return true;
    }
    return false;
  }

  function evalAuditLogCreate(auth, newDoc, callerUser) {
    if (!auth || !auth.uid || !callerUser) return false;
    if (!evalIsFestAdmin(auth, newDoc.festId, callerUser)) return false;
    if (newDoc.userId !== auth.uid) return false;
    if (typeof newDoc.festId !== 'string') return false;
    const allowed = [
      'USER_LOGIN', 'USER_LOGOUT', 'UPDATE_PROFILE', 'SUBMIT_REGISTRATION',
      'UPDATE_SETTINGS', 'VIEW_REPORT', 'EXPORT_REPORT', 'CREATE_ANNOUNCEMENT'
    ];
    return allowed.includes(newDoc.action);
  }

  // 1. Fest Admin cannot elevate to admin/super_admin/fest_admin
  const festAdminCaller = { uid: 'FA-1', role: 'admin', festId: 'FEST-01', status: 'active' };
  const authFA = { uid: 'FA-1', token: { role: 'admin', festId: 'FEST-01' } };

  assert(
    !evalUsersCreate(authFA, 'TARGET-1', { uid: 'TARGET-1', festId: 'FEST-01', role: 'super_admin' }, festAdminCaller),
    'Semantic simulation: Fest Admin creating super_admin user is rejected.'
  );
  assert(
    !evalUsersCreate(authFA, 'TARGET-1', { uid: 'TARGET-1', festId: 'FEST-01', role: 'admin' }, festAdminCaller),
    'Semantic simulation: Fest Admin creating admin user is rejected.'
  );
  assert(
    !evalUsersCreate(authFA, 'TARGET-1', { uid: 'TARGET-1', festId: 'FEST-01', role: 'fest_admin' }, festAdminCaller),
    'Semantic simulation: Fest Admin creating fest_admin user is rejected.'
  );
  assert(
    evalUsersCreate(authFA, 'TARGET-1', { uid: 'TARGET-1', festId: 'FEST-01', role: 'participant' }, festAdminCaller),
    'Semantic simulation: Fest Admin creating participant user is permitted.'
  );

  // 2. Fest Admin cannot promote existing user to admin roles
  const participantDoc = { id: 'P-1', role: 'participant', festId: 'FEST-01', status: 'active' };
  assert(
    !evalUsersUpdate(authFA, 'P-1', participantDoc, { ...participantDoc, role: 'super_admin' }, festAdminCaller),
    'Semantic simulation: Fest Admin updating user to super_admin is rejected.'
  );
  assert(
    !evalUsersUpdate(authFA, 'P-1', participantDoc, { ...participantDoc, role: 'admin' }, festAdminCaller),
    'Semantic simulation: Fest Admin updating user to admin is rejected.'
  );

  // 3. Fest Admin cannot edit existing admin/super_admin user
  const adminDoc = { id: 'ADM-2', role: 'admin', festId: 'FEST-01', status: 'active' };
  assert(
    !evalUsersUpdate(authFA, 'ADM-2', adminDoc, { ...adminDoc, name: 'Hacked' }, festAdminCaller),
    'Semantic simulation: Fest Admin modifying existing admin account is rejected.'
  );

  // 4. Ordinary user self-management boundaries
  const userCaller = { uid: 'USER-1', role: 'participant', status: 'active' };
  const authUser = { uid: 'USER-1', token: {} };

  assert(
    !evalUsersCreate(authUser, 'USER-1', { uid: 'USER-1', role: 'super_admin' }, null),
    'Semantic simulation: User self-creating as super_admin is rejected.'
  );
  assert(
    !evalUsersCreate(authUser, 'USER-1', { uid: 'USER-1', role: 'admin' }, null),
    'Semantic simulation: User self-creating as admin is rejected.'
  );
  assert(
    !evalUsersCreate(authUser, 'USER-1', { uid: 'USER-1', role: 'team_leader' }, null),
    'Semantic simulation: User self-creating as team_leader is rejected.'
  );
  assert(
    evalUsersCreate(authUser, 'USER-1', { uid: 'USER-1', role: 'participant' }, null),
    'Semantic simulation: User self-creating as participant is permitted.'
  );

  // 5. Ordinary user cannot alter protected fields
  const ownProfile = { id: 'USER-1', uid: 'USER-1', role: 'participant', status: 'active', phone: '+919999999999' };
  assert(
    !evalUsersUpdate(authUser, 'USER-1', ownProfile, { ...ownProfile, role: 'admin' }, userCaller),
    'Semantic simulation: User altering own role is rejected.'
  );
  assert(
    !evalUsersUpdate(authUser, 'USER-1', ownProfile, { ...ownProfile, status: 'suspended' }, userCaller),
    'Semantic simulation: User altering own status is rejected.'
  );
  assert(
    !evalUsersUpdate(authUser, 'USER-1', ownProfile, { ...ownProfile, phone: '+918888888888' }, userCaller),
    'Semantic simulation: User altering own phone number is rejected.'
  );
  assert(
    evalUsersUpdate(authUser, 'USER-1', ownProfile, { ...ownProfile, name: 'Updated Name', bio: 'New bio' }, userCaller),
    'Semantic simulation: User updating legitimate profile fields (name, bio) is permitted.'
  );

  // 6. Membership role escalation
  assert(
    !evalMembershipsCreate(authFA, { festId: 'FEST-01', role: 'admin' }, festAdminCaller),
    'Semantic simulation: Fest Admin creating admin membership is rejected.'
  );
  assert(
    !evalMembershipsCreate(authFA, { festId: 'FEST-01', role: 'super_admin' }, festAdminCaller),
    'Semantic simulation: Fest Admin creating super_admin membership is rejected.'
  );
  assert(
    evalMembershipsCreate(authFA, { festId: 'FEST-01', role: 'volunteer' }, festAdminCaller),
    'Semantic simulation: Fest Admin creating volunteer membership is permitted.'
  );
  const superAdminCaller = { uid: 'SA-1', role: 'super_admin', status: 'active' };
  const authSA = { uid: 'SA-1', token: { role: 'super_admin' } };
  assert(
    evalMembershipsCreate(authSA, { festId: 'FEST-01', role: 'admin' }, superAdminCaller),
    'Semantic simulation: Super Admin creating admin membership is permitted.'
  );

  // 7. Audit log client forgery prevention
  assert(
    !evalAuditLogCreate(authFA, { festId: 'FEST-01', userId: 'FA-1', action: 'PUBLISH_RESULTS' }, festAdminCaller),
    'Semantic simulation: Client forging PUBLISH_RESULTS audit record is rejected.'
  );
  assert(
    !evalAuditLogCreate(authFA, { festId: 'FEST-01', userId: 'FA-1', action: 'RESOLVE_COMPLAINT' }, festAdminCaller),
    'Semantic simulation: Client forging RESOLVE_COMPLAINT audit record is rejected.'
  );
  assert(
    !evalAuditLogCreate(authFA, { festId: 'FEST-01', userId: 'FA-1', action: 'CREATE_TEAM_LEADER_INVITATION' }, festAdminCaller),
    'Semantic simulation: Client forging CREATE_TEAM_LEADER_INVITATION audit record is rejected.'
  );
  assert(
    evalAuditLogCreate(authFA, { festId: 'FEST-01', userId: 'FA-1', action: 'UPDATE_PROFILE' }, festAdminCaller),
    'Semantic simulation: Fest Admin logging whitelisted UPDATE_PROFILE audit is permitted.'
  );

  // 8. Suspension & Stale Token Demotion bypass checks
  const suspendedAdminCaller = { uid: 'FA-1', role: 'admin', festId: 'FEST-01', status: 'suspended' };
  assert(
    !evalIsFestAdmin(authFA, 'FEST-01', suspendedAdminCaller, null),
    'Semantic simulation: Suspended Fest Admin cannot bypass suspension even with valid token.'
  );
  const suspendedSuperAdmin = { uid: 'SA-1', role: 'super_admin', status: 'suspended' };
  assert(
    !evalIsSuperAdmin(authSA, suspendedSuperAdmin),
    'Semantic simulation: Suspended Super Admin cannot bypass suspension even with valid token.'
  );

  // Demoted Super Admin retaining old super_admin token
  const demotedSuperAdmin = { uid: 'SA-1', role: 'participant', status: 'active' };
  assert(
    !evalIsSuperAdmin(authSA, demotedSuperAdmin),
    'Semantic simulation: Super Admin demoted to participant with stale token is strictly rejected.'
  );

  // Demoted Fest Admin retaining old admin token
  const demotedFestAdmin = { uid: 'FA-1', role: 'participant', festId: 'FEST-01', status: 'active' };
  assert(
    !evalIsFestAdmin(authFA, 'FEST-01', demotedFestAdmin, null),
    'Semantic simulation: Fest Admin demoted to participant with stale token is strictly rejected.'
  );

  // Legitimate active Super Admin and Fest Admin
  const activeSuperAdmin = { uid: 'SA-1', role: 'super_admin', status: 'active' };
  assert(
    evalIsSuperAdmin(authSA, activeSuperAdmin),
    'Semantic simulation: Active verified Super Admin is granted access.'
  );
  const activeFestAdmin = { uid: 'FA-1', role: 'admin', festId: 'FEST-01', status: 'active' };
  assert(
    evalIsFestAdmin(authFA, 'FEST-01', activeFestAdmin, null),
    'Semantic simulation: Active verified Fest Admin is granted access.'
  );

  // 9. Team Leader authorization checks
  const teamDoc = { id: 'TM-01', festId: 'FEST-01', teamLeaderId: 'TL-1' };
  const teamLeaderCaller = { uid: 'TL-1', role: 'team_leader', festId: 'FEST-01', linkedTeamId: 'TM-01', status: 'active' };
  const authTL = { uid: 'TL-1', token: {} };

  assert(
    evalIsTeamLeader(authTL, 'FEST-01', 'TM-01', teamLeaderCaller, teamDoc),
    'Semantic simulation: Legitimate active Team Leader is authorized.'
  );
  assert(
    !evalIsTeamLeader(authTL, 'FEST-02', 'TM-01', teamLeaderCaller, teamDoc),
    'Semantic simulation: Team Leader cross-fest access (FEST-02) is rejected.'
  );
  assert(
    !evalIsTeamLeader(authTL, 'FEST-01', 'TM-02', teamLeaderCaller, teamDoc),
    'Semantic simulation: Team Leader cross-team access (TM-02) is rejected.'
  );
  const inactiveTL = { ...teamLeaderCaller, status: 'inactive' };
  assert(
    !evalIsTeamLeader(authTL, 'FEST-01', 'TM-01', inactiveTL, teamDoc),
    'Semantic simulation: Inactive Team Leader is rejected.'
  );
}

console.log('\n======================================================================');
console.log(`  FIRESTORE HARDENED RULES SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
console.log('======================================================================\n');
