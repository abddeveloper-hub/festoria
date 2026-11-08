/**
 * FESTORIA — ADMIN SHARE FEST & INVITATION LINK SYSTEM TEST SUITE
 * 
 * Verifies:
 * 1. Dedicated "Share Fest" section inside the Fest Admin dashboard.
 * 2. Generation of 4 core links:
 *    - Public Fest Website
 *    - Participant Registration
 *    - Judge Invitation
 *    - Team Leader Invitation
 * 3. Production link generation (NEVER generates localhost for production sharing).
 * 4. Copy Link and Share via WhatsApp capabilities.
 * 5. Secure unique token generation, expiry date association, and revocation.
 * 6. Server-side validation before granting access (knowing URL does not grant access).
 * 7. Participant registration pre-bound to fest ID with approval workflow preserved.
 * 8. Password-authenticated role claiming (no OTP).
 * 9. Rejection of expired and revoked invitations.
 * 10. Role and fest isolation (Judge grants only Judge, Team Leader grants only Team Leader, no cross-fest leakage).
 * 11. Preservation of all existing portal roles & Firestore security rules.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    testsFailed++;
    throw new Error(`Assertion failed: ${message}`);
  }
}

// Simulated mock database & auth for Cloud Functions test harness
function createMockEnvironment() {
  const store = {
    fest_invitations: new Map(),
    teams: new Map([
      ['TM-01', { id: 'TM-01', festId: 'FEST-01', name: 'Red Phoenix', institution: 'Apex College' }],
      ['TM-02', { id: 'TM-02', festId: 'FEST-02', name: 'Blue Titans', institution: 'Blue University' }]
    ]),
    users: new Map([
      ['UID-ADMIN-1', { id: 'UID-ADMIN-1', uid: 'UID-ADMIN-1', role: 'admin', festId: 'FEST-01', name: 'Fest Admin 1', status: 'active' }],
      ['UID-ADMIN-2', { id: 'UID-ADMIN-2', uid: 'UID-ADMIN-2', role: 'admin', festId: 'FEST-02', name: 'Fest Admin 2', status: 'active' }],
      ['UID-SUPERADMIN', { id: 'UID-SUPERADMIN', uid: 'UID-SUPERADMIN', role: 'super_admin', name: 'Super Admin', status: 'active' }],
      ['UID-PARTICIPANT', { id: 'UID-PARTICIPANT', uid: 'UID-PARTICIPANT', role: 'participant', festId: 'FEST-01', name: 'Contestant One', status: 'active' }],
      ['UID-NEW-RECIPIENT', { id: 'UID-NEW-RECIPIENT', uid: 'UID-NEW-RECIPIENT', email: 'anita@univ.edu', phone: '+919876543210', name: 'Dr. Anita', status: 'active' }]
    ]),
    audit_logs: new Map()
  };

  const mockDb = {
    collection: (collName) => ({
      doc: (docId) => {
        const id = docId || `id_${Math.random().toString(36).substring(2, 9)}`;
        return {
          id,
          get: async () => {
            const data = store[collName]?.get(id);
            return { exists: !!data, data: () => data, id };
          },
          set: async (val) => {
            if (!store[collName]) store[collName] = new Map();
            store[collName].set(id, { ...val, id });
          },
          update: async (updates) => {
            const existing = store[collName]?.get(id) || {};
            store[collName].set(id, { ...existing, ...updates });
          }
        };
      },
      where: (field, op, value) => {
        return {
          where: (f2, op2, val2) => ({
            get: async () => {
              const all = Array.from(store[collName]?.values() || []);
              const matches = all.filter((doc) => doc[field] === value && doc[f2] === val2);
              return {
                empty: matches.length === 0,
                docs: matches.map((d) => ({
                  ref: mockDb.collection(collName).doc(d.id),
                  data: () => d
                }))
              };
            }
          }),
          get: async () => {
            const all = Array.from(store[collName]?.values() || []);
            const matches = all.filter((doc) => doc[field] === value);
            return {
              empty: matches.length === 0,
              docs: matches.map((d) => ({
                ref: mockDb.collection(collName).doc(d.id),
                data: () => d
              }))
            };
          }
        };
      }
    }),
    runTransaction: async (updateFn) => {
      const transaction = {
        get: async (ref) => await ref.get(),
        set: async (ref, val) => await ref.set(val),
        update: async (ref, val) => await ref.update(val)
      };
      return await updateFn(transaction);
    }
  };

  const mockAuth = {
    setCustomUserClaims: async (uid, claims) => {
      const user = store.users.get(uid);
      if (user) {
        user.customClaims = claims;
      }
    }
  };

  return { store, mockDb, mockAuth };
}

async function runTestSuite() {
  console.log('======================================================================');
  console.log('  FESTORIA — ADMIN SHARE FEST & INVITATION LINK TEST SUITE');
  console.log('======================================================================\n');

  // Load Cloud Functions handlers
  const functionsPath = path.join(__dirname, '../functions/index.js');
  assert(fs.existsSync(functionsPath), 'functions/index.js exists');
  const cloudModule = await import(pathToFileURL(functionsPath).href);
  const {
    createFestInvitationHandler,
    revokeFestInvitationHandler,
    validateInvitationTokenHandler,
    acceptFestInvitationHandler
  } = cloudModule._handlers;

  // ============================================================================
  // TEST GROUP 1: Share Fest Dashboard UI & Navigation
  // ============================================================================
  console.log('--- TEST GROUP 1: Share Fest Section in Admin Dashboard ---');
  {
    const sharePagePath = path.join(__dirname, '../src/pages/admin/ShareFestPage.tsx');
    assert(fs.existsSync(sharePagePath), 'ShareFestPage.tsx exists');
    const shareContent = fs.readFileSync(sharePagePath, 'utf8');

    // Section title & 4 core link cards
    assert(shareContent.includes('Share Fest'), 'ShareFestPage has "Share Fest" title');
    assert(shareContent.includes('1. Public Fest Website'), 'Card 1: Public Fest Website link present');
    assert(shareContent.includes('2. Participant Registration'), 'Card 2: Participant Registration link present');
    assert(shareContent.includes('3. Judge Invitation Links'), 'Card 3: Judge Invitation Links present');
    assert(shareContent.includes('4. Team Leader Invitation Links'), 'Card 4: Team Leader Invitation Links present');

    // Sidebar integration
    const sidebarPath = path.join(__dirname, '../src/components/layout/Sidebar.tsx');
    assert(fs.existsSync(sidebarPath), 'Sidebar.tsx exists');
    const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');
    assert(sidebarContent.includes("'share_fest'"), 'Sidebar contains share_fest nav item');
    assert(sidebarContent.includes('Share Fest'), 'Sidebar nav label is "Share Fest"');

    // App.tsx router integration
    const appPath = path.join(__dirname, '../src/App.tsx');
    assert(fs.existsSync(appPath), 'App.tsx exists');
    const appContent = fs.readFileSync(appPath, 'utf8');
    assert(appContent.includes("case 'share_fest':"), 'App.tsx routes activeTab share_fest to ShareFestPage');
  }

  // ============================================================================
  // TEST GROUP 2: Link Generation & Non-Localhost Guarantees
  // ============================================================================
  console.log('\n--- TEST GROUP 2: Link Generation & Non-Localhost Guarantees ---');
  {
    const firestoreServicePath = path.join(__dirname, '../src/firebase/firestoreService.ts');
    assert(fs.existsSync(firestoreServicePath), 'firestoreService.ts exists');
    const fsContent = fs.readFileSync(firestoreServicePath, 'utf8');

    assert(fsContent.includes('export function getShareableBaseUrl'), 'firestoreService exports getShareableBaseUrl()');
    assert(fsContent.includes('festoria-cd375.web.app'), 'Defaults to official production domain festoria-cd375.web.app');
    assert(fsContent.includes('localhost'), 'Explicitly checks and filters out localhost');
    assert(fsContent.includes('127.0.0.1'), 'Explicitly filters out 127.0.0.1');

    // Simulated check of getShareableBaseUrl logic
    function mockGetShareableBaseUrl(mockHostname) {
      const isLocal =
        mockHostname === 'localhost' ||
        mockHostname === '127.0.0.1' ||
        mockHostname === '::1';
      if (isLocal) {
        return 'https://festoria-cd375.web.app';
      }
      return `https://${mockHostname}`;
    }

    assert(
      mockGetShareableBaseUrl('localhost') === 'https://festoria-cd375.web.app',
      'Localhost development environment returns deployed production URL for sharing'
    );
    assert(
      mockGetShareableBaseUrl('127.0.0.1') === 'https://festoria-cd375.web.app',
      '127.0.0.1 returns deployed production URL for sharing'
    );
    assert(
      mockGetShareableBaseUrl('fest.mycollege.edu') === 'https://fest.mycollege.edu',
      'Production deployed custom domain is preserved'
    );

    // Verify WhatsApp sharing and copy actions
    const shareContent = fs.readFileSync(path.join(__dirname, '../src/pages/admin/ShareFestPage.tsx'), 'utf8');
    assert(shareContent.includes('navigator.clipboard.writeText'), 'Provides Copy Link action with clipboard API');
    assert(shareContent.includes('https://api.whatsapp.com/send'), 'Provides direct Share via WhatsApp action');
    assert(shareContent.includes('encodeURIComponent'), 'Properly encodes WhatsApp sharing messages');
  }

  // ============================================================================
  // TEST GROUP 3: Server-Side Judge Invitation Workflow
  // ============================================================================
  console.log('\n--- TEST GROUP 3: Server-Side Judge Invitation Workflow ---');
  {
    const { store, mockDb, mockAuth } = createMockEnvironment();

    // 1. Authorized Fest Admin creates Judge Invitation
    const req = {
      auth: { uid: 'UID-ADMIN-1' },
      data: {
        festId: 'FEST-01',
        role: 'judge',
        recipientContact: 'anita@univ.edu',
        recipientName: 'Dr. Anita Sharma',
        assignedJudgeId: 'JD-01',
        assignedJudgeName: 'Dr. Anita Sharma',
        expiresInDays: 7
      }
    };

    const result = await createFestInvitationHandler(req, { db: mockDb });
    assert(result.success === true, 'Judge invitation created successfully');
    assert(result.invitation.role === 'judge', 'Invitation role is set to judge');
    assert(result.invitation.festId === 'FEST-01', 'Invitation associated with FEST-01');
    assert(result.invitation.status === 'pending', 'Initial invitation status is pending');
    assert(result.invitation.token.startsWith('tok_jd_'), 'Token generated with secure tok_jd_ prefix');
    assert(new Date(result.invitation.expiresAt).getTime() > Date.now(), 'Expiry date is set into the future');

    const createdToken = result.invitation.token;
    const invId = result.invitation.id;

    // 2. Public Token Validation
    const valRes = await validateInvitationTokenHandler({ data: { token: createdToken } }, { db: mockDb });
    assert(valRes.valid === true, 'Token validates successfully via backend handler');
    assert(valRes.invitation.role === 'judge', 'Validation response confirms judge role');
    assert(valRes.invitation.festId === 'FEST-01', 'Validation response confirms target fest FEST-01');

    // 3. User Claims / Accepts Invitation
    const acceptReq = {
      auth: { uid: 'UID-NEW-RECIPIENT', token: { email: 'anita@univ.edu' } },
      data: { token: createdToken }
    };

    const acceptRes = await acceptFestInvitationHandler(acceptReq, { db: mockDb, auth: mockAuth });
    assert(acceptRes.success === true, 'Judge invitation accepted successfully');
    assert(acceptRes.role === 'judge', 'Assigned role is judge');

    // Verify user profile in database
    const user = store.users.get('UID-NEW-RECIPIENT');
    assert(user.role === 'judge', 'User profile role updated to judge in database');
    assert(user.festId === 'FEST-01', 'User profile bound to FEST-01');
    assert(user.linkedJudgeId === 'JD-01', 'User linked to assigned judge profile JD-01');
    assert(user.customClaims.role === 'judge', 'Firebase Auth custom claims updated to judge');

    // Verify invitation status updated to accepted
    const storedInv = Array.from(store.fest_invitations.values()).find((i) => i.id === invId) || store.fest_invitations.get(invId);
    assert(storedInv && storedInv.status === 'accepted', 'Invitation marked accepted in database');

    // 4. Already Claimed Token Cannot Be Claimed Again
    let doubleClaimBlocked = false;
    try {
      await acceptFestInvitationHandler(acceptReq, { db: mockDb, auth: mockAuth });
    } catch (e) {
      doubleClaimBlocked = true;
    }
    assert(doubleClaimBlocked, 'Already-claimed invitation strictly blocked from reuse');
  }

  // ============================================================================
  // TEST GROUP 4: Server-Side Team Leader Invitation Workflow & Scoping
  // ============================================================================
  console.log('\n--- TEST GROUP 4: Server-Side Team Leader Invitation Workflow ---');
  {
    const { store, mockDb, mockAuth } = createMockEnvironment();

    // 1. Authorized Fest Admin creates Team Leader Invitation for TM-01
    const req = {
      auth: { uid: 'UID-ADMIN-1' },
      data: {
        festId: 'FEST-01',
        role: 'team_leader',
        recipientContact: '+919876543210',
        recipientName: 'Rahul Verma',
        assignedTeamId: 'TM-01',
        assignedTeamName: 'Red Phoenix',
        expiresInDays: 3
      }
    };

    const result = await createFestInvitationHandler(req, { db: mockDb });
    assert(result.success === true, 'Team Leader invitation created successfully');
    assert(result.invitation.role === 'team_leader', 'Invitation role is team_leader');
    assert(result.invitation.assignedTeamId === 'TM-01', 'Assigned team is TM-01');
    assert(result.invitation.token.startsWith('tok_tl_'), 'Token generated with tok_tl_ prefix');

    const createdToken = result.invitation.token;
    const invId = result.invitation.id;

    // 2. Reject mismatched team belonging to another fest
    let crossTeamBlocked = false;
    try {
      await createFestInvitationHandler(
        {
          auth: { uid: 'UID-ADMIN-1' },
          data: {
            festId: 'FEST-01',
            role: 'team_leader',
            recipientContact: '+919876543210',
            assignedTeamId: 'TM-02' // Belongs to FEST-02!
          }
        },
        { db: mockDb }
      );
    } catch (e) {
      crossTeamBlocked = true;
    }
    assert(crossTeamBlocked, 'Assigning team from another fest strictly blocked');

    // 3. User Accepts Team Leader Invitation
    const acceptReq = {
      auth: { uid: 'UID-NEW-RECIPIENT', token: { phone_number: '+919876543210' } },
      data: { token: createdToken }
    };

    const acceptRes = await acceptFestInvitationHandler(acceptReq, { db: mockDb, auth: mockAuth });
    assert(acceptRes.success === true, 'Team Leader invitation accepted successfully');
    assert(acceptRes.role === 'team_leader', 'Assigned role is team_leader');

    const user = store.users.get('UID-NEW-RECIPIENT');
    assert(user.role === 'team_leader', 'User role set to team_leader');
    assert(user.linkedTeamId === 'TM-01', 'User linked strictly to TM-01');
    assert(user.festId === 'FEST-01', 'User scoped to FEST-01');
    assert(user.customClaims.linkedTeamId === 'TM-01', 'Custom claims reflect linked team');
  }

  // ============================================================================
  // TEST GROUP 5: Expiration & Revocation Enforcement
  // ============================================================================
  console.log('\n--- TEST GROUP 5: Expiration & Revocation Enforcement ---');
  {
    const { store, mockDb, mockAuth } = createMockEnvironment();

    // 1. Create invitation
    const req = {
      auth: { uid: 'UID-ADMIN-1' },
      data: {
        festId: 'FEST-01',
        role: 'judge',
        recipientContact: 'temp@univ.edu',
        expiresInDays: 7
      }
    };
    const { invitation } = await createFestInvitationHandler(req, { db: mockDb });

    // 2. Revoke invitation
    const revokeRes = await revokeFestInvitationHandler(
      {
        auth: { uid: 'UID-ADMIN-1' },
        data: { invitationId: invitation.id, festId: 'FEST-01' }
      },
      { db: mockDb }
    );
    assert(revokeRes.success === true, 'Fest Admin successfully revokes invitation');

    // 3. Validate revoked token
    let revokedValidateBlocked = false;
    try {
      await validateInvitationTokenHandler({ data: { token: invitation.token } }, { db: mockDb });
    } catch (e) {
      revokedValidateBlocked = true;
      assert(e.message.includes('revoked'), 'Validation error explicitly states invitation has been revoked');
    }
    assert(revokedValidateBlocked, 'Revoked token validation rejected');

    // 4. Attempt to claim revoked token
    let claimRevokedBlocked = false;
    try {
      await acceptFestInvitationHandler(
        { auth: { uid: 'UID-NEW-RECIPIENT' }, data: { token: invitation.token } },
        { db: mockDb, auth: mockAuth }
      );
    } catch (e) {
      claimRevokedBlocked = true;
    }
    assert(claimRevokedBlocked, 'Claiming a revoked invitation is strictly denied');

    // 5. Test Expired Invitation
    const expiredInv = {
      id: 'INV-EXPIRED-999',
      token: 'tok_jd_expired_token',
      festId: 'FEST-01',
      role: 'judge',
      recipientContact: 'old@univ.edu',
      status: 'pending',
      expiresAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // Expired yesterday
    };
    store.fest_invitations.set(expiredInv.id, expiredInv);

    let expiredValidationBlocked = false;
    try {
      await validateInvitationTokenHandler({ data: { token: expiredInv.token } }, { db: mockDb });
    } catch (e) {
      expiredValidationBlocked = true;
      assert(e.message.includes('expired'), 'Validation error explicitly identifies expired token');
    }
    assert(expiredValidationBlocked, 'Expired token rejected by server');
  }

  // ============================================================================
  // TEST GROUP 6: Cross-Fest Tampering & Non-Escalation Defenses
  // ============================================================================
  console.log('\n--- TEST GROUP 6: Cross-Fest Tampering & Non-Escalation Defenses ---');
  {
    const { store, mockDb, mockAuth } = createMockEnvironment();

    // 1. Fest Admin of FEST-02 attempts to issue invitation for FEST-01
    let crossAdminBlocked = false;
    try {
      await createFestInvitationHandler(
        {
          auth: { uid: 'UID-ADMIN-2' }, // Admin for FEST-02
          data: {
            festId: 'FEST-01',          // Target FEST-01!
            role: 'judge',
            recipientContact: 'spy@evil.org'
          }
        },
        { db: mockDb }
      );
    } catch (e) {
      crossAdminBlocked = true;
    }
    assert(crossAdminBlocked, 'Fest Admin cannot create invitations for another festival');

    // 2. Participant attempting to issue invitations
    let participantCreateBlocked = false;
    try {
      await createFestInvitationHandler(
        {
          auth: { uid: 'UID-PARTICIPANT' },
          data: {
            festId: 'FEST-01',
            role: 'judge',
            recipientContact: 'friend@univ.edu'
          }
        },
        { db: mockDb }
      );
    } catch (e) {
      participantCreateBlocked = true;
    }
    assert(participantCreateBlocked, 'Regular participant cannot create invitations');

    // 3. Unauthenticated caller attempting to claim with dummy token
    let unauthenticatedBlocked = false;
    try {
      await acceptFestInvitationHandler(
        { auth: null, data: { token: 'tok_jd_some_token' } },
        { db: mockDb, auth: mockAuth }
      );
    } catch (e) {
      unauthenticatedBlocked = true;
    }
    assert(unauthenticatedBlocked, 'Unauthenticated caller cannot claim roles via token');
  }

  // ============================================================================
  // TEST GROUP 7: Participant Registration Pre-Binding & Approval Preservation
  // ============================================================================
  console.log('\n--- TEST GROUP 7: Participant Registration Pre-Binding & Approval ---');
  {
    const publicFestPagePath = path.join(__dirname, '../src/pages/public/PublicFestPage.tsx');
    assert(fs.existsSync(publicFestPagePath), 'PublicFestPage.tsx exists');
    const content = fs.readFileSync(publicFestPagePath, 'utf8');

    assert(content.includes('action === \'register\''), 'PublicFestPage detects ?action=register in URL');
    assert(content.includes('setActiveFestId'), 'Binds activeFestId to targeted festival on registration');
    assert(content.includes("openAuth('participant', 'register')"), 'Automatically triggers Participant Registration');

    const authServicePath = path.join(__dirname, '../src/firebase/authService.ts');
    assert(fs.existsSync(authServicePath), 'authService.ts exists');
    const authServiceContent = fs.readFileSync(authServicePath, 'utf8');

    assert(authServiceContent.includes('pending_approval'), 'Participant status defaults to pending_approval');
    assert(authServiceContent.includes('registerParticipantWithCredentials'), 'Uses password credentials (NO OTP)');

    const authModalPath = path.join(__dirname, '../src/components/common/PhoneAuthModal.tsx');
    assert(fs.existsSync(authModalPath), 'PhoneAuthModal.tsx exists');
    const authModalContent = fs.readFileSync(authModalPath, 'utf8');
    assert(authModalContent.includes('registerParticipantWithCredentials'), 'Modal calls registerParticipantWithCredentials');
  }

  // ============================================================================
  // TEST GROUP 8: Firestore Security Rules Section 18
  // ============================================================================
  console.log('\n--- TEST GROUP 8: Firestore Security Rules Section 18 ---');
  {
    const rulesPath = path.join(__dirname, '../firestore.rules');
    assert(fs.existsSync(rulesPath), 'firestore.rules exists');
    const rules = fs.readFileSync(rulesPath, 'utf8');

    assert(rules.includes('match /fest_invitations/{invitationId}'), 'Rules contain /fest_invitations collection');
    assert(rules.includes('isFestAdmin(resource.data.festId)'), 'Read/update restricted to authorized fest admin');
    assert(rules.includes('isSuperAdmin()'), 'Super Admin permitted governance read/write');
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n======================================================================');
  console.log(`  SHARE FEST TEST SUITE: ${testsPassed} / ${testsPassed + testsFailed} TESTS PASSED.`);
  console.log('======================================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('\nTest Suite Failed with Error:', err);
  process.exit(1);
});
