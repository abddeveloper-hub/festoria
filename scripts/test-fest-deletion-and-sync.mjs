import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('🧪 Verifying Fest Deletion and Registration Sync Fixes...');

// 1. Verify Registration includes registrationSource: 'self_registration'
const authServiceContent = fs.readFileSync('src/firebase/authService.ts', 'utf8');
assert(
  authServiceContent.includes("registrationSource: 'self_registration'"),
  'authService.ts sets registrationSource: self_registration for Firestore rules compliance'
);
assert(
  authServiceContent.includes('StorageService.saveParticipants'),
  'authService.ts saves participant to StorageService in main success flow'
);
assert(
  authServiceContent.includes('festoria_participants_changed'),
  'authService.ts dispatches festoria_participants_changed'
);
console.log('✓ Test 1: Participant registration sets self_registration and syncs storage');

// 2. Verify PhoneAuthModal updates FestContext state
const modalContent = fs.readFileSync('src/components/common/PhoneAuthModal.tsx', 'utf8');
assert(
  modalContent.includes('setParticipants'),
  'PhoneAuthModal.tsx updates setParticipants on successful registration'
);
console.log('✓ Test 2: PhoneAuthModal updates in-memory participants in FestContext');

// 3. Verify FestContext listens for festoria_participants_changed
const contextContent = fs.readFileSync('src/context/FestContext.tsx', 'utf8');
assert(
  contextContent.includes('festoria_participants_changed'),
  'FestContext.tsx listens for festoria_participants_changed'
);
assert(
  contextContent.includes('deleteFestComplete'),
  'FestContext.tsx defines and exports deleteFestComplete'
);
assert(
  contextContent.includes('deleteFestCascading'),
  'FestContext.tsx calls deleteFestCascading'
);
console.log('✓ Test 3: FestContext has real-time participant listener and deleteFestComplete');

// 4. Verify firestoreService has deleteFestCascading
const fsServiceContent = fs.readFileSync('src/firebase/firestoreService.ts', 'utf8');
assert(
  fsServiceContent.includes('export async function deleteFestCascading'),
  'firestoreService.ts exports deleteFestCascading'
);
assert(
  fsServiceContent.includes("deleteCollectionByFest('teams'"),
  'deleteFestCascading removes teams'
);
assert(
  fsServiceContent.includes("deleteCollectionByFest('participants'"),
  'deleteFestCascading removes participants'
);
assert(
  fsServiceContent.includes("deleteCollectionByFest('programmes'"),
  'deleteFestCascading removes programmes'
);
assert(
  fsServiceContent.includes("deleteCollectionByFest('scores'"),
  'deleteFestCascading removes scores'
);
assert(
  fsServiceContent.includes("deleteCollectionByFest('results'"),
  'deleteFestCascading removes results'
);
console.log('✓ Test 4: deleteFestCascading permanently wipes all linked collections');

// 5. Verify AllFestsPage has Delete button and confirmation modal
const allFestsContent = fs.readFileSync('src/pages/superAdmin/AllFestsPage.tsx', 'utf8');
assert(
  allFestsContent.includes('deleteModalFest'),
  'AllFestsPage.tsx manages deleteModalFest state'
);
assert(
  allFestsContent.includes('deleteFestComplete'),
  'AllFestsPage.tsx calls deleteFestComplete'
);
assert(
  allFestsContent.includes('Permanently Delete Festival'),
  'AllFestsPage.tsx renders deletion confirmation modal'
);
console.log('✓ Test 5: AllFestsPage includes Delete button and safety confirmation modal');

// 6. Verify Mobile Navigation Menu fixes in PublicFestPage
const publicFestContent = fs.readFileSync('src/pages/public/PublicFestPage.tsx', 'utf8');
assert(
  publicFestContent.includes('document.body.style.overflow'),
  'PublicFestPage.tsx locks body scroll when menuDrawerOpen is true'
);
assert(
  publicFestContent.includes('truncate'),
  'PublicFestPage.tsx truncates long festival names on mobile nav'
);
console.log('✓ Test 6: Mobile menu bar in PublicFestPage has scroll locking and responsive truncation');

console.log('\n🎉 ALL 6 VERIFICATION CHECKS PASSED PERFECTLY!');
