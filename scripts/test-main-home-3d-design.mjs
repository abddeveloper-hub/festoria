import { readFileSync } from 'fs';
import { resolve } from 'path';

console.log('🧪 Verifying Festoria New High-Energy Event Management Homepage Design...');

const filePath = resolve('src/pages/public/FestoriaHomePage.tsx');
const content = readFileSync(filePath, 'utf8');

const tests = [
  // 1. Hero & Badges Stack
  { name: 'Status badge stack present (Next-Gen Festival OS & 1200+ coordinators)', test: () => content.includes('Next-Gen Festival OS') && content.includes('Trusted by 1200+ fest coordinators') },
  { name: 'Hero title "Festivals Managed Flawlessly & Faster."', test: () => content.includes('Festivals Managed') && content.includes('Flawlessly & Faster.') },
  { name: 'Hero CTA buttons present (Start 14-Day Free Trial & Explore)', test: () => content.includes('Start 14-Day Free Trial') && content.includes('Explore Live Features & Demo') },
  { name: 'Metrics ribbon present (50k+, 0.2s, 100% Clash-Free)', test: () => content.includes('50k+') && content.includes('0.2s') && content.includes('100%') },

  // 2. Interactive Marquee / Core Modules
  { name: 'Core engine modules marquee present', test: () => content.includes('Core Engine Modules') && content.includes('animate-marquee') && content.includes('Bulk Entry') },

  // 3. 12 Feature Cards with Sheen Effect
  { name: 'Feature cards present with sheen-effect', test: () => content.includes('sheen-effect') && content.includes('Bulk Entry, Skip Hurry') && content.includes('Build Festival Your Way') },
  { name: 'Smarter Fast Judging card present', test: () => content.includes('Smarter Fast Judging') },
  { name: 'Clash-free schedule card present', test: () => content.includes('Plan With Confidence') },

  // 4. Live Preview Card & Testimonials
  { name: 'Interactive live preview card present (Stage 01)', test: () => content.includes('Stage 01 • Main Arena Live') && content.includes('Classical Dance Solo') },
  { name: 'Testimonial section present with coordinator stories', test: () => content.includes('Fest Coordinator Stories') && content.includes('Rafeeq Hudawi') && content.includes('Shakir Mubarak Kaippuram') },

  // 5. Interactive FAQ Accordion
  { name: 'FAQ accordion present (offline caching & clash prevention)', test: () => content.includes('Can we run offline during poor network?') && content.includes('How does clash prevention work?') },

  // 6. Active Festivals Directory & Official Helpdesk
  { name: 'Active festivals directory section present', test: () => content.includes('id="fest-directory"') && content.includes('Active Campus Festivals') && content.includes('Visit Portal') },
  { name: 'Official Helpdesk section present', test: () => content.includes('id="helpdesk"') && content.includes('Festoria Official Platform Helpdesk') },
  { name: 'Official Phone Helpline (9844691633) present', test: () => content.includes('href="tel:9844691633"') && content.includes('9844691633') },
  { name: 'Official Support Email (abdwahidbc@gmail.com) present', test: () => content.includes('href="mailto:abdwahidbc@gmail.com"') && content.includes('abdwahidbc@gmail.com') },
  { name: 'Official Instagram (@abd_l_wahid_) present', test: () => content.includes('https://instagram.com/abd_l_wahid_') && content.includes('@abd_l_wahid_') },

  // 7. Mobile Dock Navigation (Sticky Bottom Bar)
  { name: 'Mobile dock navigation present (bottom-sticky-bar)', test: () => content.includes('data-purpose="bottom-sticky-bar"') && content.includes('Try Free') },

  // 8. Strict Constraints: Zero Photos / Zero Videos on Main Homepage
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
  console.log(`\n🎉 ALL ${tests.length} TESTS PASSED!`);
  process.exit(0);
} else {
  console.error(`\n❌ ${failed} / ${tests.length} TESTS FAILED.`);
  process.exit(1);
}
