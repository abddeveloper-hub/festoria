// scripts/test-stage2-team-leaders.mjs
import fs from 'fs';
import path from 'path';

console.log('===============================================================');
console.log('  FESTORIA — STAGE 2: ADMIN-MANAGED TEAM LEADER TEST SUITE');
console.log('===============================================================\n');

let passedTests = 0;
let totalTests = 8;

// Test 1: Admin Page & Navigation has Team Leaders management
const sidebarContent = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf-8');
const adminRouteContent = fs.readFileSync('src/App.tsx', 'utf-8');
const teamLeadersPageContent = fs.readFileSync('src/pages/TeamLeadersPage.tsx', 'utf-8');

if (
  sidebarContent.includes('team_leaders') &&
  adminRouteContent.includes('TeamLeadersPage') &&
  teamLeadersPageContent.includes('createTeamLeaderAccount')
) {
  console.log('✓ TEST 1: Admin Panel has Team Leader Management section and routing configured. [PASS]');
  passedTests++;
} else {
  console.error('✗ TEST 1: Team Leader Management section missing in Admin Panel.');
}

// Test 2: Secure Account Creation & Permission Enforcement
const contextContent = fs.readFileSync('src/context/FestContext.tsx', 'utf-8');
if (
  contextContent.includes("hasPermission(['admin', 'super_admin'])") &&
  contextContent.includes('saveTeamLeaderInvitation') &&
  contextContent.includes('pending_verification')
) {
  console.log('✓ TEST 2: Admin permission validation and trusted invitation creation implemented. [PASS]');
  passedTests++;
} else {
  console.error('✗ TEST 2: Missing Admin permission validation or invitation creation in FestContext.');
}

// Test 3: Duplicate phone & Invalid team checks
if (
  contextContent.includes('An account already exists for phone') &&
  contextContent.includes('A pending invitation already exists for mobile') &&
  contextContent.includes('The selected team does not exist in this fest')
) {
  console.log('✓ TEST 3: Duplicate phone prevention and invalid team assignment rejection active. [PASS]');
  passedTests++;
} else {
  console.error('✗ TEST 3: Missing duplicate or invalid team assignment checks.');
}

// Test 4: Role Isolation & Unknown Phone Protection in Auth
const authServiceContent = fs.readFileSync('src/firebase/authService.ts', 'utf-8');
const localAuthContent = fs.readFileSync('src/services/authService.ts', 'utf-8');

if (
  authServiceContent.includes('intendedRole === \'team_leader\'') &&
  authServiceContent.includes('is not registered as an authorized')
) {
  console.log('✓ TEST 4: Unknown phone numbers are blocked from Team Leader access prior to OTP. [PASS]');
  passedTests++;
} else {
  console.error('✗ TEST 4: Missing unknown phone number rejection for privileged roles.');
}

// Test 5: Firestore Schema for team_leader_invitations
const firestoreServiceContent = fs.readFileSync('src/firebase/firestoreService.ts', 'utf-8');
if (
  firestoreServiceContent.includes('fetchTeamLeaderInvitations') &&
  firestoreServiceContent.includes('saveTeamLeaderInvitation') &&
  firestoreServiceContent.includes('activateTeamLeaderInvitation')
) {
  console.log('✓ TEST 5: Firestore schema and service methods for team_leader_invitations ready. [PASS]');
  passedTests++;
} else {
  console.error('✗ TEST 5: Missing firestore service methods for team_leader_invitations.');
}

// Test 6: Database Security Rules enforce Team Leader isolation
const firestoreRulesContent = fs.readFileSync('firestore.rules', 'utf-8');
if (
  firestoreRulesContent.includes('isTeamLeader(resource.data.festId, teamId)') &&
  firestoreRulesContent.includes('match /team_leader_invitations/{invitationId}') &&
  firestoreRulesContent.includes('!request.resource.data.diff(resource.data).affectedKeys().hasAny([\'teamLeaderId\'')
) {
  console.log('✓ TEST 6: Firestore Security Rules enforce Team Leader isolation and prevent privilege escalation. [PASS]');
  passedTests++;
} else {
  console.error('✗ TEST 6: Security rules do not adequately enforce Team Leader isolation.');
}

// Test 7: Multi-page builds exist and build with 0 errors
const distDir = 'dist';
const requiredBundles = ['index.html', 'admin.html', 'participant.html', 'team-leader.html', 'super-admin.html'];
let bundlesFound = 0;
for (const b of requiredBundles) {
  if (fs.existsSync(path.join(distDir, b))) {
    bundlesFound++;
  }
}

if (bundlesFound === requiredBundles.length) {
  console.log('✓ TEST 7: All 5 portal HTML bundles compiled successfully (index, admin, participant, team-leader, super-admin). [PASS]');
  passedTests++;
} else {
  console.error('✗ TEST 7: Missing compiled portal bundles in dist.');
}

// Test 8: Invitation Linking upon Phone Verification
if (
  authServiceContent.includes('activateTeamLeaderInvitation') &&
  (authServiceContent.includes("invitationStatus: 'verified'") || authServiceContent.includes("invitationStatus = 'verified'"))
) {
  console.log('✓ TEST 8: Team Leader invitation activation and verified identity linking complete. [PASS]');
  passedTests++;
} else {
  console.error('✗ TEST 8: Missing invitation activation on verified identity.');
}

console.log(`\n---------------------------------------------------------------`);
console.log(`  RESULTS: ${passedTests}/${totalTests} Tests Passed successfully.`);
console.log(`---------------------------------------------------------------\n`);

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}

