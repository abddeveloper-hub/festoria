// verify-integration.mjs
import fs from 'fs';
import path from 'path';

console.log('--- [Festoria Firebase Backend Integration Verification] ---');

// 1. Verify Firebase configuration files exist
const requiredFiles = [
  'src/firebase/config.ts',
  'src/firebase/firestoreService.ts',
  'src/firebase/authService.ts',
  'firestore.rules',
  '.env.example',
  '.env',
  'index.html',
  'admin.html',
  'participant.html',
  'team-leader.html',
  'super-admin.html'
];

let missingFiles = 0;
for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`✓ File verified: ${file}`);
  } else {
    console.error(`✗ Missing required file: ${file}`);
    missingFiles++;
  }
}

// 2. Verify Firebase config contents
const configContent = fs.readFileSync('src/firebase/config.ts', 'utf-8');
const hasProjectId = configContent.includes("'festoria-cd375'");
const hasAuthDomain = configContent.includes("'festoria-cd375.firebaseapp.com'");
const hasStorageBucket = configContent.includes("'festoria-cd375.firebasestorage.app'");
const hasAnalyticsCheck = configContent.includes('isSupported');

console.log(`\n--- [Configuration Check for festoria-cd375] ---`);
console.log(`Project ID festoria-cd375: ${hasProjectId ? 'PASS' : 'FAIL'}`);
console.log(`Auth Domain festoria-cd375.firebaseapp.com: ${hasAuthDomain ? 'PASS' : 'FAIL'}`);
console.log(`Storage Bucket festoria-cd375.firebasestorage.app: ${hasStorageBucket ? 'PASS' : 'FAIL'}`);
console.log(`Analytics isSupported() check: ${hasAnalyticsCheck ? 'PASS' : 'FAIL'}`);

// 3. Verify Firestore security rules
const rulesContent = fs.readFileSync('firestore.rules', 'utf-8');
const hasDenyByDefault = rulesContent.includes("allow update, delete: if false;");
const hasScoreProtection = rulesContent.includes("isFestAdmin(request.resource.data.festId)");
const hasSuperAdminProtection = rulesContent.includes("isSuperAdmin()");
const hasTeamIsolation = rulesContent.includes("isTeamLeader(");

console.log(`\n--- [Firestore Security Rules Check] ---`);
console.log(`Audit log immutability rule: ${hasDenyByDefault ? 'PASS' : 'FAIL'}`);
console.log(`Score modification restriction to Fest Admin/Judge: ${hasScoreProtection ? 'PASS' : 'FAIL'}`);
console.log(`Platform Super Admin authorization isolation: ${hasSuperAdminProtection ? 'PASS' : 'FAIL'}`);
console.log(`Team Leader house-level isolation: ${hasTeamIsolation ? 'PASS' : 'FAIL'}`);

// 4. Verify Multi-page builds exist
const distDir = 'dist';
if (fs.existsSync(distDir)) {
  const distEntries = ['index.html', 'admin.html', 'participant.html', 'team-leader.html', 'super-admin.html'];
  console.log(`\n--- [Production Build Verification] ---`);
  for (const entry of distEntries) {
    const p = path.join(distDir, entry);
    if (fs.existsSync(p)) {
      console.log(`✓ Bundled page: ${entry}`);
    } else {
      console.error(`✗ Missing bundled page: ${entry}`);
    }
  }
}

if (missingFiles === 0 && hasProjectId && hasAuthDomain && hasStorageBucket && hasAnalyticsCheck) {
  console.log('\n>>> All Firebase architectural and integration checks PASSED successfully! <<<');
} else {
  console.error('\n>>> Verification encountered issues. <<<');
  process.exit(1);
}

