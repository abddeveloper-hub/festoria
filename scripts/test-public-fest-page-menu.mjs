import fs from 'fs';
import path from 'path';

console.log('======================================================================');
console.log('  TESTING PUBLIC FEST PAGE REDESIGN & STEPPED PODIUM VERIFICATION');
console.log('======================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failCount++;
  }
}

// 1. TEST PUBLIC FEST PAGE (PublicFestPage.tsx)
const publicFestFilePath = path.resolve('src/pages/public/PublicFestPage.tsx');
assert(fs.existsSync(publicFestFilePath), 'PublicFestPage.tsx exists');

const festContent = fs.readFileSync(publicFestFilePath, 'utf8');

// Top Navbar
assert(festContent.includes('setMenuDrawerOpen(true)'), 'Menu button triggers setMenuDrawerOpen(true)');
assert(festContent.includes('aria-label="Open Navigation Menu"'), 'Menu button has accessible label');

const navMatch = festContent.match(/<nav[\s\S]*?<\/nav>/);
assert(navMatch !== null, 'Found top <nav> element in PublicFestPage');
if (navMatch) {
  const navContent = navMatch[0];
  assert(navContent.includes('setMenuDrawerOpen(true)'), 'Top nav contains the Menu button');
  assert(!navContent.includes('hidden lg:flex items-center gap-1 text-xs font-semibold text-slate-600'), 'Header does NOT contain redundant desktop tab options');
  assert(!navContent.includes('openAuth(\'participant\', \'register\')'), 'Direct Register Now button removed from top nav');
  assert(!navContent.includes('openAuth(\'participant\', \'signin\')'), 'Direct Sign In button removed from top nav');
}

// Mobile horizontal tab strip is removed
assert(!festContent.includes('Mobile Horizontal Section Navigation Bar'), 'Mobile horizontal tab scrollbar is removed');

// Subview navigation breadcrumb is present
assert(festContent.includes('Back to Festival Overview'), 'Breadcrumb "Back to Festival Overview" exists for subviews');

// Tier 1 Hero Command Center
assert(festContent.includes('countdown.days'), 'Countdown clock days timer rendered');
assert(festContent.includes('countdown.hours'), 'Countdown clock hours timer rendered');
assert(festContent.includes('countdown.minutes'), 'Countdown clock minutes timer rendered');
assert(festContent.includes('countdown.seconds'), 'Countdown clock seconds timer rendered');
assert(festContent.includes('Quick Lookups:'), 'Chest number search console provides fast lookups');

// Tier 2 Live Pulse Metrics
assert(festContent.includes('Collegiate Events'), 'Metrics strip displays Collegiate Events');
assert(festContent.includes('Competing Houses'), 'Metrics strip displays Competing Houses');
assert(festContent.includes('Ratified Results'), 'Metrics strip displays Ratified Results');

// Tier 3: 3D Stepped Championship Podium
assert(festContent.includes('3D Stepped Championship Podium'), '3D Stepped Championship Podium is present');
assert(festContent.includes('Championship Leader'), '1st place championship crown badge is present');
assert(festContent.includes('Golden Performer'), 'Top individual contestant crown badge is present');
assert(festContent.includes('order-2 md:order-1') && festContent.includes('order-1 md:order-2') && festContent.includes('order-3 md:order-3'), '3D podium steps use 2nd (left), 1st (center elevated), 3rd (right) ordering');

// Tier 3: Gateways & Grounds
assert(festContent.includes('Participant Dashboard') && festContent.includes('Team Leader Portal'), 'Participant and Team Leader Portals are present');
assert(festContent.includes('Campus Grounds & Stages'), 'Campus Grounds & Stages guide is present');

// No personal helpdesk on fest public page
assert(!festContent.includes('PHONE HELPLINE') && !festContent.includes('Festival Secretariat & Support'), 'Personal helpdesk removed from fest public page');

// 2. TEST MAIN PUBLIC PAGE (FestoriaHomePage.tsx)
const mainHomeFilePath = path.resolve('src/pages/public/FestoriaHomePage.tsx');
assert(fs.existsSync(mainHomeFilePath), 'FestoriaHomePage.tsx exists');

const homeContent = fs.readFileSync(mainHomeFilePath, 'utf8');

assert(homeContent.includes('id="helpdesk"'), 'Main public page has dedicated Helpdesk section');
assert(homeContent.includes('Festoria Official Platform Helpdesk'), 'Helpdesk title is prominently displayed on main page');
assert(homeContent.includes('9844691633'), 'Main page contains phone 9844691633');
assert(homeContent.includes('abdwahidbc@gmail.com'), 'Main page contains email abdwahidbc@gmail.com');
assert(homeContent.includes('@abd_l_wahid_'), 'Main page contains Instagram @abd_l_wahid_');

console.log(`\nResults: ${passCount} passed, ${failCount} failed.`);
if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL DESIGN & ARCHITECTURE TESTS PASSED!\n');
}
