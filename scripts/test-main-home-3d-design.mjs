import { readFileSync } from 'fs';
import { resolve } from 'path';

console.log('🧪 Verifying Festoria Simplified Redesign (Inspired by Reference Images)...');

const filePath = resolve('src/pages/public/FestoriaHomePage.tsx');
const content = readFileSync(filePath, 'utf8');

const tests = [
  // 1. 3D Canvas / Three.js completely removed
  { name: 'Background3DThreadsAndShapes not mounted on homepage', test: () => !content.includes('<Background3DThreadsAndShapes') },
  { name: 'No three.js or canvas rendering in FestoriaHomePage', test: () => !content.includes('<canvas') && !content.includes("from 'three'") },

  // 2. Bold Festive Typography & Theme (Inspired by Reference Images)
  { name: 'Festive warm coral/red theme applied (bg-[#f84454])', test: () => content.includes('bg-[#f84454]') },
  { name: 'Impact display headline "MAKE YOUR FEST ALIVE"', test: () => content.includes('MAKE YOUR') && content.includes('FEST') && content.includes('ALIVE') },
  { name: 'Coordinator trust subtitle present', test: () => content.includes('Trusted by 1200+ fest coordinators') },
  { name: 'Clean pill CTA buttons present (Create Your Fest, Start Free Trial)', test: () => content.includes('Create Your Fest') && content.includes('Start Free Trial') },

  // 3. Curved Client Fests Showcase Banner (Like Image 2 Top)
  { name: 'Curved client festivals showcase banner present', test: () => content.includes('id="fest-showcase"') && content.includes('Al Murafaqa') && content.includes('SULOOK') && content.includes('MATRIX') },

  // 4. Split Feature Showcase (Like Image 2 Middle)
  { name: 'Split feature section present (Bulk Entry, Skip the Hurry)', test: () => content.includes('Bulk Entry, Skip the Hurry') && content.includes('Upload participant details in bulk') },
  { name: 'Translucent frosted glass feature tiles present', test: () => content.includes('Launch Your Festival Online') && content.includes('Give Judges the Tools to Score With Confidence') && content.includes('3D Stepped Championship Podium') },

  // 5. Infinite Horizontal Marquee Ticker Strip (Like Image 2 Bottom)
  { name: 'Infinite marquee ticker strip present', test: () => content.includes('animate-marquee') && content.includes('Digital Judging') && content.includes('Certificate Verification') },

  // 6. Active Festivals Directory
  { name: 'Active festivals directory section present', test: () => content.includes('id="fest-directory"') && content.includes('Active Campus Festivals') && content.includes('Visit Fest Portal') },

  // 7. Official Platform Helpdesk
  { name: 'Official Helpdesk section present', test: () => content.includes('id="helpdesk"') && content.includes('Festoria Official Platform Helpdesk') },
  { name: 'Official Phone Helpline (9844691633) present', test: () => content.includes('href="tel:9844691633"') && content.includes('9844691633') },
  { name: 'Official Support Email (abdwahidbc@gmail.com) present', test: () => content.includes('href="mailto:abdwahidbc@gmail.com"') && content.includes('abdwahidbc@gmail.com') },
  { name: 'Official Instagram (@abd_l_wahid_) present', test: () => content.includes('https://instagram.com/abd_l_wahid_') && content.includes('@abd_l_wahid_') },

  // 8. Strict Constraints
  { name: 'Zero <video> tags on main homepage', test: () => !content.includes('<video') },
  { name: 'Zero <img> tags other than FESTORIA_LOGO', test: () => {
      const imgTags = content.match(/<img[^>]+>/g) || [];
      return imgTags.every(tag => tag.includes('FESTORIA_LOGO'));
    }
  }
];

let failed = 0;
for (const [index, { name, test }] of tests.entries()) {
  try {
    const passed = test();
    if (passed) {
      console.log(`  ✓ Test ${index + 1}: ${name}`);
    } else {
      console.error(`  ✗ Test ${index + 1} FAILED: ${name}`);
      failed++;
    }
  } catch (err) {
    console.error(`  ✗ Test ${index + 1} EXCEPTION: ${name} ->`, err.message);
    failed++;
  }
}

if (failed === 0) {
  console.log(`\n🎉 ALL ${tests.length} SIMPLIFIED REDESIGN TESTS PASSED!`);
  process.exit(0);
} else {
  console.error(`\n❌ ${failed} / ${tests.length} TESTS FAILED.`);
  process.exit(1);
}
