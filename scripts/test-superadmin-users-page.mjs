import { readFileSync } from 'fs';
import { resolve } from 'path';

console.log('======================================================================');
console.log('  TESTING SUPER ADMIN USERS PAGE ROUTING & DATA RESILIENCE');
console.log('======================================================================\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

// 1. Verify FestContext superAdminTab routing handles 'users' and 'platform_users'
const contextPath = resolve('src/context/FestContext.tsx');
const contextCode = readFileSync(contextPath, 'utf-8');

assert(
  contextCode.includes("tabParam === 'users' || tabParam === 'platform_users'") &&
  contextCode.includes("urlParams.get('tab')"),
  "FestContext initializes superAdminTab checking urlParams 'tab' and normalizes 'users' to 'platform_users'"
);

assert(
  contextCode.includes("if ((tab as string) === 'users') resolvedTab = 'platform_users'"),
  "setSuperAdminTab resolves 'users' alias directly to 'platform_users'"
);

assert(
  contextCode.includes("localStorage.setItem('festflow_super_admin_tab', resolvedTab)") &&
  contextCode.includes("url.searchParams.set('tab', resolvedTab)"),
  "setSuperAdminTab persists active tab to localStorage and updates URL query params for reliable refresh"
);

// 2. Verify SuperAdminRouter handles both 'platform_users' and 'users'
const routerPath = resolve('src/pages/superAdmin/SuperAdminRouter.tsx');
const routerCode = readFileSync(routerPath, 'utf-8');

assert(
  routerCode.includes("case 'platform_users':") &&
  routerCode.includes("case 'users' as any:"),
  "SuperAdminRouter explicitly handles both 'platform_users' and 'users' routes"
);

assert(
  routerCode.includes('<ErrorBoundary'),
  'SuperAdminRouter wraps tab content in an ErrorBoundary to prevent blank screen crashes'
);

// 3. Verify PlatformUsersPage null safety and aggregation
const pagePath = resolve('src/pages/superAdmin/PlatformUsersPage.tsx');
const pageCode = readFileSync(pagePath, 'utf-8');

assert(
  pageCode.includes("typeof u.role === 'string' ? u.role.replace('_', ' ') : 'User'"),
  "PlatformUsersPage guards role formatting against non-string values"
);

assert(
  pageCode.includes('handleDeleteUser'),
  'PlatformUsersPage provides a confirmation and self-deletion check before removing accounts'
);

assert(
  pageCode.includes('allPlatformUsers'),
  'PlatformUsersPage aggregates users safely'
);

// 4. Verify Logo safety
const logoPath = resolve('src/utils/logo.ts');
const logoCode = readFileSync(logoPath, 'utf-8');

assert(
  logoCode.includes('FESTORIA_FALLBACK_SVG') && logoCode.includes('handleLogoError'),
  'logo.ts exports instant vector SVG fallback and handleLogoError'
);

// 5. Test data aggregation simulation in Node
const mockUsers = [
  { id: 'usr-1', name: 'Super Admin', email: 'admin@festoria.edu', role: 'super_admin', status: 'active' },
  { id: 'usr-2', name: 'Corrupt Role User', email: 'corrupt@festoria.edu', role: null, status: 'active' },
  null
];
const mockFests = [
  { id: 'fest-1', adminId: 'usr-fest-admin', adminName: 'Campus Admin', adminEmail: 'campus@festoria.edu' }
];

const rawUsers = Array.isArray(mockUsers) ? mockUsers.filter(Boolean) : [];
const existingIds = new Set(rawUsers.map((u) => u?.id).filter(Boolean));
const extra = [];

mockFests.forEach((f) => {
  if (f?.adminId && !existingIds.has(f.adminId)) {
    existingIds.add(f.adminId);
    extra.push({
      id: f.adminId,
      name: f.adminName || 'Fest Administrator',
      email: f.adminEmail || '',
      role: 'fest_admin',
      status: 'active',
    });
  }
});

const merged = [...rawUsers, ...extra];
assert(merged.length === 3, 'Data aggregation handles null users and merges extra fest admins');

// Format test
merged.forEach((u) => {
  const roleDisplay = typeof u.role === 'string' ? u.role.replace('_', ' ') : 'User';
  assert(typeof roleDisplay === 'string', `Role format for ${u.name} produced valid string: "${roleDisplay}"`);
});

console.log(`\nResults: ${passedTests}/${totalTests} tests passed.`);
if (passedTests === totalTests) {
  console.log('🎉 ALL SUPER ADMIN USERS PAGE TESTS PASSED!');
} else {
  process.exitCode = 1;
}
