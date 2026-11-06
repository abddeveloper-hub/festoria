/**
 * FESTORIA — REAL FIREBASE EMULATOR SECURITY & FUNCTIONALITY TEST SUITE
 *
 * Runs REAL tests against the live local Firebase Emulators:
 * - Firestore Emulator: 127.0.0.1:8080
 * - Auth Emulator:      127.0.0.1:9099
 * - Functions Emulator: 127.0.0.1:5001
 *
 * Validates:
 * 1. Real Firestore Security Rules via @firebase/rules-unit-testing
 *    - All four roles: Super Admin, Fest Admin, Team Leader, Participant
 *    - Privilege escalation prevention (/users and /fest_memberships)
 *    - Suspension & inactive status enforcement (stale claim bypass prevention)
 *    - Strict cross-fest isolation
 *    - Client audit forgery prevention (PUBLISH_RESULTS, RESOLVE_COMPLAINT blocked)
 *    - Safe deletion without request.resource dependency
 * 2. All 6 Cloud Functions against the live Functions Emulator
 *    - createTeamLeaderInvite
 *    - verifyAndActivateTeamLeader
 *    - reassignTeamLeader
 *    - toggleTeamLeaderStatus
 *    - publishResults
 *    - resolveComplaint
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInWithCustomToken } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

// Import admin from functions
const adminPkg = await import('../functions/node_modules/firebase-admin/lib/index.js');
const admin = adminPkg.default || adminPkg;

const PROJECT_ID = 'festoria-cd375';

let passed = 0;
let total = 0;

function check(condition, message) {
  total++;
  if (!condition) {
    console.error(`  ✗ FAIL: ${message}`);
    throw new Error(`Emulator assertion failed: ${message}`);
  }
  console.log(`  ✓ PASS: ${message}`);
  passed++;
}

async function runEmulatorSuite() {
  console.log('======================================================================');
  console.log('  FESTORIA — REAL FIREBASE EMULATOR SECURITY VERIFICATION SUITE');
  console.log('======================================================================');
  console.log('  Connected to:');
  console.log('    • Firestore Emulator: 127.0.0.1:8080');
  console.log('    • Auth Emulator:      127.0.0.1:9099');
  console.log('    • Functions Emulator: 127.0.0.1:5001');
  console.log('    • Project ID:         festoria-cd375\n');

  // Initialize rules test environment
  const rules = fs.readFileSync(path.resolve(__dirname, '../firestore.rules'), 'utf8');
  const testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules
    }
  });

  // Clear data
  await testEnv.clearFirestore();

  // -------------------------------------------------------------------------
  // SECTION 1: SEED AUTHORIZATION FIXTURES VIA ADMIN CONTEXT
  // -------------------------------------------------------------------------
  console.log('--- SEEDING AUTH & PROFILE FIXTURES ---');
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const adminDb = context.firestore();

    // 1. Super Admin
    await setDoc(doc(adminDb, 'users', 'EMU-SA-ACTIVE'), {
      uid: 'EMU-SA-ACTIVE',
      name: 'Super Admin User',
      role: 'super_admin',
      status: 'active'
    });
    await setDoc(doc(adminDb, 'users', 'EMU-SA-SUSPENDED'), {
      uid: 'EMU-SA-SUSPENDED',
      name: 'Suspended Super Admin',
      role: 'super_admin',
      status: 'suspended'
    });
    // Demoted Super Admin: active profile, but role was changed to participant
    await setDoc(doc(adminDb, 'users', 'EMU-SA-DEMOTED'), {
      uid: 'EMU-SA-DEMOTED',
      name: 'Demoted Super Admin',
      role: 'participant',
      status: 'active'
    });

    // 2. Fest Admins
    await setDoc(doc(adminDb, 'users', 'EMU-FA1-ACTIVE'), {
      uid: 'EMU-FA1-ACTIVE',
      name: 'Fest Admin 1',
      role: 'admin',
      festId: 'FEST-01',
      status: 'active'
    });
    await setDoc(doc(adminDb, 'users', 'EMU-FA1-SUSPENDED'), {
      uid: 'EMU-FA1-SUSPENDED',
      name: 'Suspended Fest Admin 1',
      role: 'admin',
      festId: 'FEST-01',
      status: 'suspended'
    });
    // Demoted Fest Admin: active profile, but role was changed to participant
    await setDoc(doc(adminDb, 'users', 'EMU-FA1-DEMOTED'), {
      uid: 'EMU-FA1-DEMOTED',
      name: 'Demoted Fest Admin 1',
      role: 'participant',
      festId: 'FEST-01',
      status: 'active'
    });
    await setDoc(doc(adminDb, 'users', 'EMU-FA2-ACTIVE'), {
      uid: 'EMU-FA2-ACTIVE',
      name: 'Fest Admin 2',
      role: 'admin',
      festId: 'FEST-02',
      status: 'active'
    });

    // 3. Team Leaders
    await setDoc(doc(adminDb, 'users', 'EMU-TL1-ACTIVE'), {
      uid: 'EMU-TL1-ACTIVE',
      name: 'Team Leader 1',
      role: 'team_leader',
      festId: 'FEST-01',
      linkedTeamId: 'TM-01',
      status: 'active'
    });
    await setDoc(doc(adminDb, 'users', 'EMU-TL1-SUSPENDED'), {
      uid: 'EMU-TL1-SUSPENDED',
      name: 'Suspended Team Leader 1',
      role: 'team_leader',
      festId: 'FEST-01',
      linkedTeamId: 'TM-01',
      status: 'suspended'
    });
    await setDoc(doc(adminDb, 'users', 'EMU-TL1-INACTIVE'), {
      uid: 'EMU-TL1-INACTIVE',
      name: 'Inactive Team Leader 1',
      role: 'team_leader',
      festId: 'FEST-01',
      linkedTeamId: 'TM-01',
      status: 'inactive'
    });
    // Demoted Team Leader: active profile, but role was changed to participant
    await setDoc(doc(adminDb, 'users', 'EMU-TL1-DEMOTED'), {
      uid: 'EMU-TL1-DEMOTED',
      name: 'Demoted Team Leader 1',
      role: 'participant',
      festId: 'FEST-01',
      linkedTeamId: 'TM-01',
      status: 'active'
    });

    // 4. Participants
    await setDoc(doc(adminDb, 'users', 'EMU-PARTICIPANT-1'), {
      uid: 'EMU-PARTICIPANT-1',
      name: 'Alice Participant',
      role: 'participant',
      festId: 'FEST-01',
      linkedTeamId: 'TM-01',
      phone: '+919876543211',
      status: 'active'
    });

    // 5. Teams
    await setDoc(doc(adminDb, 'teams', 'TM-01'), {
      id: 'TM-01',
      festId: 'FEST-01',
      name: 'Phoenix House',
      teamLeaderId: 'EMU-TL1-ACTIVE'
    });
    await setDoc(doc(adminDb, 'teams', 'TM-02'), {
      id: 'TM-02',
      festId: 'FEST-01',
      name: 'Hydra House',
      teamLeaderId: null
    });
    await setDoc(doc(adminDb, 'teams', 'TM-FEST2'), {
      id: 'TM-FEST2',
      festId: 'FEST-02',
      name: 'Titan House',
      teamLeaderId: null
    });
    await setDoc(doc(adminDb, 'teams', 'TM-DELETE'), {
      id: 'TM-DELETE',
      festId: 'FEST-01',
      name: 'Disposable Team',
      teamLeaderId: null
    });

    // 6. Programmes
    await setDoc(doc(adminDb, 'programmes', 'PROG-01'), {
      id: 'PROG-01',
      festId: 'FEST-01',
      name: 'Classical Dance',
      status: 'in_progress',
      resultPublished: false
    });
    await setDoc(doc(adminDb, 'programmes', 'PROG-DELETE'), {
      id: 'PROG-DELETE',
      festId: 'FEST-01',
      name: 'Temporary Programme'
    });

    // 7. Complaints
    await setDoc(doc(adminDb, 'complaints', 'COMP-01'), {
      id: 'COMP-01',
      festId: 'FEST-01',
      teamId: 'TM-01',
      status: 'submitted',
      description: 'Marking dispute'
    });
    await setDoc(doc(adminDb, 'complaints', 'COMP-DELETE'), {
      id: 'COMP-DELETE',
      festId: 'FEST-01',
      teamId: 'TM-01',
      status: 'submitted'
    });

    // 8. Participants collection
    await setDoc(doc(adminDb, 'participants', 'PART-DELETE'), {
      id: 'PART-DELETE',
      festId: 'FEST-01',
      teamId: 'TM-01',
      name: 'Participant To Delete'
    });
  });
  console.log('  ✓ Seed fixtures committed to local Firestore Emulator.\n');

  // Authenticated Contexts
  const saCtx = testEnv.authenticatedContext('EMU-SA-ACTIVE', { role: 'super_admin' });
  const saSuspendedCtx = testEnv.authenticatedContext('EMU-SA-SUSPENDED', { role: 'super_admin' });
  const saDemotedCtx = testEnv.authenticatedContext('EMU-SA-DEMOTED', { role: 'super_admin' });
  const fa1Ctx = testEnv.authenticatedContext('EMU-FA1-ACTIVE', { role: 'admin', festId: 'FEST-01' });
  const fa1SuspendedCtx = testEnv.authenticatedContext('EMU-FA1-SUSPENDED', { role: 'admin', festId: 'FEST-01' });
  const fa1DemotedCtx = testEnv.authenticatedContext('EMU-FA1-DEMOTED', { role: 'admin', festId: 'FEST-01' });
  const fa2Ctx = testEnv.authenticatedContext('EMU-FA2-ACTIVE', { role: 'admin', festId: 'FEST-02' });
  const tl1Ctx = testEnv.authenticatedContext('EMU-TL1-ACTIVE', { role: 'team_leader', festId: 'FEST-01', teamId: 'TM-01' });
  const tl1SuspendedCtx = testEnv.authenticatedContext('EMU-TL1-SUSPENDED', { role: 'team_leader', festId: 'FEST-01', teamId: 'TM-01' });
  const tl1InactiveCtx = testEnv.authenticatedContext('EMU-TL1-INACTIVE', { role: 'team_leader', festId: 'FEST-01', teamId: 'TM-01' });
  const tl1DemotedCtx = testEnv.authenticatedContext('EMU-TL1-DEMOTED', { role: 'team_leader', festId: 'FEST-01', teamId: 'TM-01' });
  const part1Ctx = testEnv.authenticatedContext('EMU-PARTICIPANT-1', { role: 'participant' });
  const unauthCtx = testEnv.unauthenticatedContext();

  // -------------------------------------------------------------------------
  // TEST 1: Privilege Escalation on /users/{userId}
  // -------------------------------------------------------------------------
  console.log('--- TEST 1: Privilege Escalation on /users (Real Emulator) ---');
  {
    const faDb = fa1Ctx.firestore();

    // 1A: Fest Admin cannot create super_admin
    await assertFails(
      setDoc(doc(faDb, 'users', 'USER-ESCALATE-SA'), {
        uid: 'USER-ESCALATE-SA',
        festId: 'FEST-01',
        role: 'super_admin',
        status: 'active'
      })
    );
    check(true, 'Fest Admin cannot create super_admin user.');

    // 1B: Fest Admin cannot create admin
    await assertFails(
      setDoc(doc(faDb, 'users', 'USER-ESCALATE-ADM'), {
        uid: 'USER-ESCALATE-ADM',
        festId: 'FEST-01',
        role: 'admin',
        status: 'active'
      })
    );
    check(true, 'Fest Admin cannot create admin user.');

    // 1C: Fest Admin cannot create fest_admin
    await assertFails(
      setDoc(doc(faDb, 'users', 'USER-ESCALATE-FA'), {
        uid: 'USER-ESCALATE-FA',
        festId: 'FEST-01',
        role: 'fest_admin',
        status: 'active'
      })
    );
    check(true, 'Fest Admin cannot create fest_admin user.');

    // 1D: Fest Admin CAN create participant
    await assertSucceeds(
      setDoc(doc(faDb, 'users', 'USER-LEGIT-PART'), {
        uid: 'USER-LEGIT-PART',
        festId: 'FEST-01',
        role: 'participant',
        status: 'active'
      })
    );
    check(true, 'Fest Admin can create participant user in their fest.');

    // 1E: Fest Admin cannot promote existing participant to admin
    await assertFails(
      updateDoc(doc(faDb, 'users', 'USER-LEGIT-PART'), {
        role: 'admin'
      })
    );
    check(true, 'Fest Admin cannot update user role to admin.');

    // 1F: Fest Admin cannot promote existing participant to super_admin
    await assertFails(
      updateDoc(doc(faDb, 'users', 'USER-LEGIT-PART'), {
        role: 'super_admin'
      })
    );
    check(true, 'Fest Admin cannot update user role to super_admin.');

    // 1G: Fest Admin cannot modify Super Admin user document
    await assertFails(
      updateDoc(doc(faDb, 'users', 'EMU-SA-ACTIVE'), {
        name: 'Compromised Name'
      })
    );
    check(true, 'Fest Admin cannot modify Super Admin profile document.');

    // 1H: Participant self-creation boundaries
    const p1Db = part1Ctx.firestore();
    const newPartCtx = testEnv.authenticatedContext('EMU-NEW-PART');
    const newPartDb = newPartCtx.firestore();

    await assertFails(
      setDoc(doc(newPartDb, 'users', 'EMU-NEW-PART'), {
        uid: 'EMU-NEW-PART',
        role: 'super_admin'
      })
    );
    check(true, 'Participant cannot self-register with super_admin role.');

    await assertFails(
      setDoc(doc(newPartDb, 'users', 'EMU-NEW-PART'), {
        uid: 'EMU-NEW-PART',
        role: 'admin'
      })
    );
    check(true, 'Participant cannot self-register with admin role.');

    await assertSucceeds(
      setDoc(doc(newPartDb, 'users', 'EMU-NEW-PART'), {
        uid: 'EMU-NEW-PART',
        role: 'participant',
        name: 'New Participant'
      })
    );
    check(true, 'Participant can self-register with participant role.');

    // 1I: Participant cannot tamper with protected profile fields
    await assertFails(
      updateDoc(doc(p1Db, 'users', 'EMU-PARTICIPANT-1'), {
        role: 'admin'
      })
    );
    check(true, 'Participant cannot escalate own role.');

    await assertFails(
      updateDoc(doc(p1Db, 'users', 'EMU-PARTICIPANT-1'), {
        status: 'suspended'
      })
    );
    check(true, 'Participant cannot alter own status.');

    await assertFails(
      updateDoc(doc(p1Db, 'users', 'EMU-PARTICIPANT-1'), {
        phone: '+910000000000'
      })
    );
    check(true, 'Participant cannot alter own verified phone number.');

    await assertFails(
      updateDoc(doc(p1Db, 'users', 'EMU-PARTICIPANT-1'), {
        festId: 'FEST-02'
      })
    );
    check(true, 'Participant cannot alter own festId.');

    await assertSucceeds(
      updateDoc(doc(p1Db, 'users', 'EMU-PARTICIPANT-1'), {
        name: 'Alice Cooper Updated'
      })
    );
    check(true, 'Participant can update non-sensitive personal name.');
  }

  // -------------------------------------------------------------------------
  // TEST 2: Privilege Escalation on /fest_memberships
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 2: Privilege Escalation on /fest_memberships (Real Emulator) ---');
  {
    const faDb = fa1Ctx.firestore();
    const saDb = saCtx.firestore();

    // 2A: Fest Admin cannot create admin membership
    await assertFails(
      setDoc(doc(faDb, 'fest_memberships', 'MEM-ESCALATE-1'), {
        festId: 'FEST-01',
        userId: 'USER-1',
        role: 'admin'
      })
    );
    check(true, 'Fest Admin cannot create admin membership.');

    // 2B: Fest Admin cannot create super_admin membership
    await assertFails(
      setDoc(doc(faDb, 'fest_memberships', 'MEM-ESCALATE-2'), {
        festId: 'FEST-01',
        userId: 'USER-2',
        role: 'super_admin'
      })
    );
    check(true, 'Fest Admin cannot create super_admin membership.');

    // 2C: Fest Admin CAN create non-admin membership (e.g. volunteer)
    await assertSucceeds(
      setDoc(doc(faDb, 'fest_memberships', 'MEM-LEGIT-1'), {
        festId: 'FEST-01',
        userId: 'USER-3',
        role: 'volunteer'
      })
    );
    check(true, 'Fest Admin can create non-admin membership.');

    // 2D: Super Admin CAN create admin membership
    await assertSucceeds(
      setDoc(doc(saDb, 'fest_memberships', 'MEM-SA-ADMIN-1'), {
        festId: 'FEST-01',
        userId: 'USER-ADMIN-X',
        role: 'admin'
      })
    );
    check(true, 'Super Admin can grant admin membership.');
  }

  // -------------------------------------------------------------------------
  // TEST 3: Suspension & Stale-Role Bypass Prevention (Real Emulator)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 3: Administrator Suspension & Stale-Role Bypass Prevention ---');
  {
    // 3A: Suspended Super Admin token cannot create fest
    const saSuspDb = saSuspendedCtx.firestore();
    await assertFails(
      setDoc(doc(saSuspDb, 'fests', 'FEST-BYPASS'), {
        name: 'Bypass Fest'
      })
    );
    check(true, 'Suspended Super Admin cannot create fest despite JWT claims.');

    // 3B: Suspended Fest Admin token cannot create team
    const faSuspDb = fa1SuspendedCtx.firestore();
    await assertFails(
      setDoc(doc(faSuspDb, 'teams', 'TM-BYPASS'), {
        festId: 'FEST-01',
        name: 'Bypass Team'
      })
    );
    check(true, 'Suspended Fest Admin cannot create team despite JWT claims.');

    // 3C: Suspended Team Leader cannot update complaints
    const tlSuspDb = tl1SuspendedCtx.firestore();
    await assertFails(
      updateDoc(doc(tlSuspDb, 'complaints', 'COMP-01'), {
        description: 'Bypass description'
      })
    );
    check(true, 'Suspended Team Leader cannot update complaints.');

    // 3D: Inactive Team Leader cannot update complaints
    const tlInactDb = tl1InactiveCtx.firestore();
    await assertFails(
      updateDoc(doc(tlInactDb, 'complaints', 'COMP-01'), {
        description: 'Bypass description'
      })
    );
    check(true, 'Inactive Team Leader cannot update complaints.');

    // 3E: Super Admin demoted to Participant retaining stale Super Admin token
    const saDemotedDb = saDemotedCtx.firestore();
    await assertFails(
      setDoc(doc(saDemotedDb, 'fests', 'FEST-STALE-SA'), {
        name: 'Unauthorized Fest By Demoted SA'
      })
    );
    check(true, 'Super Admin demoted to Participant retaining stale super_admin token is DENIED fest creation.');

    await assertFails(
      deleteDoc(doc(saDemotedDb, 'fests', 'FEST-01'))
    );
    check(true, 'Super Admin demoted to Participant retaining stale super_admin token is DENIED fest deletion.');

    // 3F: Fest Admin demoted to Participant retaining stale Fest Admin token
    const faDemotedDb = fa1DemotedCtx.firestore();
    await assertFails(
      setDoc(doc(faDemotedDb, 'teams', 'TM-STALE-FA'), {
        festId: 'FEST-01',
        name: 'Unauthorized Team By Demoted FA'
      })
    );
    check(true, 'Fest Admin demoted to Participant retaining stale admin token is DENIED team creation.');

    await assertFails(
      deleteDoc(doc(faDemotedDb, 'teams', 'TM-01'))
    );
    check(true, 'Fest Admin demoted to Participant retaining stale admin token is DENIED team deletion.');

    // 3G: Team Leader demoted to Participant retaining stale Team Leader token
    const tlDemotedDb = tl1DemotedCtx.firestore();
    await assertFails(
      updateDoc(doc(tlDemotedDb, 'complaints', 'COMP-01'), {
        description: 'Tampered by demoted TL'
      })
    );
    check(true, 'Team Leader demoted to Participant retaining stale team_leader token is DENIED complaint updates.');

    // 3H: Legitimate active Super Admin access confirmed
    const saActiveDb = saCtx.firestore();
    await assertSucceeds(
      setDoc(doc(saActiveDb, 'fests', 'FEST-LEGIT-SA'), {
        id: 'FEST-LEGIT-SA',
        name: 'Legitimate Fest by Super Admin'
      })
    );
    check(true, 'Legitimate active Super Admin can create fests.');

    // 3I: Legitimate active Fest Admin access confirmed
    const faActiveDb = fa1Ctx.firestore();
    await assertSucceeds(
      setDoc(doc(faActiveDb, 'teams', 'TM-LEGIT-FA'), {
        id: 'TM-LEGIT-FA',
        festId: 'FEST-01',
        name: 'Legitimate Team by Fest Admin'
      })
    );
    check(true, 'Legitimate active Fest Admin can create teams in their authorized fest.');

    // 3J: Legitimate active Team Leader access confirmed
    const tlActiveDb = tl1Ctx.firestore();
    await assertSucceeds(
      updateDoc(doc(tlActiveDb, 'complaints', 'COMP-01'), {
        description: 'Legitimate clarification by active Team Leader'
      })
    );
    check(true, 'Legitimate active Team Leader can update complaints for their assigned team.');
  }

  // -------------------------------------------------------------------------
  // TEST 4: Cross-Fest and Cross-Team Isolation (Real Emulator)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 4: Strict Fest and Team Isolation ---');
  {
    const fa1Db = fa1Ctx.firestore();
    const tl1Db = tl1Ctx.firestore();

    // 4A: Fest Admin 1 cannot create team in FEST-02
    await assertFails(
      setDoc(doc(fa1Db, 'teams', 'TM-CROSS-1'), {
        festId: 'FEST-02',
        name: 'Cross Fest Team'
      })
    );
    check(true, 'Fest Admin cannot create team in another fest (FEST-02).');

    // 4B: Fest Admin 1 cannot update team in FEST-02
    await assertFails(
      updateDoc(doc(fa1Db, 'teams', 'TM-FEST2'), {
        name: 'Tampered Titan'
      })
    );
    check(true, 'Fest Admin cannot update team in another fest (FEST-02).');

    // 4C: Fest Admin 1 cannot delete team in FEST-02
    await assertFails(
      deleteDoc(doc(fa1Db, 'teams', 'TM-FEST2'))
    );
    check(true, 'Fest Admin cannot delete team in another fest (FEST-02).');

    // 4D: Team Leader 1 cannot alter teamId or festId of own team
    await assertFails(
      updateDoc(doc(tl1Db, 'teams', 'TM-01'), {
        festId: 'FEST-02'
      })
    );
    check(true, 'Team Leader cannot change team festId.');

    await assertFails(
      updateDoc(doc(tl1Db, 'teams', 'TM-01'), {
        teamLeaderId: 'OTHER-LEADER'
      })
    );
    check(true, 'Team Leader cannot reassign teamLeaderId.');
  }

  // -------------------------------------------------------------------------
  // TEST 5: Client Audit Log Forgery Prevention (Real Emulator)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 5: Client Audit Log Forgery Prevention ---');
  {
    const faDb = fa1Ctx.firestore();
    const pDb = part1Ctx.firestore();

    // 5A: Client cannot create PUBLISH_RESULTS audit record
    await assertFails(
      setDoc(doc(faDb, 'audit_logs', 'AUD-FORGE-1'), {
        festId: 'FEST-01',
        userId: 'EMU-FA1-ACTIVE',
        action: 'PUBLISH_RESULTS'
      })
    );
    check(true, 'Client application cannot create PUBLISH_RESULTS audit record.');

    // 5B: Client cannot create RESOLVE_COMPLAINT audit record
    await assertFails(
      setDoc(doc(faDb, 'audit_logs', 'AUD-FORGE-2'), {
        festId: 'FEST-01',
        userId: 'EMU-FA1-ACTIVE',
        action: 'RESOLVE_COMPLAINT'
      })
    );
    check(true, 'Client application cannot create RESOLVE_COMPLAINT audit record.');

    // 5C: Client cannot create CREATE_TEAM_LEADER_INVITATION audit record
    await assertFails(
      setDoc(doc(faDb, 'audit_logs', 'AUD-FORGE-3'), {
        festId: 'FEST-01',
        userId: 'EMU-FA1-ACTIVE',
        action: 'CREATE_TEAM_LEADER_INVITATION'
      })
    );
    check(true, 'Client application cannot create CREATE_TEAM_LEADER_INVITATION audit record.');

    // 5D: Client CAN create whitelisted non-privileged audit record (UPDATE_PROFILE)
    await assertSucceeds(
      setDoc(doc(faDb, 'audit_logs', 'AUD-LEGIT-1'), {
        festId: 'FEST-01',
        userId: 'EMU-FA1-ACTIVE',
        action: 'UPDATE_PROFILE'
      })
    );
    check(true, 'Fest Admin can log whitelisted non-privileged UPDATE_PROFILE audit event.');

    // 5E: Audit logs are immutable (update denied)
    await assertFails(
      updateDoc(doc(faDb, 'audit_logs', 'AUD-LEGIT-1'), {
        action: 'TAMPERED'
      })
    );
    check(true, 'Audit logs cannot be updated (immutable).');

    // 5F: Audit logs cannot be deleted
    await assertFails(
      deleteDoc(doc(faDb, 'audit_logs', 'AUD-LEGIT-1'))
    );
    check(true, 'Audit logs cannot be deleted (immutable).');
  }

  // -------------------------------------------------------------------------
  // TEST 6: Safe Deletion (No request.resource Dependency)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 6: Document Deletion Security (Real Emulator) ---');
  {
    const faDb = fa1Ctx.firestore();

    await assertSucceeds(deleteDoc(doc(faDb, 'teams', 'TM-DELETE')));
    check(true, 'Team deletion operates safely using resource.data.festId.');

    await assertSucceeds(deleteDoc(doc(faDb, 'programmes', 'PROG-DELETE')));
    check(true, 'Programme deletion operates safely using resource.data.festId.');

    await assertSucceeds(deleteDoc(doc(faDb, 'complaints', 'COMP-DELETE')));
    check(true, 'Complaint deletion operates safely using resource.data.festId.');

    await assertSucceeds(deleteDoc(doc(faDb, 'participants', 'PART-DELETE')));
    check(true, 'Participant deletion operates safely using resource.data.festId.');
  }

  // -------------------------------------------------------------------------
  // TEST 7: ALL SIX CLOUD FUNCTIONS ON THE LIVE FUNCTIONS EMULATOR (127.0.0.1:5001)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 7: All 6 Cloud Functions on Functions Emulator (127.0.0.1:5001) ---');
  {
    const adminApp = admin.initializeApp({ projectId: PROJECT_ID }, 'admin-cf-suite');
    const adminDb = adminApp.firestore();
    const adminAuth = adminApp.auth();

    // Seed dedicated Admin user
    const cfAdminUid = 'EMU-CF-ADMIN';
    await adminDb.collection('users').doc(cfAdminUid).set({
      uid: cfAdminUid,
      name: 'CF Suite Admin',
      role: 'admin',
      festId: 'FEST-01',
      status: 'active'
    });

    const adminCustomToken = await adminAuth.createCustomToken(cfAdminUid, { role: 'admin', festId: 'FEST-01' });

    // Client App for Admin
    const clientApp = initializeApp({ projectId: PROJECT_ID, apiKey: 'fake-api-key' }, 'client-cf-suite');
    const clientAuth = getAuth(clientApp);
    connectAuthEmulator(clientAuth, 'http://127.0.0.1:9099', { disableWarnings: true });
    await signInWithCustomToken(clientAuth, adminCustomToken);

    const functions = getFunctions(clientApp);
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);

    // 7A: Cloud Function: createTeamLeaderInvite
    const createInviteCallable = httpsCallable(functions, 'createTeamLeaderInvite');
    
    // Missing festId rejected
    let missingFestRejected = false;
    try {
      await createInviteCallable({ festId: '', teamId: 'TM-01', name: 'Bob', phone: '+919876543220', email: 'b@b.com' });
    } catch (e) {
      missingFestRejected = true;
    }
    check(missingFestRejected, 'createTeamLeaderInvite rejects missing festId.');

    // Valid invitation creation
    const inviteRes = await createInviteCallable({
      festId: 'FEST-01',
      teamId: 'TM-02',
      name: 'Charlie Leader',
      phone: '+919876543222',
      email: 'charlie@example.com',
      institution: 'Tech Institute'
    });
    check(inviteRes.data.success === true, 'createTeamLeaderInvite executed successfully on live emulator.');
    const inviteId = inviteRes.data.invitation.id;

    // Check server audit log generated
    const invAudits = await adminDb.collection('audit_logs')
      .where('action', '==', 'CREATE_TEAM_LEADER_INVITATION')
      .where('targetId', '==', inviteId)
      .get();
    check(invAudits.size === 1, 'Authoritative CREATE_TEAM_LEADER_INVITATION audit log verified in Firestore.');

    // 7B: Cloud Function: verifyAndActivateTeamLeader
    const tlPhone = '+919876543222';
    const tlUid = 'EMU-TL-ACTIVATE-UID';
    try { await adminAuth.deleteUser(tlUid); } catch(e){}
    await adminAuth.createUser({ uid: tlUid, phoneNumber: tlPhone });
    const tlCustomToken = await adminAuth.createCustomToken(tlUid, { phone_number: tlPhone });

    const tlApp = initializeApp({ projectId: PROJECT_ID, apiKey: 'fake-api-key' }, 'client-tl-activate');
    const tlAuth = getAuth(tlApp);
    connectAuthEmulator(tlAuth, 'http://127.0.0.1:9099', { disableWarnings: true });
    await signInWithCustomToken(tlAuth, tlCustomToken);

    const tlFunctions = getFunctions(tlApp);
    connectFunctionsEmulator(tlFunctions, '127.0.0.1', 5001);

    const activateCallable = httpsCallable(tlFunctions, 'verifyAndActivateTeamLeader');
    const activateRes = await activateCallable({ invitationId: inviteId });
    check(activateRes.data.success === true, 'verifyAndActivateTeamLeader executed successfully on live emulator.');

    // Check user profile activated in Firestore
    const userDocSnap = await adminDb.collection('users').doc(tlUid).get();
    check(
      userDocSnap.exists && userDocSnap.data().role === 'team_leader' && userDocSnap.data().linkedTeamId === 'TM-02',
      'Team leader profile authoritative role and linkedTeamId active in Firestore.'
    );

    // 7C: Cloud Function: reassignTeamLeader
    // Create new target team
    await adminDb.collection('teams').doc('TM-REASSIGN-TARGET').set({
      id: 'TM-REASSIGN-TARGET',
      festId: 'FEST-01',
      name: 'Target House',
      teamLeaderId: null
    });

    const reassignCallable = httpsCallable(functions, 'reassignTeamLeader');
    const reassignRes = await reassignCallable({
      festId: 'FEST-01',
      userId: tlUid,
      newTeamId: 'TM-REASSIGN-TARGET'
    });
    check(reassignRes.data.success === true, 'reassignTeamLeader executed successfully on live emulator.');

    // Check team document updated
    const targetTeamSnap = await adminDb.collection('teams').doc('TM-REASSIGN-TARGET').get();
    check(targetTeamSnap.data().teamLeaderId === tlUid, 'Target team leaderId updated to reassigned leader.');

    // 7D: Cloud Function: toggleTeamLeaderStatus (Suspend & Reactivate)
    const toggleCallable = httpsCallable(functions, 'toggleTeamLeaderStatus');
    const suspendRes = await toggleCallable({
      festId: 'FEST-01',
      userId: tlUid,
      newStatus: 'suspended'
    });
    check(suspendRes.data.success === true, 'toggleTeamLeaderStatus (suspend) executed successfully.');

    // Verify Auth account disabled
    const suspendedAuthUser = await adminAuth.getUser(tlUid);
    check(suspendedAuthUser.disabled === true, 'Team Leader account disabled in Auth on suspension.');

    const reactivateRes = await toggleCallable({
      festId: 'FEST-01',
      userId: tlUid,
      newStatus: 'active'
    });
    check(reactivateRes.data.success === true, 'toggleTeamLeaderStatus (reactivate) executed successfully.');

    const activeAuthUser = await adminAuth.getUser(tlUid);
    check(activeAuthUser.disabled === false, 'Team Leader account re-enabled in Auth on reactivation.');

    // 7E: Cloud Function: publishResults
    const publishCallable = httpsCallable(functions, 'publishResults');
    const publishRes = await publishCallable({
      festId: 'FEST-01',
      programmeId: 'PROG-01'
    });
    check(publishRes.data.success === true, 'publishResults executed successfully on live emulator.');

    const progSnap = await adminDb.collection('programmes').doc('PROG-01').get();
    check(
      progSnap.data().resultPublished === true && progSnap.data().status === 'completed',
      'Programme marked completed & resultPublished in Firestore.'
    );

    const pubAudits = await adminDb.collection('audit_logs')
      .where('action', '==', 'PUBLISH_RESULTS')
      .where('targetId', '==', 'PROG-01')
      .get();
    check(pubAudits.size >= 1, 'Authoritative server-side PUBLISH_RESULTS audit log generated.');

    // 7F: Cloud Function: resolveComplaint
    const resolveCallable = httpsCallable(functions, 'resolveComplaint');
    const resolveRes = await resolveCallable({
      festId: 'FEST-01',
      complaintId: 'COMP-01',
      resolutionNote: 'Jury calibrated marks by +3 points',
      calibratedScore: 95
    });
    check(resolveRes.data.success === true, 'resolveComplaint executed successfully on live emulator.');

    const compSnap = await adminDb.collection('complaints').doc('COMP-01').get();
    check(
      compSnap.data().status === 'resolved' && compSnap.data().calibratedScore === 95,
      'Complaint marked resolved with calibrated score in Firestore.'
    );

    const resAudits = await adminDb.collection('audit_logs')
      .where('action', '==', 'RESOLVE_COMPLAINT')
      .where('targetId', '==', 'COMP-01')
      .get();
    check(resAudits.size >= 1, 'Authoritative server-side RESOLVE_COMPLAINT audit log generated.');
  }

  // Cleanup test environment
  await testEnv.cleanup();

  console.log('\n======================================================================');
  console.log(`  REAL FIREBASE EMULATOR SUMMARY: ${passed} / ${total} TESTS PASSED`);
  console.log('======================================================================\n');
}

runEmulatorSuite().catch((err) => {
  console.error('Real Emulator Suite Execution Failed:', err);
  process.exit(1);
});

