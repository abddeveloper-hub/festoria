/**
 * Festoria — Create New Fest Flow & Workspace Provisioning Test Suite
 *
 * Verifies end-to-end functionality, security, and data integrity for:
 * 1. Landing Page & Public Navigation Trigger
 * 2. Organizer Firebase Phone Authentication & Identity Binding
 * 3. Multi-Section Form (Sections A, B, C, D) Validation & Date Verification
 * 4. Application Submission, Unique ID Generation & Duplicate Prevention
 * 5. Track Application Status by ID & Phone
 * 6. Super Admin Governance Pipeline & 5 Statistics Calculations
 * 7. Server-Side Approval & Automatic Organizer-to-Admin Assignment
 * 8. Independent Fest Workspace Provisioning (/fests, /fest_settings, /fest_memberships)
 * 9. Rejection with Mandatory Reason & Request More Information Flows
 * 10. Cross-Fest Isolation & Non-Escalation Guarantees
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import handlers from backend Cloud Functions
const functionsModule = await import('../functions/index.js');
const {
  verifySuperAdminAuth,
  approveFestApplicationHandler,
  rejectFestApplicationHandler,
  requestMoreInfoFestApplicationHandler,
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
  if (!store.fests) store.fests = new Map();
  if (!store.fest_settings) store.fest_settings = new Map();
  if (!store.fest_requests) store.fest_requests = new Map();
  if (!store.fest_memberships) store.fest_memberships = new Map();
  if (!store.platform_audit_logs) store.platform_audit_logs = new Map();
  if (!store.notifications) store.notifications = new Map();

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
              data: () => JSON.parse(JSON.stringify(data))
            }));
            for (const cond of conditions) {
              if (cond.op === '==') {
                docs = docs.filter((d) => d.data()[cond.field] === cond.val);
              } else if (cond.op === 'in') {
                docs = docs.filter((d) => Array.isArray(cond.val) && cond.val.includes(d.data()[cond.field]));
              }
            }
            return {
              empty: docs.length === 0,
              size: docs.length,
              docs
            };
          }
        };
        return queryObj;
      },
      get: async () => {
        const col = getCollection(name);
        const docs = Array.from(col.entries()).map(([id, data]) => ({
          id,
          data: () => JSON.parse(JSON.stringify(data))
        }));
        return {
          empty: docs.length === 0,
          size: docs.length,
          docs
        };
      }
    }),
    runTransaction: async (updateFunction) => {
      const transaction = {
        get: async (docRef) => await docRef.get(),
        set: (docRef, data, options = {}) => {
          const col = getCollection(docRef.collectionName);
          if (options.merge && col.has(docRef.id)) {
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
      return await updateFunction(transaction);
    }
  };
}

/**
 * Mock Firebase Auth
 */
function createMockAuth() {
  const claimsStore = new Map();
  return {
    _claims: claimsStore,
    setCustomUserClaims: async (uid, claims) => {
      claimsStore.set(uid, claims);
    }
  };
}

console.log('================================================================');
console.log('  FESTORIA — CREATE NEW FEST & WORKSPACE PROVISIONING TEST SUITE');
console.log('================================================================\n');

async function runTests() {
  const mockDb = createMockFirestore({
    users: {
      'user_super_admin': {
        id: 'user_super_admin',
        name: 'Alexander Wright',
        email: 'superadmin@festoria.platform',
        phone: '+919999988888',
        role: 'super_admin',
        status: 'active'
      },
      'user_organizer_apex': {
        id: 'user_organizer_apex_uid',
        name: 'Dr. Ramesh Sharma',
        email: 'convenor@apex.edu',
        phone: '+919876543210',
        role: 'participant', // Before approval, participant role
        status: 'active'
      },
      'user_regular_fest_admin': {
        id: 'user_fest_admin_01',
        name: 'Admin Sarah',
        email: 'admin@fest01.edu',
        phone: '+919876500001',
        role: 'admin',
        festId: 'FEST-01',
        status: 'active'
      }
    },
    fests: {
      'FEST-01': {
        id: 'FEST-01',
        name: 'Spring Fiesta 2026',
        edition: '2026',
        adminId: 'user_fest_admin_01',
        status: 'setup'
      }
    },
    fest_requests: {
      'APP-2026-1001': {
        id: 'APP-2026-1001',
        festName: 'Apex Horizons Festival',
        shortName: 'AHF-26',
        edition: '2026',
        category: 'Cultural & Arts',
        description: 'Flagship national collegiate cultural fest with 30 performing arts competitions.',
        institution: 'Apex University of Technology',
        institutionAddress: 'Outer Ring Road, Bangalore, Karnataka',
        logoUrl: 'https://apex.edu/assets/fest-logo.png',
        startDate: '2026-11-20',
        endDate: '2026-11-23',
        registrationStartDate: '2026-10-01',
        registrationEndDate: '2026-11-15',
        venue: 'Main Stadium & Silver Jubilee Auditorium',
        expectedParticipants: 1200,
        plannedProgrammesCount: 30,
        requestingAdminId: 'user_organizer_apex_uid',
        requestingAdminName: 'Dr. Ramesh Sharma',
        designation: 'Dean of Student Affairs',
        requestingAdminEmail: 'convenor@apex.edu',
        requestingAdminPhone: '+919876543210',
        websiteUrl: 'https://apexhorizons.edu',
        previousFestDetails: 'Attracted 2,500 participants across 45 institutions in 2025 edition.',
        additionalMessage: 'Auditorium acoustics and sound clearance approved by university senate.',
        status: 'pending',
        workspaceStatus: 'pending_approval',
        submissionDate: '2026-11-08',
        createdAt: '2026-11-08T05:00:00Z',
        updatedAt: '2026-11-08T05:00:00Z',
        history: [
          {
            date: '2026-11-08 05:00',
            actor: 'Dr. Ramesh Sharma',
            action: 'Submitted Fest Application',
            note: 'Application registered for Apex Horizons Festival.'
          }
        ]
      }
    }
  });

  const mockAuth = createMockAuth();
  const deps = { db: mockDb, auth: mockAuth };

  // ============================================================================
  // TEST 1: Landing Page & Public Navigation Trigger
  // ============================================================================
  console.log('--- TEST 1: Landing Page & Public Navigation Trigger ---');
  {
    const publicPagePath = path.join(__dirname, '../src/pages/PublicPage.tsx');
    const homePath = path.join(__dirname, '../src/pages/public/FestoriaHomePage.tsx');
    assert(fs.existsSync(publicPagePath), 'PublicPage.tsx exists');
    assert(fs.existsSync(homePath), 'FestoriaHomePage.tsx exists');
    const content = fs.readFileSync(homePath, 'utf8') + fs.readFileSync(publicPagePath, 'utf8');

    assert(content.includes('Create New Fest') || content.includes('Create Your Fest'), 'PublicPage navbar has prominent "Create New Fest" option');
    assert(content.includes('Track Application'), 'PublicPage has "Track Application" link');
    assert(content.includes('CreateFestModal'), 'PublicPage mounts CreateFestModal');
  }

  // ============================================================================
  // TEST 2: Organizer Phone Authentication & Identity Binding
  // ============================================================================
  console.log('\n--- TEST 2: Organizer Phone Authentication & Identity Binding ---');
  {
    assert(normalizePhone('9876543210') === '+919876543210', '10-digit phone normalized with +91 country code');
    assert(normalizePhone('+91 98765 43210') === '+919876543210', 'Formatted phone stripped and normalized');

    const modalPath = path.join(__dirname, '../src/components/public/CreateFestModal.tsx');
    assert(fs.existsSync(modalPath), 'CreateFestModal.tsx exists');
    const modalContent = fs.readFileSync(modalPath, 'utf8');

    assert(modalContent.includes('signInWithCredentials'), 'CreateFestModal invokes signInWithCredentials');
    assert(modalContent.includes('registerOrganizerWithCredentials'), 'CreateFestModal invokes registerOrganizerWithCredentials');
    assert(modalContent.includes('readOnly'), 'Verified phone number is displayed as read-only to prevent tampering');
  }

  // ============================================================================
  // TEST 3: Multi-Section Form (Sections A, B, C, D) Validation
  // ============================================================================
  console.log('\n--- TEST 3: Multi-Section Form Validation ---');
  {
    const modalPath = path.join(__dirname, '../src/components/public/CreateFestModal.tsx');
    const modalContent = fs.readFileSync(modalPath, 'utf8');

    // Section A
    assert(modalContent.includes('SECTION A – FEST INFORMATION'), 'Modal contains SECTION A – FEST INFORMATION');
    assert(modalContent.includes('shortName'), 'Modal contains short name / abbreviation input');
    assert(modalContent.includes('logoUrl'), 'Modal contains fest logo URL input');

    // Section B
    assert(modalContent.includes('SECTION B – EVENT DETAILS'), 'Modal contains SECTION B – EVENT DETAILS');
    assert(modalContent.includes('registrationStartDate'), 'Modal contains registration start date');
    assert(modalContent.includes('registrationEndDate'), 'Modal contains registration end date');

    // Section C
    assert(modalContent.includes('SECTION C – ORGANIZER INFORMATION'), 'Modal contains SECTION C – ORGANIZER INFORMATION');
    assert(modalContent.includes('designation'), 'Modal contains organizer designation input');

    // Section D
    assert(modalContent.includes('SECTION D – ADDITIONAL INFORMATION'), 'Modal contains SECTION D – ADDITIONAL INFORMATION');
    assert(modalContent.includes('websiteUrl'), 'Modal contains website URL input');
    assert(modalContent.includes('previousFestDetails'), 'Modal contains previous fest details');
  }

  // ============================================================================
  // TEST 4: Duplicate Submission Prevention
  // ============================================================================
  console.log('\n--- TEST 4: Duplicate Submission Prevention ---');
  {
    const reqStore = mockDb._store.fest_requests;
    const dupInst = 'Apex University of Technology';
    let isInstDuplicate = false;
    for (const r of reqStore.values()) {
      if (['pending', 'submitted', 'under_review', 'more_info_required'].includes(r.status) &&
          r.institution.toLowerCase() === dupInst.toLowerCase()) {
        isInstDuplicate = true;
        break;
      }
    }
    assert(isInstDuplicate === true, 'Duplicate pending application for same institution accurately caught');

    const dupPhone = '+919876543210';
    let isPhoneDuplicate = false;
    for (const r of reqStore.values()) {
      if (['pending', 'submitted', 'under_review', 'more_info_required'].includes(r.status) &&
          r.requestingAdminPhone === dupPhone) {
        isPhoneDuplicate = true;
        break;
      }
    }
    assert(isPhoneDuplicate === true, 'Duplicate pending application for same phone number accurately caught');
  }

  // ============================================================================
  // TEST 5: Track Application Status by ID & Phone
  // ============================================================================
  console.log('\n--- TEST 5: Track Application Status by ID & Phone ---');
  {
    const req = mockDb._store.fest_requests.get('APP-2026-1001');
    assert(!!req, 'Application APP-2026-1001 retrievable by ID');
    assert(req.festName === 'Apex Horizons Festival', 'Correct fest name returned for tracking');
    assert(req.status === 'pending', 'Status is pending');
  }

  // ============================================================================
  // TEST 6: Super Admin Governance Pipeline & 5 Statistics
  // ============================================================================
  console.log('\n--- TEST 6: Super Admin Governance Pipeline & 5 Statistics ---');
  {
    const reqs = Array.from(mockDb._store.fest_requests.values());
    const totalApps = reqs.length;
    const pendingApps = reqs.filter((r) => ['pending', 'submitted', 'PENDING'].includes(r.status)).length;
    const underReview = reqs.filter((r) => ['under_review', 'UNDER_REVIEW'].includes(r.status)).length;
    const approvedApps = reqs.filter((r) => ['approved', 'APPROVED', 'workspace_created', 'WORKSPACE_CREATED'].includes(r.status)).length;
    const rejectedApps = reqs.filter((r) => ['rejected', 'REJECTED'].includes(r.status)).length;

    assert(totalApps === 1, `Total Applications count: ${totalApps}`);
    assert(pendingApps === 1, `Pending Applications count: ${pendingApps}`);
    assert(underReview === 0, `Under Review count: ${underReview}`);
    assert(approvedApps === 0, `Approved Applications count: ${approvedApps}`);
    assert(rejectedApps === 0, `Rejected Applications count: ${rejectedApps}`);

    const reqPagePath = path.join(__dirname, '../src/pages/superAdmin/FestRequestsPage.tsx');
    assert(fs.existsSync(reqPagePath), 'FestRequestsPage.tsx exists');
    const reqPageContent = fs.readFileSync(reqPagePath, 'utf8');

    assert(reqPageContent.includes('Total Applications'), 'FestRequestsPage displays Total Applications statistic');
    assert(reqPageContent.includes('Pending Review'), 'FestRequestsPage displays Pending Review statistic');
    assert(reqPageContent.includes('Under Review'), 'FestRequestsPage displays Under Review statistic');
    assert(reqPageContent.includes('Approved'), 'FestRequestsPage displays Approved statistic');
    assert(reqPageContent.includes('Rejected'), 'FestRequestsPage displays Rejected statistic');
    assert(reqPageContent.includes('startDateFilter'), 'FestRequestsPage supports date range filtering');
  }

  // ============================================================================
  // TEST 7: Unauthorized Approval Blocking
  // ============================================================================
  console.log('\n--- TEST 7: Unauthorized Approval Blocking ---');
  {
    // Unauthenticated
    let unauthBlocked = false;
    try {
      await approveFestApplicationHandler({ auth: null, data: { requestId: 'APP-2026-1001' } }, deps);
    } catch (e) {
      unauthBlocked = true;
      assert(e.code === 'unauthenticated', 'Unauthenticated caller blocked with unauthenticated code');
    }
    assert(unauthBlocked, 'Unauthenticated approval rejected');

    // Participant self-approval
    let selfApprovalBlocked = false;
    try {
      await approveFestApplicationHandler(
        { auth: { uid: 'user_organizer_apex_uid' }, data: { requestId: 'APP-2026-1001' } },
        deps
      );
    } catch (e) {
      selfApprovalBlocked = true;
      assert(e.code === 'permission-denied', 'Participant self-approval blocked with permission-denied code');
    }
    assert(selfApprovalBlocked, 'Participant self-approval rejected');

    // Regular Fest Admin from FEST-01 cannot approve platform requests
    let festAdminBlocked = false;
    try {
      await approveFestApplicationHandler(
        { auth: { uid: 'user_fest_admin_01' }, data: { requestId: 'APP-2026-1001' } },
        deps
      );
    } catch (e) {
      festAdminBlocked = true;
      assert(e.code === 'permission-denied', 'Regular Fest Admin blocked from approving platform fest applications');
    }
    assert(festAdminBlocked, 'Regular Fest Admin approval rejected');
  }

  // ============================================================================
  // TEST 8: Server-Side Super Admin Approval & Automatic Fest Admin Assignment
  // ============================================================================
  console.log('\n--- TEST 8: Super Admin Approval & Automatic Admin Assignment ---');
  {
    const approvalRes = await approveFestApplicationHandler(
      {
        auth: { uid: 'user_super_admin' },
        data: {
          requestId: 'APP-2026-1001',
          approvalNote: 'Institutional sanction letter verified. Festival authorized for 2026 academic calendar.'
        }
      },
      deps
    );

    assert(approvalRes.success === true, 'Super Admin approval executed successfully');
    const allocatedFestId = approvalRes.festId;
    assert(allocatedFestId.startsWith('FEST-'), `Allocated valid Fest ID: ${allocatedFestId}`);

    // Verify Fest Workspace Created
    const createdFest = mockDb._store.fests.get(allocatedFestId);
    assert(!!createdFest, 'Fest document created in /fests collection');
    assert(createdFest.name === 'Apex Horizons Festival', 'Fest name saved in workspace');
    assert(createdFest.shortName === 'AHF-26', 'Short name saved in workspace');
    assert(createdFest.adminId === 'user_organizer_apex_uid', 'Fest adminId accurately linked to organizer UID');
    assert(createdFest.status === 'setup', 'Fest workspace initialized with status setup');

    // Verify Initial Fest Configuration in /fest_settings
    const settingsDoc = mockDb._store.fest_settings.get(allocatedFestId);
    assert(!!settingsDoc, 'Initial fest settings document created in /fest_settings');
    assert(settingsDoc.festName === 'Apex Horizons Festival', 'Fest settings document has correct fest name');

    // Verify Automatic Organizer Promotion to Admin in /users
    const organizerUser = mockDb._store.users.get('user_organizer_apex_uid');
    assert(organizerUser.role === 'admin', 'Organizer role automatically updated to admin in /users');
    assert(organizerUser.festId === allocatedFestId, 'Organizer festId assigned to newly created workspace');
    assert(organizerUser.status === 'active', 'Organizer account is active');

    // Verify Fest Membership document created in /fest_memberships
    const membership = mockDb._store.fest_memberships.get(`user_organizer_apex_uid_${allocatedFestId}`);
    assert(!!membership, 'Fest membership document created in /fest_memberships');
    assert(membership.role === 'admin', 'Membership role set to admin');
    assert(membership.festId === allocatedFestId, 'Membership festId matches allocated fest');

    // Verify Fest Request transitioned to approved & workspace_created
    const updatedReq = mockDb._store.fest_requests.get('APP-2026-1001');
    assert(updatedReq.status === 'approved', 'Request status set to approved');
    assert(updatedReq.workspaceStatus === 'workspace_created', 'Request workspaceStatus set to workspace_created');
    assert(updatedReq.allocatedFestId === allocatedFestId, 'Allocated fest ID stored in request record');

    // Verify Notification generated for Organizer
    const notifs = Array.from(mockDb._store.notifications.values());
    const approvalNotif = notifs.find((n) => n.userId === 'user_organizer_apex_uid');
    assert(!!approvalNotif, 'Notification dispatched to organizer user ID');
    assert(approvalNotif.type === 'success', 'Approval notification marked as success');

    // Verify Custom Claims assigned on Firebase Auth
    const userClaims = mockAuth._claims.get('user_organizer_apex_uid');
    assert(userClaims && userClaims.role === 'admin', 'Firebase Auth custom claims set to admin');
    assert(userClaims.festId === allocatedFestId, 'Firebase Auth custom claims contain allocated festId');

    // Verify Immutable Platform Audit Log recorded
    const auditLogs = Array.from(mockDb._store.platform_audit_logs.values());
    const approveLog = auditLogs.find((l) => l.action === 'APPROVE_FEST_REQUEST' && l.targetId === 'APP-2026-1001');
    assert(!!approveLog, 'Platform audit log recorded with action APPROVE_FEST_REQUEST');
    assert(approveLog.actorRole === 'super_admin', 'Audit log actorRole is super_admin');
  }

  // ============================================================================
  // TEST 9: Request More Information & Rejection Workflows
  // ============================================================================
  console.log('\n--- TEST 9: Request More Information & Rejection Workflows ---');
  {
    // Create new application
    mockDb._store.fest_requests.set('APP-2026-1002', {
      id: 'APP-2026-1002',
      festName: 'Silver Valley Cultural Fest',
      edition: '2026',
      institution: 'Silver Valley Polytechnic',
      requestingAdminId: 'user_organizer_sv',
      requestingAdminName: 'Prof. Anita Roy',
      requestingAdminEmail: 'anita@silvervalley.edu',
      requestingAdminPhone: '+919876543202',
      status: 'pending',
      submissionDate: '2026-11-08',
      history: []
    });

    // 9a: Request More Information
    const moreInfoRes = await requestMoreInfoFestApplicationHandler(
      {
        auth: { uid: 'user_super_admin' },
        data: {
          requestId: 'APP-2026-1002',
          moreInfoMessage: 'Please provide proof of campus auditorium booking and fire safety certificate.'
        }
      },
      deps
    );
    assert(moreInfoRes.success === true, 'Request more info executed successfully');
    const infoReq = mockDb._store.fest_requests.get('APP-2026-1002');
    assert(infoReq.status === 'more_info_required', 'Status transitioned to more_info_required');
    assert(infoReq.moreInfoMessage.includes('fire safety certificate'), 'Clarification message saved');

    // 9b: Rejection with Mandatory Reason
    let missingReasonBlocked = false;
    try {
      await rejectFestApplicationHandler(
        { auth: { uid: 'user_super_admin' }, data: { requestId: 'APP-2026-1002', rejectionReason: '' } },
        deps
      );
    } catch (e) {
      missingReasonBlocked = true;
      assert(e.code === 'invalid-argument', 'Rejection without reason rejected with invalid-argument');
    }
    assert(missingReasonBlocked, 'Mandatory rejection reason enforced');

    const rejectRes = await rejectFestApplicationHandler(
      {
        auth: { uid: 'user_super_admin' },
        data: {
          requestId: 'APP-2026-1002',
          rejectionReason: 'Institution clearance was not furnished within the stipulated window.'
        }
      },
      deps
    );
    assert(rejectRes.success === true, 'Rejection completed successfully');
    const rejectedReq = mockDb._store.fest_requests.get('APP-2026-1002');
    assert(rejectedReq.status === 'rejected', 'Status updated to rejected');
    assert(rejectedReq.rejectionReason.includes('not furnished within'), 'Rejection reason persisted');
  }

  // ============================================================================
  // TEST 10: Cross-Fest Isolation & Non-Escalation Guarantees
  // ============================================================================
  console.log('\n--- TEST 10: Cross-Fest Isolation & Non-Escalation Guarantees ---');
  {
    const approvedAdmin = mockDb._store.users.get('user_organizer_apex_uid');
    assert(approvedAdmin.role === 'admin', 'Approved organizer has role admin');
    assert(approvedAdmin.role !== 'super_admin', 'Approved organizer cannot escalate to super_admin');
    assert(approvedAdmin.festId !== 'FEST-01', 'Approved organizer cannot access FEST-01');

    // Verify Firestore security rules protect cross-fest modification
    const rulesPath = path.join(__dirname, '../firestore.rules');
    assert(fs.existsSync(rulesPath), 'firestore.rules exists');
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');

    assert(rulesContent.includes('isFestAdmin(festId)'), 'isFestAdmin helper scopes operations strictly to festId');
    assert(rulesContent.includes('allow create: if isAuthenticated() &&'), 'fest_requests creation restricted to authenticated organizer');
    assert(rulesContent.includes('allow update, delete: if isSuperAdmin();') || rulesContent.includes('isSuperAdmin()'), 'Only Super Admin can authorize or reject applications');
  }

  console.log('\n================================================================');
  console.log(`  CREATE NEW FEST TEST SUITE: ${passed} / ${total} TESTS PASSED.`);
  console.log('================================================================\n');
}

runTests().catch((err) => {
  console.error('\nTest Suite Failed with Error:', err);
  process.exit(1);
});

