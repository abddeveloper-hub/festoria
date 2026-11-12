import fs from 'fs';
import path from 'path';

console.log('======================================================================');
console.log('  TESTING PUBLIC FEST PAGE: MENU BAR & STRUCTURED BENTO GRID');
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

const publicFestFilePath = path.resolve('src/pages/public/PublicFestPage.tsx');
assert(fs.existsSync(publicFestFilePath), 'PublicFestPage.tsx exists');

const content = fs.readFileSync(publicFestFilePath, 'utf8');

// 1. Menu Bar state & icon import
assert(content.includes('Menu') && content.includes("from 'lucide-react'"), 'Menu icon is imported from lucide-react');
assert(content.includes('menuDrawerOpen') && content.includes('setMenuDrawerOpen'), 'menuDrawerOpen state is defined');

// 2. Header options removed & Menu button added
assert(content.includes('setMenuDrawerOpen(true)'), 'Menu button triggers setMenuDrawerOpen(true)');
assert(content.includes('aria-label="Open Navigation Menu"'), 'Menu button has accessible label');

// Check that the old direct action buttons in the nav are removed
// The top nav should have the Menu button instead of Register Now & Sign in buttons in nav
const navMatch = content.match(/<nav[\s\S]*?<\/nav>/);
assert(navMatch !== null, 'Found top <nav> element');
if (navMatch) {
  const navContent = navMatch[0];
  assert(navContent.includes('setMenuDrawerOpen(true)'), 'Top nav contains the Menu button');
  assert(!navContent.includes('openAuth(\'participant\', \'register\')'), 'Direct Register Now button removed from top nav');
  assert(!navContent.includes('openAuth(\'participant\', \'signin\')'), 'Direct Sign In button removed from top nav');
}

// 3. Navigation Menu Drawer
assert(content.includes('SLIDE-OUT NAVIGATION MENU DRAWER'), 'Slide-out Navigation Menu Drawer section is present');
assert(content.includes('role="dialog"') && content.includes('aria-modal="true"'), 'Drawer has proper dialog ARIA attributes');
assert(content.includes('setMenuDrawerOpen(false)'), 'Drawer backdrop and buttons close the drawer');
assert(content.includes('Join as a Participant'), 'Drawer contains quick Contestant Access card');
assert(content.includes('Leaderboard & Standings'), 'Drawer contains Leaderboard navigation');
assert(content.includes('Student Directory & Chest #'), 'Drawer contains Student Directory navigation');
assert(content.includes('Official Published Results'), 'Drawer contains Live Results navigation');
assert(content.includes('Timetable & Stage Schedule'), 'Drawer contains Timetable navigation');
assert(content.includes('Houses & Competing Teams'), 'Drawer contains Houses navigation');
assert(content.includes('Team Leader Portal'), 'Drawer contains Team Leader Portal access');
assert(content.includes('Fest Admin Console'), 'Drawer contains Fest Admin Console access');

// 4. Contact info in Drawer & Page
assert(content.includes('9844691633'), 'Helpline phone 9844691633 is present');
assert(content.includes('abdwahidbc@gmail.com'), 'Email abdwahidbc@gmail.com is present');
assert(content.includes('abd_l_wahid_'), 'Instagram handle @abd_l_wahid_ is present');

// 5. Structured Metrics Strip
assert(content.includes('Festival Quick Metrics Strip'), 'Festival Quick Metrics Strip is present');
assert(content.includes('Collegiate Events'), 'Metrics strip displays Collegiate Events');
assert(content.includes('Competing Houses'), 'Metrics strip displays Competing Houses');
assert(content.includes('Ratified Results'), 'Metrics strip displays Ratified Results');

// 6. Structured Bento Grid
assert(content.includes('STRUCTURED BENTO GRID'), 'Overview Bento Grid is present');
assert(content.includes('Bento Row 1: Welcome & Highlights'), 'Bento Row 1 is present');
assert(content.includes('Bento Row 2: Live Championship Standings Spotlight'), 'Bento Row 2 (Championship Spotlight) is present');
assert(content.includes('Bento Row 3: Upcoming Programme Schedule'), 'Bento Row 3 is present');
assert(content.includes('Top Teams') && content.includes('Top Students'), 'Spotlight toggle supports both Teams and Students');

console.log(`\nResults: ${passCount} passed, ${failCount} failed.`);
if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL PUBLIC FEST PAGE MENU & STRUCTURE TESTS PASSED!\n');
}
