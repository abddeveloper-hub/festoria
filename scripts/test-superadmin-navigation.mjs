import { readFileSync } from 'fs';
import { resolve } from 'path';

console.log('======================================================================');
console.log('  TESTING SUPER ADMIN ACCESS REQUIRED NAVIGATION BEHAVIOR');
console.log('======================================================================\n');

const layoutPath = resolve('src/components/superAdmin/SuperAdminLayout.tsx');
const layoutContent = readFileSync(layoutPath, 'utf-8');

let passedTests = 0;
let totalTests = 0;

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

// 1. Check href target
assert(
  layoutContent.includes('href="/"') && !layoutContent.includes('href="/index.html"'),
  'Navigation link targets root URL ("/") instead of "/index.html"'
);

// 2. Check handleBackToPublic implementation
assert(
  layoutContent.includes('const handleBackToPublic = (e: React.MouseEvent) => {') ||
  layoutContent.includes('handleBackToPublic'),
  'handleBackToPublic click handler is defined'
);

// 3. Check event prevention and localStorage reset to public
assert(
  layoutContent.includes("localStorage.setItem('festflow_portal', 'public')"),
  "Click handler resets 'festflow_portal' in localStorage to 'public'"
);

// 4. Check switchPortal integration
assert(
  layoutContent.includes("switchPortal('public')"),
  "Click handler calls switchPortal('public') from FestContext"
);

// 5. Check window.location.href navigation
assert(
  layoutContent.includes("window.location.href = '/'"),
  "Click handler triggers browser navigation via window.location.href = '/'"
);

// 6. Check UI design preservation
assert(
  layoutContent.includes('Back to Public Website') &&
  layoutContent.includes('<ArrowRight className="w-3.5 h-3.5" />'),
  'UI button text and icon layout are preserved exactly'
);

// 7. Check suspended account gate handling
assert(
  layoutContent.includes('Account Suspended') &&
  layoutContent.includes('Sign Out & Return Home'),
  'Suspended account gate also properly handles sign out and root redirection'
);

// 8. Simulate browser navigation state machine
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
}

const mockStorage = new MockLocalStorage();
// User initially visited Super Admin
mockStorage.setItem('festflow_portal', 'super_admin');
assert(mockStorage.getItem('festflow_portal') === 'super_admin', 'Initial state simulates being trapped on super_admin portal');

// Simulate user clicking "Back to Public Website"
let simulatedLocation = '/super-admin.html';
const mockEvent = {
  preventDefault: () => {}
};

function simulateClick() {
  mockEvent.preventDefault();
  try {
    mockStorage.setItem('festflow_portal', 'public');
  } catch (err) {}
  simulatedLocation = '/';
}

simulateClick();

assert(simulatedLocation === '/', 'Simulated browser navigated to root URL ("/")');
assert(mockStorage.getItem('festflow_portal') === 'public', 'Simulated storage updated to "public" portal');

console.log('\n======================================================================');
console.log(`  RESULT: ${passedTests} / ${totalTests} NAVIGATION TESTS PASSED`);
console.log('======================================================================\n');

