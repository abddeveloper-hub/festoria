import fs from 'fs';
import path from 'path';

console.log('======================================================================');
console.log('  TESTING PUBLIC FEST PAGE (CLEAN HEADER) & MAIN PAGE (OFFICIAL HELPDESK)');
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

// Header has Menu button and NO redundant tabs
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

// Slide-out Navigation Menu Drawer contains all festival navigation
assert(festContent.includes('SLIDE-OUT NAVIGATION MENU DRAWER'), 'Slide-out Navigation Menu Drawer is present');
assert(festContent.includes('Leaderboard & Standings'), 'Drawer contains Leaderboard navigation');
assert(festContent.includes('Student Directory & Chest #'), 'Drawer contains Student Directory navigation');
assert(festContent.includes('Official Published Results'), 'Drawer contains Live Results navigation');
assert(festContent.includes('Timetable & Stage Schedule'), 'Drawer contains Timetable navigation');
assert(festContent.includes('Houses & Competing Teams'), 'Drawer contains Houses navigation');

// Fest public page does NOT contain platform personal helpdesk cards
assert(!festContent.includes('Festival Secretariat & Support'), 'Personal helpdesk card removed from fest public page');
assert(!festContent.includes('PHONE HELPLINE'), 'Personal phone helpline removed from fest public page');
assert(festContent.includes('Campus Grounds & Stages'), 'Fest public page has clean Campus Grounds & Stages card');

// 2. TEST MAIN PUBLIC PAGE (FestoriaHomePage.tsx)
const mainHomeFilePath = path.resolve('src/pages/public/FestoriaHomePage.tsx');
assert(fs.existsSync(mainHomeFilePath), 'FestoriaHomePage.tsx exists');

const homeContent = fs.readFileSync(mainHomeFilePath, 'utf8');

// Main public page contains official helpdesk section
assert(homeContent.includes('id="helpdesk"'), 'Main public page has dedicated Helpdesk section');
assert(homeContent.includes('Festoria Official Platform Helpdesk'), 'Helpdesk title is prominently displayed on main page');
assert(homeContent.includes('9844691633'), 'Main page contains phone 9844691633');
assert(homeContent.includes('abdwahidbc@gmail.com'), 'Main page contains email abdwahidbc@gmail.com');
assert(homeContent.includes('@abd_l_wahid_'), 'Main page contains Instagram @abd_l_wahid_');
assert(homeContent.includes('Voice Helpline'), 'Main page helpdesk contains Voice Helpline card');
assert(homeContent.includes('Official Support Email'), 'Main page helpdesk contains Support Email card');
assert(homeContent.includes('Official Instagram'), 'Main page helpdesk contains Instagram card');

console.log(`\nResults: ${passCount} passed, ${failCount} failed.`);
if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL CLEAN HEADER & OFFICIAL HELPDESK TESTS PASSED!\n');
}
