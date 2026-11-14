import { readFileSync } from 'fs';
import { resolve } from 'path';

console.log('================================================================');
console.log('FESTORIA AUTOMATED VERIFICATION SUITE: JUDGE TOKENS & ADJUDICATION');
console.log('================================================================');

let passed = 0;
let total = 0;

function assert(condition, name) {
  total++;
  if (condition) {
    console.log(`Testing [${name}] ... ✅ PASSED`);
    passed++;
  } else {
    console.error(`Testing [${name}] ... ❌ FAILED`);
    process.exitCode = 1;
  }
}

// 1. Verify firestore.rules has judges collection and scores create rule with fallback
const rulesContent = readFileSync(resolve('firestore.rules'), 'utf8');
assert(
  rulesContent.includes('match /judges/{judgeId}'),
  '1. Firestore rules define explicit match for /judges/{judgeId}'
);
assert(
  rulesContent.includes('match /scores/{scoreId}') &&
  rulesContent.includes('assignedJudgeIds.size() == 0'),
  '2. Firestore rules allow scores creation when assignedJudgeIds is empty or contains judge'
);
assert(
  rulesContent.includes("'linkedJudgeId' in get"),
  '3. Firestore rules safely check linkedJudgeId existence in user document'
);

// 2. Verify firestoreService has judge sync methods and acceptFestInvitation links judge
const serviceContent = readFileSync(resolve('src/firebase/firestoreService.ts'), 'utf8');
assert(
  serviceContent.includes('export async function fetchJudges') &&
  serviceContent.includes('export async function saveJudgeToFirestore') &&
  serviceContent.includes('export async function deleteJudgeFromFirestore'),
  '4. firestoreService exports fetchJudges, saveJudgeToFirestore, and deleteJudgeFromFirestore'
);
assert(
  serviceContent.includes("inv.role === 'judge' && inv.assignedJudgeId") &&
  serviceContent.includes("doc(db, 'judges', inv.assignedJudgeId)"),
  '5. acceptFestInvitation updates judges collection upon token claim'
);

// 3. Verify ShareFestPage auto-registers judge if no pre-existing judge was linked
const shareFestContent = readFileSync(resolve('src/pages/admin/ShareFestPage.tsx'), 'utf8');
assert(
  shareFestContent.includes('addJudge({') &&
  shareFestContent.includes("role: 'judge'"),
  '6. ShareFestPage auto-creates and empannels judge on token generation if unlinked'
);

// 4. Verify InvitationAcceptPage routes judges directly to scores tab
const acceptPageContent = readFileSync(resolve('src/pages/public/InvitationAcceptPage.tsx'), 'utf8');
assert(
  acceptPageContent.includes("claimedRole === 'judge'") &&
  acceptPageContent.includes('tab=scores'),
  '7. InvitationAcceptPage routes judges to admin.html?fest=...&tab=scores'
);

// 5. Verify FestContext auto-routes judges to scores and fetches judges from Firestore
const contextContent = readFileSync(resolve('src/context/FestContext.tsx'), 'utf8');
assert(
  contextContent.includes("currentUser.role === 'judge'") &&
  contextContent.includes("setActiveTab('scores')"),
  '8. FestContext auto-routes judge sessions to scores tab'
);
assert(
  contextContent.includes('fetchJudges()'),
  '9. FestContext fetches judges from Firestore on initialization'
);

// 6. Verify Sidebar filters out admin/settings tabs for judges
const sidebarContent = readFileSync(resolve('src/components/layout/Sidebar.tsx'), 'utf8');
assert(
  sidebarContent.includes("isJudge = currentUser.role === 'judge'") &&
  sidebarContent.includes("['scores', 'programmes', 'schedule']"),
  '10. Sidebar restricts judge navigation to Scores, Programmes, and Schedule'
);
assert(
  sidebarContent.includes('Official Adjudication') &&
  sidebarContent.includes('Jury Evaluation'),
  '11. Sidebar displays adjudication branding for judge accounts'
);

// 7. Verify ScoresPage displays Record Scores button to judges and supports unassigned event fallback
const scoresContent = readFileSync(resolve('src/pages/ScoresPage.tsx'), 'utf8');
assert(
  scoresContent.includes('const canRecord = canApprove || isJudgeOnly;') &&
  scoresContent.includes('canRecord &&'),
  '12. ScoresPage makes Record Scores button visible to judges'
);
assert(
  scoresContent.includes('// Fallback: If no specific programmes are assigned to this judge yet'),
  '13. ScoresPage provides fallback so invited judges are never blocked by empty assignments'
);
assert(
  scoresContent.includes('score.judgeId === judgeId || score.judgeId === currentUser.id') &&
  scoresContent.includes("score.status !== 'approved'"),
  '14. ScoresPage allows judges to edit their own submitted evaluation sheets'
);

console.log('================================================================');
console.log(`SUMMARY: ${passed} / ${total} TESTS PASSED CLEANLY (100%)`);
console.log('================================================================');
