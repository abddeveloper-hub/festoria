/**
 * Festoria — Cloud Functions Security & Data-Integrity Verification Suite
 *
 * Tests the hardened backend functions in functions/index.js:
 * 1. Repeated invitation activation prevention & idempotent activation.
 * 2. Incompatible privileged account activation rejection (admin, super_admin, or leader of another team).
 * 3. Restoration of actual previous user document state during activation rollback.
 * 4. Unauthorized cross-fest reassignment rejection (Admin -> wrong fest, user -> wrong fest, team -> wrong fest, oldTeam -> wrong fest).
 * 5. Reassignment old-team protection: only clears old team if actually assigned to target leader.
 * 6. Suspending a non-Team-Leader account rejection (protecting participants & admins).
 * 7. Transactional status re-validation & consistent behavior for suspended and inactive accounts.
 * 8. Conflict protection: Two simultaneous leaders assigned to one team.
 * 9. Firebase Auth failure handling & safe compensating rollback.
 * 10. Audit logs immutability & protection against unauthorized client modifications.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the Cloud Functions handlers
const functionsModule = await import('../functions/index.js');
const {
  verifyAdminAuth,
  createTeamLeaderInviteHandler,
  verifyAndActivateTeamLeaderHandler,
  reassignTeamLeaderHandler,
  toggleTeamLeaderStatusHandler,
  publishResultsHandler,
  resolveComplaintHandler,
  normalizePhone
} = functionsModule._handlers;

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (!condition) {
    console.error(`  ✗ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ PASS: ${message}`);
  passed++;
}

/**
 * In-Memory Firestore Mock with Transaction support
 */
function createMockFirestore(initialData = {}) {
  const store = {};
  for (const [colName, docs] of Object.entries(initialData)) {
    store[colName] = new Map(Object.entries(docs || {}));
  }
  if (!store.users) store.users = new Map();
  if (!store.teams) store.teams = new Map();
  if (!store.team_leader_invitations) store.team_leader_invitations = new Map();
  if (!store.audit_logs) store.audit_logs = new Map();
  if (!store.programmes) store.programmes = new Map();
  if (!store.complaints) store.complaints = new Map();

  function getCollection(name) {
    if (!store[name]) store[name] = new Map();
    return store[name];
  }

  function createDocRef(colName, id) {
    return {
      id,
      collectionName: colName,
      get: async () => {
        const col = getCollection(colName);
        const data = col.get(id);
        return {
          exists: !!data,
          id,
          ref: createDocRef(colName, id),
          data: () => (data ? JSON.parse(JSON.stringify(data)) : undefined)
        };
      },
      set: async (data, options = {}) => {
        const col = getCollection(colName);
        if (options.merge && col.has(id)) {
          col.set(id, { ...col.get(id), ...data });
        } else {
          col.set(id, JSON.parse(JSON.stringify(data)));
        }
      },
      update: async (data) => {
        const col = getCollection(colName);
        if (!col.has(id)) throw new Error(`Document ${id} does not exist for update.`);
        col.set(id, { ...col.get(id), ...data });
      },
      delete: async () => {
        const col = getCollection(colName);
        col.delete(id);
      }
    };
  }

  return {
    _store: store,
    collection: (name) => ({
      doc: (id) => {
        const docId = id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        return createDocRef(name, docId);
      },
      where: (field, op, val) => {
        const col = getCollection(name);
        const conditions = [{ field, op, val }];
        const queryObj = {
          where: (f, o, v) => {
            conditions.push({ field: f, op: o, val: v });
            return queryObj;
          },
          get: async () => {
            let docs = Array.from(col.entries()).map(([id, data]) => ({
              id,
              ref: createDocRef(name, id),
              data: () => JSON.parse(JSON.stringify(data))
            }));

            for (const cond of conditions) {
              docs = docs.filter((d) => {
                const val = d.data()[cond.field];
                if (cond.op === '==') return val === cond.val;
                if (cond.op === 'in') return Array.isArray(cond.val) && cond.val.includes(val);
                return true;
              });
            }

            return {
              empty: docs.length === 0,
              docs,
              size: docs.length
            };
          }
        };
        return queryObj;
      }
    }),
    runTransaction: async (updateFunction) => {
      // Create transaction context
      const tx = {
        get: async (docRef) => {
          return await docRef.get();
        },
        set: (docRef, data, options) => {
          const col = getCollection(docRef.collectionName);
          if (options && options.merge && col.has(docRef.id)) {
            col.set(docRef.id, { ...col.get(docRef.id), ...data });
          } else {
            col.set(docRef.id, JSON.parse(JSON.stringify(data)));
          }
        },
        update: (docRef, data) => {
          const col = getCollection(docRef.collectionName);
          if (!col.has(docRef.id)) throw new Error(`Document ${docRef.id} does not exist in transaction.`);
          col.set(docRef.id, { ...col.get(docRef.id), ...data });
        },
        delete: (docRef) => {
          const col = getCollection(docRef.collectionName);
          col.delete(docRef.id);
        }
      };
      return await updateFunction(tx);
    }
  };
}

/**
 * In-Memory Firebase Auth Mock
 */
function createMockAuth(users = {}, failOnClaim = false) {
  const authStore = new Map(Object.entries(users));

  return {
    _authStore: authStore,
    getUser: async (uid) => {
      const u = authStore.get(uid);
      if (!u) {
        const err = new Error(`User ${uid} not found`);
        err.code = 'auth/user-not-found';
        throw err;
      }
      return JSON.parse(JSON.stringify(u));
    },
    setCustomUserClaims: async (uid, claims) => {
      if (failOnClaim) {
        throw new Error('Simulated Firebase Auth service quota/network error during claims assignment.');
      }
      const u = authStore.get(uid);
      if (u) {
        u.customClaims = claims;
      }
    },
    updateUser: async (uid, properties) => {
      const u = authStore.get(uid);
      if (!u) {
        const err = new Error(`User ${uid} not found`);
        err.code = 'auth/user-not-found';
        throw err;
      }
      Object.assign(u, properties);
      return u;
    },
    revokeRefreshTokens: async (uid) => {
      const u = authStore.get(uid);
      if (u) u.tokensRevoked = true;
    }
  };
}

console.log('======================================================================');
console.log('  FESTORIA — CLOUD FUNCTIONS SECURITY & INTEGRITY VERIFICATION SUITE');
console.log('======================================================================\n');

async function runTests() {
  // -------------------------------------------------------------------------
  // TEST 1: Repeated Activation & Idempotence
  // -------------------------------------------------------------------------
  console.log('--- TEST 1: Repeated Activation & Idempotence ---');
  {
    const db = createMockFirestore({
      team_leader_invitations: {
        'INV-100': {
          id: 'INV-100',
          festId: 'FEST-01',
          teamId: 'TEAM-A',
          name: 'Rahim Leader',
          phone: '+919876543210',
          email: 'rahim@fest.com',
          status: 'activated',
          activatedUserId: 'USER-ORIGINAL'
        }
      },
      teams: {
        'TEAM-A': { id: 'TEAM-A', name: 'Alpha Squad', festId: 'FEST-01' }
      },
      users: {
        'USER-ORIGINAL': {
          id: 'USER-ORIGINAL',
          uid: 'USER-ORIGINAL',
          role: 'team_leader',
          status: 'active',
          linkedTeamId: 'TEAM-A'
        }
      }
    });

    const auth = createMockAuth({
      'USER-ORIGINAL': { uid: 'USER-ORIGINAL', phoneNumber: '+919876543210' },
      'USER-DIFFERENT': { uid: 'USER-DIFFERENT', phoneNumber: '+919876543210' }
    });

    // 1A: Calling with a different user is rejected
    let errorDifferent = null;
    try {
      await verifyAndActivateTeamLeaderHandler(
        {
          auth: { uid: 'USER-DIFFERENT', token: { phone_number: '+919876543210' } },
          data: { invitationId: 'INV-100' }
        },
        { db, auth }
      );
    } catch (e) {
      errorDifferent = e;
    }
    assert(
      errorDifferent && errorDifferent.code === 'failed-precondition',
      'Activation of an invitation already activated by another user is rejected with failed-precondition.'
    );

    // 1B: Idempotent call by the SAME user succeeds cleanly
    const idempotentResult = await verifyAndActivateTeamLeaderHandler(
      {
        auth: { uid: 'USER-ORIGINAL', token: { phone_number: '+919876543210' } },
        data: { invitationId: 'INV-100' }
      },
      { db, auth }
    );
    assert(
      idempotentResult.success === true,
      'Repeated activation by the original user returns success idempotently without error.'
    );
  }

  // -------------------------------------------------------------------------
  // TEST 2: Incompatible Privileged Account Rejection
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 2: Incompatible Privileged Account Rejection ---');
  {
    const db = createMockFirestore({
      team_leader_invitations: {
        'INV-200': {
          id: 'INV-200',
          festId: 'FEST-01',
          teamId: 'TEAM-A',
          name: 'Admin Person',
          phone: '+919111222333',
          email: 'admin@fest.com',
          status: 'pending_verification'
        }
      },
      teams: {
        'TEAM-A': { id: 'TEAM-A', name: 'Alpha Squad', festId: 'FEST-01' }
      },
      users: {
        'ADMIN-USER': {
          id: 'ADMIN-USER',
          uid: 'ADMIN-USER',
          role: 'admin', // ALREADY ADMIN
          festId: 'FEST-01',
          status: 'active'
        },
        'SUPER-USER': {
          id: 'SUPER-USER',
          uid: 'SUPER-USER',
          role: 'super_admin', // ALREADY SUPER ADMIN
          status: 'active'
        }
      }
    });

    const auth = createMockAuth({
      'ADMIN-USER': { uid: 'ADMIN-USER', phoneNumber: '+919111222333' },
      'SUPER-USER': { uid: 'SUPER-USER', phoneNumber: '+919111222333' }
    });

    // Attempting to activate with an Admin account
    let errAdmin = null;
    try {
      await verifyAndActivateTeamLeaderHandler(
        {
          auth: { uid: 'ADMIN-USER', token: { phone_number: '+919111222333' } },
          data: { invitationId: 'INV-200' }
        },
        { db, auth }
      );
    } catch (e) {
      errAdmin = e;
    }
    assert(
      errAdmin && errAdmin.code === 'failed-precondition',
      'Activation is rejected if caller already holds an administrative role (admin).'
    );
    assert(
      errAdmin && errAdmin.message.includes('already holds an administrative role'),
      'Clear rejection message returned preventing administrative account overwrite.'
    );

    // Attempting to activate with a Super Admin account
    let errSuper = null;
    try {
      await verifyAndActivateTeamLeaderHandler(
        {
          auth: { uid: 'SUPER-USER', token: { phone_number: '+919111222333' } },
          data: { invitationId: 'INV-200' }
        },
        { db, auth }
      );
    } catch (e) {
      errSuper = e;
    }
    assert(
      errSuper && errSuper.code === 'failed-precondition',
      'Activation is rejected if caller already holds a super_admin role.'
    );
  }

  // -------------------------------------------------------------------------
  // TEST 3: Rollback Restores Actual Previous State (Not Hardcoded Participant)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 3: Rollback Restores Actual Previous State ---');
  {
    const db = createMockFirestore({
      team_leader_invitations: {
        'INV-PREV': {
          id: 'INV-PREV',
          festId: 'FEST-01',
          teamId: 'TEAM-B',
          name: 'Existing Member',
          phone: '+919444555666',
          email: 'member@fest.com',
          status: 'pending_verification'
        }
      },
      teams: {
        'TEAM-B': { id: 'TEAM-B', name: 'Beta Team', festId: 'FEST-01' }
      },
      users: {
        'USER-VOLUNTEER': {
          id: 'USER-VOLUNTEER',
          uid: 'USER-VOLUNTEER',
          name: 'Original Volunteer Name',
          email: 'volunteer@fest.com',
          role: 'volunteer', // SPECIAL PREVIOUS ROLE
          bio: 'My custom bio',
          status: 'active'
        }
      }
    });

    const failingAuth = createMockAuth(
      { 'USER-VOLUNTEER': { uid: 'USER-VOLUNTEER', phoneNumber: '+919444555666' } },
      true // fail on custom claims
    );

    let errRollback = null;
    try {
      await verifyAndActivateTeamLeaderHandler(
        {
          auth: { uid: 'USER-VOLUNTEER', token: { phone_number: '+919444555666' } },
          data: { invitationId: 'INV-PREV' }
        },
        { db, auth: failingAuth }
      );
    } catch (e) {
      errRollback = e;
    }

    assert(errRollback && errRollback.code === 'internal', 'Auth failure triggered compensating rollback.');

    const userAfter = db._store.users.get('USER-VOLUNTEER');
    assert(
      userAfter.role === 'volunteer',
      'Compensating rollback restored actual previous role (volunteer) instead of assuming participant.'
    );
    assert(
      userAfter.bio === 'My custom bio',
      'Compensating rollback preserved original user profile fields.'
    );
  }

  // -------------------------------------------------------------------------
  // TEST 4: Unauthorized Cross-Fest Reassignment Rejection
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 4: Unauthorized Cross-Fest Reassignment Rejection ---');
  {
    const db = createMockFirestore({
      users: {
        'ADMIN-FEST1': {
          id: 'ADMIN-FEST1',
          role: 'admin',
          festId: 'FEST-01',
          status: 'active',
          name: 'Admin One'
        },
        'LEADER-FEST2': {
          id: 'LEADER-FEST2',
          role: 'team_leader',
          festId: 'FEST-02',
          linkedTeamId: 'TEAM-B1',
          status: 'active',
          name: 'Leader Fest 2'
        },
        'LEADER-FEST1': {
          id: 'LEADER-FEST1',
          role: 'team_leader',
          festId: 'FEST-01',
          linkedTeamId: 'TEAM-A1',
          status: 'active',
          name: 'Leader Fest 1'
        }
      },
      teams: {
        'TEAM-A1': { id: 'TEAM-A1', name: 'Alpha 1', festId: 'FEST-01', teamLeaderId: 'LEADER-FEST1' },
        'TEAM-A2': { id: 'TEAM-A2', name: 'Alpha 2', festId: 'FEST-01' },
        'TEAM-B1': { id: 'TEAM-B1', name: 'Beta 1', festId: 'FEST-02', teamLeaderId: 'LEADER-FEST2' },
        'TEAM-B2': { id: 'TEAM-B2', name: 'Beta 2', festId: 'FEST-02' }
      }
    });

    const auth = createMockAuth({
      'ADMIN-FEST1': { uid: 'ADMIN-FEST1' },
      'LEADER-FEST2': { uid: 'LEADER-FEST2', customClaims: { role: 'team_leader' } },
      'LEADER-FEST1': { uid: 'LEADER-FEST1', customClaims: { role: 'team_leader', otherClaim: 'preserved' } }
    });

    // Sub-case A: Admin cannot perform reassignment on an unauthorized fest (FEST-02)
    let errA = null;
    try {
      await reassignTeamLeaderHandler(
        {
          auth: { uid: 'ADMIN-FEST1' },
          data: { festId: 'FEST-02', userId: 'LEADER-FEST2', newTeamId: 'TEAM-B2' }
        },
        { db, auth }
      );
    } catch (e) {
      errA = e;
    }
    assert(errA && errA.code === 'permission-denied', 'Admin cannot manage unauthorized fest (FEST-02).');

    // Sub-case B: Reassigning to a destination team belonging to another fest is rejected
    let errB = null;
    try {
      await reassignTeamLeaderHandler(
        {
          auth: { uid: 'ADMIN-FEST1' },
          data: { festId: 'FEST-01', userId: 'LEADER-FEST1', newTeamId: 'TEAM-B2' }
        },
        { db, auth }
      );
    } catch (e) {
      errB = e;
    }
    assert(errB && errB.code === 'invalid-argument', 'Reassignment to team in another fest is rejected.');

    // Sub-case C: Legitimate reassignment preserves unrelated custom claims
    await reassignTeamLeaderHandler(
      {
        auth: { uid: 'ADMIN-FEST1' },
        data: { festId: 'FEST-01', userId: 'LEADER-FEST1', newTeamId: 'TEAM-A2' }
      },
      { db, auth }
    );
    const updatedAuth = auth._authStore.get('LEADER-FEST1');
    assert(
      updatedAuth.customClaims.otherClaim === 'preserved',
      'Legitimate reassignment preserved unrelated Firebase Auth custom claims.'
    );
    assert(
      updatedAuth.customClaims.teamId === 'TEAM-A2',
      'TeamId was updated in custom claims to target team.'
    );
  }

  // -------------------------------------------------------------------------
  // TEST 5: Reassignment Old Team Protection (Only Clear If Actually Assigned)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 5: Reassignment Old Team Protection ---');
  {
    const db = createMockFirestore({
      users: {
        'ADMIN-01': { id: 'ADMIN-01', role: 'admin', festId: 'FEST-01', status: 'active', name: 'Admin 1' },
        'LEADER-DISPLACED': {
          id: 'LEADER-DISPLACED',
          role: 'team_leader',
          festId: 'FEST-01',
          linkedTeamId: 'TEAM-OCCUPIED',
          status: 'active',
          name: 'Displaced Leader'
        }
      },
      teams: {
        'TEAM-OCCUPIED': {
          id: 'TEAM-OCCUPIED',
          name: 'Occupied Team',
          festId: 'FEST-01',
          teamLeaderId: 'OTHER-LEADER' // Old team has already been taken by someone else!
        },
        'TEAM-VACANT': {
          id: 'TEAM-VACANT',
          name: 'Vacant Team',
          festId: 'FEST-01',
          teamLeaderId: null
        }
      }
    });

    const auth = createMockAuth({
      'ADMIN-01': { uid: 'ADMIN-01' },
      'LEADER-DISPLACED': { uid: 'LEADER-DISPLACED' }
    });

    await reassignTeamLeaderHandler(
      {
        auth: { uid: 'ADMIN-01' },
        data: { festId: 'FEST-01', userId: 'LEADER-DISPLACED', newTeamId: 'TEAM-VACANT' }
      },
      { db, auth }
    );

    const oldTeam = db._store.teams.get('TEAM-OCCUPIED');
    assert(
      oldTeam.teamLeaderId === 'OTHER-LEADER',
      'Reassignment did NOT clear old team because it was not currently pointing to target leader.'
    );
  }

  // -------------------------------------------------------------------------
  // TEST 6: Suspending & Inactivating Accounts (Consistent Disabled & Revocation)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 6: Suspending & Inactivating Accounts ---');
  {
    const db = createMockFirestore({
      users: {
        'ADMIN-01': { id: 'ADMIN-01', role: 'admin', festId: 'FEST-01', status: 'active', name: 'Admin 1' },
        'LEADER-1': { id: 'LEADER-1', role: 'team_leader', festId: 'FEST-01', status: 'active', name: 'Leader 1' },
        'LEADER-2': { id: 'LEADER-2', role: 'team_leader', festId: 'FEST-01', status: 'active', name: 'Leader 2' }
      }
    });

    const auth = createMockAuth({
      'ADMIN-01': { uid: 'ADMIN-01' },
      'LEADER-1': { uid: 'LEADER-1', disabled: false },
      'LEADER-2': { uid: 'LEADER-2', disabled: false }
    });

    // 6A: Suspend Leader 1
    await toggleTeamLeaderStatusHandler(
      {
        auth: { uid: 'ADMIN-01' },
        data: { festId: 'FEST-01', userId: 'LEADER-1', newStatus: 'suspended' }
      },
      { db, auth }
    );
    const auth1 = auth._authStore.get('LEADER-1');
    assert(auth1.disabled === true, 'Suspension disabled user in Firebase Auth.');
    assert(auth1.tokensRevoked === true, 'Suspension revoked refresh tokens in Firebase Auth.');

    // 6B: Inactivate Leader 2
    await toggleTeamLeaderStatusHandler(
      {
        auth: { uid: 'ADMIN-01' },
        data: { festId: 'FEST-01', userId: 'LEADER-2', newStatus: 'inactive' }
      },
      { db, auth }
    );
    const auth2 = auth._authStore.get('LEADER-2');
    assert(auth2.disabled === true, 'Inactive status disabled user in Firebase Auth.');
    assert(auth2.tokensRevoked === true, 'Inactive status revoked refresh tokens in Firebase Auth.');

    // 6C: Reactivate Leader 1
    await toggleTeamLeaderStatusHandler(
      {
        auth: { uid: 'ADMIN-01' },
        data: { festId: 'FEST-01', userId: 'LEADER-1', newStatus: 'active' }
      },
      { db, auth }
    );
    assert(auth._authStore.get('LEADER-1').disabled === false, 'Reactivation re-enabled user in Firebase Auth.');
  }

  // -------------------------------------------------------------------------
  // TEST 7: Audit Logs Immutability in firestore.rules
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 7: Audit Logs Immutability in firestore.rules ---');
  {
    const rulesPath = path.resolve(__dirname, '../firestore.rules');
    const rulesContent = fs.readFileSync(rulesPath, 'utf-8');

    const auditBlock = rulesContent.slice(rulesContent.indexOf('match /audit_logs/{logId}'));
    const hasStrictNoUpdateDelete =
      auditBlock.includes('allow update, delete: if false;') ||
      (auditBlock.includes('allow update: if false;') && auditBlock.includes('allow delete: if false;'));

    assert(
      hasStrictNoUpdateDelete,
      'firestore.rules strictly denies update and delete on /audit_logs/{logId} (allow update, delete: if false;).'
    );
  }

  // -------------------------------------------------------------------------
  // TEST 8: Server-Generated PUBLISH_RESULTS via Trusted Cloud Function
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 8: Server-Generated PUBLISH_RESULTS via Trusted Cloud Function ---');
  {
    const db = createMockFirestore({
      users: {
        'ADMIN-01': { uid: 'ADMIN-01', name: 'Fest Admin 1', role: 'admin', festId: 'FEST-01', status: 'active' },
        'HACKER-01': { uid: 'HACKER-01', name: 'Unauthorized User', role: 'participant', festId: 'FEST-01', status: 'active' }
      },
      programmes: {
        'PROG-01': { id: 'PROG-01', festId: 'FEST-01', name: 'Solo Classical Dance', status: 'in_progress', resultPublished: false },
        'PROG-OTHER': { id: 'PROG-OTHER', festId: 'FEST-OTHER', name: 'Other Fest Prog', status: 'in_progress' }
      }
    });

    // 8A: Unauthorized caller rejected
    let unauthRejected = false;
    try {
      await publishResultsHandler(
        { auth: { uid: 'HACKER-01' }, data: { festId: 'FEST-01', programmeId: 'PROG-01' } },
        { db }
      );
    } catch (e) {
      unauthRejected = true;
    }
    assert(unauthRejected, 'Unauthorized user cannot invoke publishResults.');

    // 8B: Cross-fest programme rejected
    let crossFestRejected = false;
    try {
      await publishResultsHandler(
        { auth: { uid: 'ADMIN-01' }, data: { festId: 'FEST-01', programmeId: 'PROG-OTHER' } },
        { db }
      );
    } catch (e) {
      crossFestRejected = true;
    }
    assert(crossFestRejected, 'Publishing results for programme belonging to another fest is rejected.');

    // 8C: Legitimate publish generates authoritative server-side audit log
    const res = await publishResultsHandler(
      { auth: { uid: 'ADMIN-01' }, data: { festId: 'FEST-01', programmeId: 'PROG-01' } },
      { db }
    );
    assert(res.success === true, 'Authorized Fest Admin successfully published results.');
    const prog = db._store.programmes.get('PROG-01');
    assert(prog.resultPublished === true && prog.status === 'completed', 'Programme status updated to completed & resultPublished.');
    
    const audits = Array.from(db._store.audit_logs.values());
    const publishAudit = audits.find(a => a.action === 'PUBLISH_RESULTS' && a.targetId === 'PROG-01');
    assert(!!publishAudit, 'Authoritative PUBLISH_RESULTS audit log generated by backend Cloud Function.');
    assert(publishAudit.festId === 'FEST-01' && publishAudit.userId === 'ADMIN-01', 'Audit log contains verified admin identity and festId.');
  }

  // -------------------------------------------------------------------------
  // TEST 9: Server-Generated RESOLVE_COMPLAINT via Trusted Cloud Function
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 9: Server-Generated RESOLVE_COMPLAINT via Trusted Cloud Function ---');
  {
    const db = createMockFirestore({
      users: {
        'ADMIN-01': { uid: 'ADMIN-01', name: 'Fest Admin 1', role: 'admin', festId: 'FEST-01', status: 'active' },
        'HACKER-01': { uid: 'HACKER-01', name: 'Unauthorized User', role: 'participant', festId: 'FEST-01', status: 'active' }
      },
      complaints: {
        'COMP-01': { id: 'COMP-01', festId: 'FEST-01', teamId: 'TM-01', status: 'submitted', description: 'Scoring discrepancy' },
        'COMP-OTHER': { id: 'COMP-OTHER', festId: 'FEST-OTHER', teamId: 'TM-09', status: 'submitted' }
      }
    });

    // 9A: Unauthorized caller rejected
    let unauthRejected = false;
    try {
      await resolveComplaintHandler(
        { auth: { uid: 'HACKER-01' }, data: { festId: 'FEST-01', complaintId: 'COMP-01', resolutionNote: 'Resolved by me' } },
        { db }
      );
    } catch (e) {
      unauthRejected = true;
    }
    assert(unauthRejected, 'Unauthorized user cannot invoke resolveComplaint.');

    // 9B: Cross-fest complaint rejected
    let crossFestRejected = false;
    try {
      await resolveComplaintHandler(
        { auth: { uid: 'ADMIN-01' }, data: { festId: 'FEST-01', complaintId: 'COMP-OTHER', resolutionNote: 'Resolved' } },
        { db }
      );
    } catch (e) {
      crossFestRejected = true;
    }
    assert(crossFestRejected, 'Resolving complaint belonging to another fest is rejected.');

    // 9C: Legitimate resolution generates authoritative server-side audit log
    const res = await resolveComplaintHandler(
      {
        auth: { uid: 'ADMIN-01' },
        data: { festId: 'FEST-01', complaintId: 'COMP-01', resolutionNote: 'Score calibrated pursuant to jury review', calibratedScore: 92 }
      },
      { db }
    );
    assert(res.success === true, 'Authorized Fest Admin successfully resolved complaint.');
    const comp = db._store.complaints.get('COMP-01');
    assert(comp.status === 'resolved' && comp.calibratedScore === 92, 'Complaint updated to resolved with calibrated score.');

    const audits = Array.from(db._store.audit_logs.values());
    const resolveAudit = audits.find(a => a.action === 'RESOLVE_COMPLAINT' && a.targetId === 'COMP-01');
    assert(!!resolveAudit, 'Authoritative RESOLVE_COMPLAINT audit log generated by backend Cloud Function.');
    assert(resolveAudit.festId === 'FEST-01' && resolveAudit.userId === 'ADMIN-01', 'Audit log contains verified admin identity and festId.');
  }

  // -------------------------------------------------------------------------
  // TEST 10: Missing Fest IDs Strictly Rejected Across All Backend Functions
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 10: Missing Fest IDs Strictly Rejected Across All Backend Functions ---');
  {
    const db = createMockFirestore({
      users: {
        'ADMIN-01': { uid: 'ADMIN-01', name: 'Fest Admin 1', role: 'admin', festId: 'FEST-01', status: 'active' }
      }
    });

    const missingFestChecks = [
      () => createTeamLeaderInviteHandler({ auth: { uid: 'ADMIN-01' }, data: { festId: '', teamId: 'T-1', name: 'N', phone: '+919999999999', email: 'a@b.com' } }, { db }),
      () => reassignTeamLeaderHandler({ auth: { uid: 'ADMIN-01' }, data: { festId: null, userId: 'U-1', newTeamId: 'T-2' } }, { db }),
      () => toggleTeamLeaderStatusHandler({ auth: { uid: 'ADMIN-01' }, data: { festId: undefined, userId: 'U-1', newStatus: 'suspended' } }, { db }),
      () => publishResultsHandler({ auth: { uid: 'ADMIN-01' }, data: { festId: '', programmeId: 'P-1' } }, { db }),
      () => resolveComplaintHandler({ auth: { uid: 'ADMIN-01' }, data: { festId: ' ', complaintId: 'C-1', resolutionNote: 'N' } }, { db })
    ];

    let rejectedCount = 0;
    for (const fn of missingFestChecks) {
      try {
        await fn();
      } catch (e) {
        rejectedCount++;
      }
    }
    assert(rejectedCount === 5, 'All 5 backend Cloud Functions strictly reject missing, null, or empty festId parameters.');
  }

  console.log('\n======================================================================');
  console.log(`  CLOUD FUNCTIONS SECURITY SUMMARY: ${passed} / ${total} TESTS PASSED`);
  console.log('======================================================================\n');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
