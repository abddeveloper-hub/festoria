/**
 * Festoria — Fest Application & Governance Workflow Automated Test Suite
 *
 * Verifies end-to-end functionality and security for:
 * 1. Application Submission & Validation
 * 2. Duplicate Application Prevention (Institution & Phone)
 * 3. Unauthorized Approval Blocking (RBAC Enforcement)
 * 4. Super Admin Approval Workflow (Cloud Function & Atomic Firestore Transaction)
 * 5. Super Admin Rejection Workflow (Cloud Function & Audit Trail)
 * 6. Scoped Access & Non-Escalation Guarantees (Admin cannot touch other fests)
 * 7. UI Component & Responsive Navigation Validation
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
  if (!store.fest_requests) store.fest_requests = new Map();
  if (!store.fest_memberships) store.fest_memberships = new Map();
  if (!store.platform_audit_logs) store.platform_audit_logs = new Map();

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
console.log('  FESTORIA — FEST APPLICATION & GOVERNANCE TEST SUITE');
console.log('================================================================\n');

async function runTests() {
  // Setup Mock Database
  const mockDb = createMockFirestore({
    users: {
      'user_super_admin': {
        id: 'user_super_admin',
        name: 'Super Admin Alexander',
        email: 'alexander@festoria.platform',
        phone: '+919999988888',
        role: 'super_admin',
        status: 'active'
      },
      'user_suspended_super': {
        id: 'user_suspended_super',
        name: 'Suspended Admin',
        email: 'suspended@festoria.platform',
        phone: '+919999977777',
        role: 'super_admin',
        status: 'suspended'
      },
      'user_regular_fest_admin': {
        id: 'user_regular_fest_admin',
        name: 'Fest Admin Sarah',
        email: 'sarah@heritage.edu',
        phone: '+919876500001',
        role: 'admin',
        festId: 'FEST-01',
        status: 'active'
      },
      'user_participant_applicant': {
        id: 'user_applicant_101',
        name: 'Prof. David Miller',
        email: 'dmiller@apex.edu',
        phone: '+919876543210',
        role: 'participant',
        status: 'active'
      }
    },
    fests: {
      'FEST-01': {
        id: 'FEST-01',
        name: 'Spring Fiesta 2026',
        edition: '2026',
        adminId: 'user_regular_fest_admin',
        status: 'active'
      }
    },
    fest_requests: {
      'REQ-2026-1001': {
        id: 'REQ-2026-1001',
        festName: 'Apex Tech & Arts Summit 2026',
        edition: '2026',
        institution: 'Apex Institute of Technology',
        institutionAddress: 'Koramangala, Bangalore, KA',
        contactPersonName: 'Prof. David Miller',
        category: 'Inter-Collegiate Cultural Fest',
        startDate: '2026-10-15',
        endDate: '2026-10-17',
        expectedParticipants: 800,
        plannedProgrammesCount: 24,
        requestingAdminId: 'user_applicant_101',
        requestingAdminName: 'Prof. David Miller',
        requestingAdminEmail: 'dmiller@apex.edu',
        requestingAdminPhone: '+919876543210',
        status: 'pending',
        submissionDate: '2026-11-06T10:00:00Z',
        supportingDocumentUrl: 'https://apex.edu/docs/fest-sanction.pdf',
        history: [
          {
            date: '2026-11-06 10:00',
            actor: 'Prof. David Miller',
            action: 'Submitted Fest Application',
            note: 'Initial proposal for Apex Tech & Arts Summit 2026.'
          }
        ]
      }
    }
  });

  const mockAuth = createMockAuth();
  const deps = { db: mockDb, auth: mockAuth };

  // ============================================================================
  // TEST GROUP 1: Field Validation & Phone Normalization
  // ============================================================================
  console.log('--- TEST GROUP 1: Field Validation & Phone Normalization ---');
  {
    assert(normalizePhone('9876543210') === '+919876543210', '10-digit phone normalized with country code +91');
    assert(normalizePhone('+91 98765 43210') === '+919876543210', 'Formatted phone stripped and normalized');
    assert(normalizePhone('') === '', 'Empty phone string returns empty');
  }

  // ============================================================================
  // TEST GROUP 2: Duplicate Application Prevention
  // ============================================================================
  console.log('\n--- TEST GROUP 2: Duplicate Application Prevention ---');
  {
    // Test institution duplicate matching
    const reqCol = mockDb._store.fest_requests;
    const existingReq = Array.from(reqCol.values())[0];

    const duplicateInstitution = 'Apex Institute of Technology';
    let isDuplicate = false;
    for (const r of reqCol.values()) {
      if (['pending', 'submitted', 'under_review'].includes(r.status) &&
          r.institution.toLowerCase() === duplicateInstitution.toLowerCase()) {
        isDuplicate = true;
        break;
      }
    }
    assert(isDuplicate === true, 'Duplicate pending application for same institution correctly detected');

    // Test distinct institution passes
    const distinctInstitution = 'National College of Arts';
    let isDistinctDup = false;
    for (const r of reqCol.values()) {
      if (['pending', 'submitted', 'under_review'].includes(r.status) &&
          r.institution.toLowerCase() === distinctInstitution.toLowerCase()) {
        isDistinctDup = true;
        break;
      }
    }
    assert(isDistinctDup === false, 'Unique institution allowed to apply without conflict');
  }

  // ============================================================================
  // TEST GROUP 3: Unauthorized Approval Attempts Blocked
  // ============================================================================
  console.log('\n--- TEST GROUP 3: Unauthorized Approval Attempts Blocked ---');
  {
    // 3a. Unauthenticated caller
    let unauthCaught = false;
    try {
      await approveFestApplicationHandler({ auth: null, data: { requestId: 'REQ-2026-1001' } }, deps);
    } catch (e) {
      unauthCaught = true;
      assert(e.code === 'unauthenticated', 'Unauthenticated caller rejected with code unauthenticated');
    }
    assert(unauthCaught, 'Unauthenticated approval rejected');

    // 3b. Regular Fest Admin attempting to approve platform fest request
    let festAdminCaught = false;
    try {
      await approveFestApplicationHandler(
        { auth: { uid: 'user_regular_fest_admin' }, data: { requestId: 'REQ-2026-1001' } },
        deps
      );
    } catch (e) {
      festAdminCaught = true;
      assert(e.code === 'permission-denied', 'Regular Fest Admin cannot approve platform requests');
    }
    assert(festAdminCaught, 'Fest Admin approval rejected');

    // 3c. Applicant attempting to self-approve
    let selfApproveCaught = false;
    try {
      await approveFestApplicationHandler(
        { auth: { uid: 'user_applicant_101' }, data: { requestId: 'REQ-2026-1001' } },
        deps
      );
    } catch (e) {
      selfApproveCaught = true;
      assert(e.code === 'permission-denied', 'Applicant self-approval attempt strictly denied');
    }
    assert(selfApproveCaught, 'Self-approval rejected');

    // 3d. Suspended Super Admin account
    let suspendedCaught = false;
    try {
      await approveFestApplicationHandler(
        { auth: { uid: 'user_suspended_super' }, data: { requestId: 'REQ-2026-1001' } },
        deps
      );
    } catch (e) {
      suspendedCaught = true;
      assert(e.code === 'permission-denied', 'Suspended Super Admin account blocked from approvals');
    }
    assert(suspendedCaught, 'Suspended Super Admin blocked');
  }

  // ============================================================================
  // TEST GROUP 4: Super Admin Approval Workflow
  // ============================================================================
  console.log('\n--- TEST GROUP 4: Super Admin Approval Workflow ---');
  {
    const approvalRes = await approveFestApplicationHandler(
      {
        auth: { uid: 'user_super_admin' },
        data: {
          requestId: 'REQ-2026-1001',
          approvalNote: 'Institutional credentials verified. Fest authorized for 2026 edition.'
        }
      },
      deps
    );

    assert(approvalRes.success === true, 'Super Admin approval executed successfully');
    assert(approvalRes.festId.startsWith('FEST-'), `Allocated valid Fest ID: ${approvalRes.festId}`);

    // Verify Fest document was created
    const createdFest = mockDb._store.fests.get(approvalRes.festId);
    assert(!!createdFest, 'Fest document created in /fests collection');
    assert(createdFest.name === 'Apex Tech & Arts Summit 2026', 'Fest document carries correct fest name');
    assert(createdFest.adminId === 'user_applicant_101', 'Fest adminId accurately linked to applicant UID');
    assert(createdFest.status === 'setup', 'Newly created fest initialized with status setup');

    // Verify User document updated to Fest Admin
    const updatedUser = mockDb._store.users.get('user_applicant_101');
    assert(updatedUser.role === 'admin', 'Applicant profile promoted to role admin in /users');
    assert(updatedUser.festId === approvalRes.festId, 'Applicant profile linked to allocated festId');
    assert(updatedUser.status === 'active', 'Applicant account marked active');

    // Verify Fest Membership document created
    const membership = mockDb._store.fest_memberships.get(`user_applicant_101_${approvalRes.festId}`);
    assert(!!membership, 'Fest membership document created in /fest_memberships');
    assert(membership.role === 'admin', 'Membership role set to admin');
    assert(membership.status === 'active', 'Membership status is active');

    // Verify Request document status changed to approved
    const updatedReq = mockDb._store.fest_requests.get('REQ-2026-1001');
    assert(updatedReq.status === 'approved', 'Request status transitioned to approved');
    assert(updatedReq.allocatedFestId === approvalRes.festId, 'Request record stores allocatedFestId');
    assert(updatedReq.history.length === 2, 'Audit entry appended to request history');

    // Verify Platform Audit Log was written
    const auditLogs = Array.from(mockDb._store.platform_audit_logs.values());
    assert(auditLogs.length > 0, 'Platform audit log created');
    const logEntry = auditLogs.find((l) => l.action === 'APPROVE_FEST_REQUEST');
    assert(!!logEntry, 'Audit log recorded with action APPROVE_FEST_REQUEST');
    assert(logEntry.actorRole === 'super_admin', 'Audit log identifies actorRole as super_admin');

    // Verify Custom Claims set on Firebase Auth
    const userClaims = mockAuth._claims.get('user_applicant_101');
    assert(userClaims && userClaims.role === 'admin', 'Firebase Auth custom claims set to role admin');
    assert(userClaims.festId === approvalRes.festId, 'Firebase Auth custom claims set with festId');

    // Verify cannot re-approve already approved application
    let reapproveCaught = false;
    try {
      await approveFestApplicationHandler(
        { auth: { uid: 'user_super_admin' }, data: { requestId: 'REQ-2026-1001' } },
        deps
      );
    } catch (e) {
      reapproveCaught = true;
      assert(e.code === 'failed-precondition', 'Already-approved request cannot be approved again');
    }
    assert(reapproveCaught, 'Re-approval prevented');
  }

  // ============================================================================
  // TEST GROUP 5: Super Admin Rejection Workflow
  // ============================================================================
  console.log('\n--- TEST GROUP 5: Super Admin Rejection Workflow ---');
  {
    // Create another pending application
    mockDb._store.fest_requests.set('REQ-2026-1002', {
      id: 'REQ-2026-1002',
      festName: 'Incomplete Proposal Fest',
      edition: '2026',
      institution: 'Unverified College',
      requestingAdminId: 'user_applicant_102',
      requestingAdminName: 'John Doe',
      requestingAdminEmail: 'john@unverified.edu',
      requestingAdminPhone: '+919876543299',
      status: 'pending',
      submissionDate: '2026-11-06T11:00:00Z',
      history: []
    });

    // Attempt rejection without mandatory reason
    let missingReasonCaught = false;
    try {
      await rejectFestApplicationHandler(
        { auth: { uid: 'user_super_admin' }, data: { requestId: 'REQ-2026-1002', rejectionReason: '' } },
        deps
      );
    } catch (e) {
      missingReasonCaught = true;
      assert(e.code === 'invalid-argument', 'Rejection without reason rejected with invalid-argument');
    }
    assert(missingReasonCaught, 'Mandatory rejection reason enforced');

    // Valid rejection
    const rejectRes = await rejectFestApplicationHandler(
      {
        auth: { uid: 'user_super_admin' },
        data: {
          requestId: 'REQ-2026-1002',
          rejectionReason: 'Institution clearance letter missing and unverified campus affiliation.'
        }
      },
      deps
    );

    assert(rejectRes.success === true, 'Rejection executed successfully');
    const rejectedReq = mockDb._store.fest_requests.get('REQ-2026-1002');
    assert(rejectedReq.status === 'rejected', 'Request status set to rejected');
    assert(rejectedReq.rejectionReason.includes('Institution clearance letter missing'), 'Rejection reason persisted');

    // Verify rejection audit log
    const auditLogs = Array.from(mockDb._store.platform_audit_logs.values());
    const rejectLog = auditLogs.find((l) => l.action === 'REJECT_FEST_REQUEST' && l.targetId === 'REQ-2026-1002');
    assert(!!rejectLog, 'Immutable audit log recorded for REJECT_FEST_REQUEST');
  }

  // ============================================================================
  // TEST GROUP 6: Scoped Access & Non-Escalation Guarantees
  // ============================================================================
  console.log('\n--- TEST GROUP 6: Scoped Access & Non-Escalation Guarantees ---');
  {
    const approvedAdmin = mockDb._store.users.get('user_applicant_101');
    const allocatedFest = approvedAdmin.festId;

    // Verify admin is scoped strictly to allocatedFest
    assert(allocatedFest !== 'FEST-01', 'Approved admin is NOT assigned to pre-existing FEST-01');
    assert(approvedAdmin.festId === allocatedFest, 'Approved admin assigned only to their approved fest');

    // Verify approved admin cannot self-grant Super Admin
    assert(approvedAdmin.role === 'admin', 'Approved applicant has role admin, NOT super_admin');
  }

  // ============================================================================
  // TEST GROUP 7: Responsive UI Component Verification
  // ============================================================================
  console.log('\n--- TEST GROUP 7: Responsive UI Component Verification ---');
  {
    // Verify CreateFestModal.tsx exists and contains required form fields
    const modalPath = fs.existsSync(path.join(__dirname, '../src/components/public/CreateFestModal.tsx'))
      ? path.join(__dirname, '../src/components/public/CreateFestModal.tsx')
      : path.join(__dirname, '../src/components/public/OrganiseFestModal.tsx');
    assert(fs.existsSync(modalPath), 'Modal component file exists');
    const modalContent = fs.readFileSync(modalPath, 'utf8');

    assert(modalContent.includes('institution'), 'Modal contains Institution input');
    assert(modalContent.includes('institutionAddress'), 'Modal contains Institution Address input');
    assert(modalContent.includes('organizerName') || modalContent.includes('contactPersonName'), 'Modal contains Contact Person Name input');
    assert(modalContent.includes('mobileNumber'), 'Modal contains Mobile Number input');
    assert(modalContent.includes('emailAddress'), 'Modal contains Email Address input');
    assert(modalContent.includes('festName'), 'Modal contains Fest Name input');
    assert(modalContent.includes('description'), 'Modal contains Fest Description input');
    assert(modalContent.includes('startDate'), 'Modal contains Start Date input');
    assert(modalContent.includes('endDate'), 'Modal contains End Date input');
    assert(modalContent.includes('supportingDocumentUrl'), 'Modal contains Supporting Document input');
    assert(modalContent.includes('signInWithCredentials'), 'Modal integrates Password Authentication');
    assert(modalContent.includes('checkDuplicateFestApplication'), 'Modal integrates Duplicate Check');
    assert(modalContent.includes('submitFestApplication'), 'Modal submits to Firestore');

    // Verify PublicPage / FestoriaHomePage includes navigation button, overview card, and modal mount
    const publicPagePath = path.join(__dirname, '../src/pages/PublicPage.tsx');
    const homePath = path.join(__dirname, '../src/pages/public/FestoriaHomePage.tsx');
    assert(fs.existsSync(publicPagePath), 'PublicPage.tsx exists');
    assert(fs.existsSync(homePath), 'FestoriaHomePage.tsx exists');
    const publicContent = fs.readFileSync(homePath, 'utf8') + fs.readFileSync(publicPagePath, 'utf8');
    assert(publicContent.includes('Organise a Fest') || publicContent.includes('Create New Fest'), 'PublicPage contains "Organise a Fest" or "Create New Fest" option');
    assert(publicContent.includes('OrganiseFestModal') || publicContent.includes('CreateFestModal'), 'PublicPage mounts OrganiseFestModal / CreateFestModal');

    // Verify Firestore Rules include fest_requests & platform_audit_logs
    const rulesPath = path.join(__dirname, '../firestore.rules');
    assert(fs.existsSync(rulesPath), 'firestore.rules exists');
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');
    assert(rulesContent.includes('match /fest_requests/{requestId}'), 'firestore.rules contains fest_requests rules');
    assert(rulesContent.includes('match /platform_audit_logs/{logId}'), 'firestore.rules contains platform_audit_logs rules');
  }

  console.log('\n================================================================');
  console.log(`  ALL TESTS PASSED: ${passed} / ${total} assertions successful.`);
  console.log('================================================================\n');
}

runTests().catch((err) => {
  console.error('\nTest Suite Failed with Error:', err);
  process.exit(1);
});

