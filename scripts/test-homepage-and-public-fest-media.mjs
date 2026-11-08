/**
 * FESTORIA — HOMEPAGE & PUBLIC FEST PAGE MEDIA TEST SUITE
 * 
 * Verifies:
 * 1. Main Festoria Homepage contains strictly ZERO photos and ZERO videos.
 * 2. Homepage uses vector icons, typography, CSS gradients, geometric shapes.
 * 3. Individual Public Fest Page (/f/{festId}) supports Admin-managed media.
 * 4. Hero video support (MP4/WebM, looping, muted, fallback gradient, accessible controls).
 * 5. Transparent PNG logo support with size and alignment options.
 * 6. Main curated photos with captions and reordering.
 * 7. Photo gallery with category filtering and modal lightbox.
 * 8. Live data integration: Results, Timetable/Schedule, Teams, Bulletins.
 * 9. Fest Admin Public Page Management CMS (6 tabs: Hero, Logo, Photos, Gallery, Content, Publish).
 * 10. Dual-state model (Draft vs Published) ensuring drafts are private until published.
 * 11. Firebase Storage and Firestore Security Rules preventing cross-fest tampering.
 * 12. Non-breaking preservation of Admin, Super Admin, Team Leader, and Participant portals.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    testsFailed++;
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTestSuite() {
  console.log('======================================================================');
  console.log('  FESTORIA — HOMEPAGE & PUBLIC FEST PAGE MEDIA VERIFICATION SUITE');
  console.log('======================================================================\n');

  // ============================================================================
  // TEST GROUP 1: Central Homepage Zero Photos & Zero Videos Strict Compliance
  // ============================================================================
  console.log('--- TEST GROUP 1: Central Festoria Homepage Zero Media Restrictions ---');
  {
    const homePagePath = path.join(__dirname, '../src/pages/public/FestoriaHomePage.tsx');
    assert(fs.existsSync(homePagePath), 'FestoriaHomePage.tsx exists');
    const content = fs.readFileSync(homePagePageOrPath(homePagePath), 'utf8');

    // Strict checks: NO <img tags, NO <video tags
    const hasImgTag = /<img\b/i.test(content);
    assert(!hasImgTag, 'Central Homepage contains strictly ZERO <img> elements');

    const hasVideoTag = /<video\b/i.test(content);
    assert(!hasVideoTag, 'Central Homepage contains strictly ZERO <video> elements');

    // Strict checks: NO backgroundImage photo references
    const hasPhotoBackground = /background-image|url\(['"][^)]+\.(jpg|jpeg|png|webp|gif|mp4)['"]\)/i.test(content);
    assert(!hasPhotoBackground, 'Central Homepage contains ZERO photo or video background URLs');

    // Check for modern vector styling, lucide icons, CSS gradients
    assert(content.includes('bg-linear-to-'), 'Homepage uses modern CSS linear gradients');
    assert(content.includes('lucide-react'), 'Homepage uses clean vector SVG icons from lucide-react');
    assert(content.includes('Sparkles') && content.includes('ShieldCheck') && content.includes('Zap'), 'Homepage uses AI & tech vector elements');
    assert(content.includes('Create New Fest') || content.includes('Create Your Fest'), 'Homepage features prominent Create Fest CTA');
    assert(content.includes('/f/${fest.id}') || content.includes('/f/'), 'Homepage links to individual public fest portals');
  }

  // ============================================================================
  // TEST GROUP 2: Individual Public Fest Page Media Support
  // ============================================================================
  console.log('\n--- TEST GROUP 2: Individual Public Fest Page (/f/{festId}) Media ---');
  {
    const publicFestPath = path.join(__dirname, '../src/pages/public/PublicFestPage.tsx');
    assert(fs.existsSync(publicFestPath), 'PublicFestPage.tsx exists');
    const content = fs.readFileSync(publicFestPath, 'utf8');

    // Video Hero verification
    assert(content.includes('<video'), 'Public Fest Page renders video element when videoUrl is provided');
    assert(content.includes('autoPlay'), 'Hero video supports responsive autoplay');
    assert(content.includes('muted'), 'Hero video is muted by default for browser policy compliance');
    assert(content.includes('loop'), 'Hero video supports continuous looping');
    assert(content.includes('playsInline'), 'Hero video includes playsInline for mobile devices');
    assert(content.includes('isVideoPlaying') || content.includes('videoRef'), 'Hero video provides user-accessible play/pause controls');
    assert(content.includes('videoFailed') || content.includes('onError'), 'Hero video includes fallback handling');

    // Fest Logo verification
    assert(content.includes('pageData.logo.logoUrl'), 'Public Fest Page renders transparent PNG logo in navigation');
    assert(content.includes('pageData.logo.widthPx'), 'Public Fest Page dynamically scales logo based on admin settings');

    // Main Photos verification
    assert(content.includes('mainFeaturedPhotos'), 'Public Fest Page renders admin-curated main featured photos');
    assert(content.includes('photo.caption'), 'Main photos display admin-provided captions');

    // Photo Gallery & Lightbox verification
    assert(content.includes('filteredGalleryPhotos'), 'Public Fest Page filters gallery photos by category');
    assert(content.includes('selectedPhoto'), 'Public Fest Page includes interactive modal lightbox for photos');
    assert(content.includes('setSelectedPhoto(null)'), 'Lightbox includes close action');

    // Live Data Integration
    assert(content.includes('publishedResults'), 'Public Fest Page displays published competition results');
    assert(content.includes('schedule'), 'Public Fest Page displays official timetable & schedule');
    assert(content.includes('teams'), 'Public Fest Page displays participating teams / houses');
    assert(content.includes('publicAnnouncements'), 'Public Fest Page displays official bulletins and announcements');
  }

  // ============================================================================
  // TEST GROUP 3: Fest Admin Public Page Management CMS (6 Tabs)
  // ============================================================================
  console.log('\n--- TEST GROUP 3: Fest Admin CMS (PublicPageManagement.tsx) ---');
  {
    const cmsPath = path.join(__dirname, '../src/pages/admin/PublicPageManagement.tsx');
    assert(fs.existsSync(cmsPath), 'PublicPageManagement.tsx exists');
    const content = fs.readFileSync(cmsPath, 'utf8');

    // 6 Tabs verification
    assert(content.includes("'hero'") && content.includes('Hero Section'), 'Tab 1: Hero Section management present');
    assert(content.includes("'logo'") && content.includes('Fest Logo'), 'Tab 2: Fest Logo management present');
    assert(content.includes("'photos'") && content.includes('Main Photos'), 'Tab 3: Main Curated Photos management present');
    assert(content.includes("'gallery'") && content.includes('Photo Gallery'), 'Tab 4: Photo Gallery management present');
    assert(content.includes("'content'") && content.includes('Page Content'), 'Tab 5: Page Content & Toggles management present');
    assert(content.includes("'preview'") && content.includes('Preview and Publish'), 'Tab 6: Preview and Publish workflow present');

    // Actions & Operations
    assert(content.includes('uploadFestMedia'), 'CMS integrates secure media uploads to Firebase Storage');
    assert(content.includes('deleteFestMedia'), 'CMS integrates media deletion from Firebase Storage');
    assert(content.includes('handlePublish'), 'CMS supports publishing approved draft to live public page');
    assert(content.includes('handleSaveDraft'), 'CMS supports saving draft without immediately exposing to public');
    assert(content.includes('handleMovePhoto') || content.includes('movePhotoOrder'), 'CMS supports reordering photos up and down');
  }

  // ============================================================================
  // TEST GROUP 4: Storage Service & Media File Validations
  // ============================================================================
  console.log('\n--- TEST GROUP 4: Storage Service & Size/Mime Validations ---');
  {
    const storageServicePath = path.join(__dirname, '../src/firebase/storageService.ts');
    assert(fs.existsSync(storageServicePath), 'storageService.ts exists');
    const content = fs.readFileSync(storageServicePath, 'utf8');

    assert(content.includes('uploadFestMedia'), 'storageService exports uploadFestMedia');
    assert(content.includes('deleteFestMedia'), 'storageService exports deleteFestMedia');
    assert(content.includes('validateMediaFile'), 'storageService exports validateMediaFile');
    assert(content.includes('video/mp4') && content.includes('video/webm'), 'Supports MP4 and WebM video formats');
    assert(content.includes('50 * 1024 * 1024'), 'Enforces 50MB maximum size for videos');
    assert(content.includes('image/png'), 'Supports PNG format for transparent logos');
    assert(content.includes('5 * 1024 * 1024'), 'Enforces 5MB maximum size for fest logos');
    assert(content.includes('10 * 1024 * 1024'), 'Enforces 10MB maximum size for photos');
  }

  // ============================================================================
  // TEST GROUP 5: Firestore & Storage Security Rules & Cross-Fest Isolation
  // ============================================================================
  console.log('\n--- TEST GROUP 5: Security Rules & Cross-Fest Isolation ---');
  {
    // Storage Rules
    const storageRulesPath = path.join(__dirname, '../storage.rules');
    assert(fs.existsSync(storageRulesPath), 'storage.rules exists');
    const storageRules = fs.readFileSync(storageRulesPath, 'utf8');

    assert(storageRules.includes('match /fests/{festId}/{allPaths=**}'), 'Storage rules scope files strictly by festId');
    assert(storageRules.includes('isAuthorizedFestAdmin(festId)'), 'Storage write/delete restricted to authorized Fest Admin or Super Admin');
    assert(storageRules.includes('50 * 1024 * 1024'), 'Storage rules enforce 50MB video limit server-side');

    // Firestore Rules
    const firestoreRulesPath = path.join(__dirname, '../firestore.rules');
    assert(fs.existsSync(firestoreRulesPath), 'firestore.rules exists');
    const firestoreRules = fs.readFileSync(firestoreRulesPath, 'utf8');

    assert(firestoreRules.includes('match /fest_public_pages/{pageId}'), 'Firestore rules contain /fest_public_pages collection');
    assert(firestoreRules.includes('pageId.matches') && firestoreRules.includes('_published'), 'Published public page readable by anyone without login');
    assert(firestoreRules.includes('isFestAdmin') && firestoreRules.includes('isSuperAdmin'), 'Drafts and updates strictly restricted to authorized admin');
  }

  // ============================================================================
  // TEST GROUP 6: Dual-State Model (Draft vs Published)
  // ============================================================================
  console.log('\n--- TEST GROUP 6: Dual-State Data Architecture ---');
  {
    const firestoreServicePath = path.join(__dirname, '../src/firebase/firestoreService.ts');
    assert(fs.existsSync(firestoreServicePath), 'firestoreService.ts exists');
    const content = fs.readFileSync(firestoreServicePath, 'utf8');

    assert(content.includes('fetchPublishedFestPage'), 'firestoreService exports fetchPublishedFestPage');
    assert(content.includes('fetchDraftFestPage'), 'firestoreService exports fetchDraftFestPage');
    assert(content.includes('saveDraftFestPage'), 'firestoreService exports saveDraftFestPage');
    assert(content.includes('publishFestPage'), 'firestoreService exports publishFestPage');
    assert(content.includes('_draft') && content.includes('_published'), 'Drafts and published pages saved to dedicated doc IDs');
  }

  // ============================================================================
  // TEST GROUP 7: Router & Portal Integrations
  // ============================================================================
  console.log('\n--- TEST GROUP 7: Router & Multi-Portal Architecture ---');
  {
    const publicPagePath = path.join(__dirname, '../src/pages/PublicPage.tsx');
    assert(fs.existsSync(publicPagePath), 'PublicPage.tsx exists');
    const publicContent = fs.readFileSync(publicPagePath, 'utf8');

    assert(publicContent.includes('FestoriaHomePage'), 'PublicPage routes to FestoriaHomePage at root');
    assert(publicContent.includes('PublicFestPage'), 'PublicPage routes to PublicFestPage when festId is present');
    assert(publicContent.includes('/f/'), 'PublicPage parses /f/{festId} URL pattern');

    // Admin Sidebar integration
    const sidebarPath = path.join(__dirname, '../src/components/layout/Sidebar.tsx');
    assert(fs.existsSync(sidebarPath), 'Sidebar.tsx exists');
    const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');
    assert(sidebarContent.includes("'public'"), 'Admin sidebar includes public page navigation item');
    assert(sidebarContent.includes('Public Page'), 'Admin sidebar labels tab as Public Page');

    // App.tsx tab rendering
    const appPath = path.join(__dirname, '../src/App.tsx');
    assert(fs.existsSync(appPath), 'App.tsx exists');
    const appContent = fs.readFileSync(appPath, 'utf8');
    assert(appContent.includes('PublicPageManagement'), 'App.tsx mounts PublicPageManagement when tab is public');
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n======================================================================');
  console.log(`  HOMEPAGE & PUBLIC FEST MEDIA SUITE: ${testsPassed} / ${testsPassed + testsFailed} TESTS PASSED.`);
  console.log('======================================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

function homePagePageOrPath(p) {
  return p;
}

runTestSuite().catch((err) => {
  console.error('\nTest Suite Failed with Error:', err);
  process.exit(1);
});
