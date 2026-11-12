import { readFileSync } from 'fs';
import { resolve } from 'path';

console.log('🧪 Verifying Festoria Main Public Page 3D & Structured Tailwind Design...');

const filePath = resolve('src/pages/public/FestoriaHomePage.tsx');
const content = readFileSync(filePath, 'utf8');

const tests = [
  // 1. Structural Sections
  { name: 'Navbar present with 3D glassmorphism backdrop', test: () => content.includes('sticky top-0') && content.includes('backdrop-blur-xl') },
  { name: 'Hero section with 3D perspective background', test: () => content.includes('[perspective:1400px]') || content.includes('perspective') },
  { name: '3D Floating Status Capsule present', test: () => content.includes('Vibrant Event Studio • Production-Grade Festival Infrastructure') },
  { name: '3D Interactive Live Run-of-Show Console present', test: () => content.includes('Live Run-of-Show Telemetry Console') },
  { name: '3D Inset Stage Switcher Bar present', test: () => content.includes('Stage Alpha (Mainstage)') && content.includes('Amphitheatre (Debate & Drama)') && content.includes('Arena (Robotics & Tech)') },
  { name: '3D Telemetry Stats Pedestals (4 metrics) present', test: () => content.includes('Isolated Workspaces') && content.includes('Timetable Engine') && content.includes('Jury Ratification') && content.includes('Public Fest Portals') },
  { name: '3D Bento Grid Capabilities Architecture present', test: () => content.includes('id="capabilities"') && content.includes('lg:col-span-2') && content.includes('Automated Conflict-Free Timetable Builder') },
  { name: 'Conflict-Free Algorithmic Matrix simulation in Bento', test: () => content.includes('Zero-Clash Algorithmic Engine') && content.includes('No Clash ✓') },
  { name: 'Jury Quorum 3D Preview in Bento', test: () => content.includes('Jury Quorum') && content.includes('3 / 3 Signed') && content.includes('Digital Notary Hash') },
  { name: 'Public Fest Portal Hub preview in Bento', test: () => content.includes('Admin-Managed Public Portal Hub (/f/:id)') && content.includes('3D Stepped Podium') },
  { name: '3D Stepped Governance Pipeline (4 stages) present', test: () => content.includes('Submit Fest Application') && content.includes('Super Admin Provisioning') && content.includes('Configure Stages & Media') && content.includes('Live Ratification & Results') },
  { name: 'Active Festivals Directory with 3D elevated cards', test: () => content.includes('id="fest-directory"') && content.includes('Active Institutional Festivals') && content.includes('Visit Fest Portal') },
  { name: '3D Glow CTA Banner present', test: () => content.includes('Ready to Launch Your Campus Festival?') },
  { name: 'Official Helpdesk 3D Podiums Section present', test: () => content.includes('id="helpdesk"') && content.includes('Festoria Official Platform Helpdesk') },
  { name: 'Official Phone Helpline (9844691633) present', test: () => content.includes('href="tel:9844691633"') && content.includes('9844691633') },
  { name: 'Official Support Email (abdwahidbc@gmail.com) present', test: () => content.includes('href="mailto:abdwahidbc@gmail.com"') && content.includes('abdwahidbc@gmail.com') },
  { name: 'Official Instagram (@abd_l_wahid_) present', test: () => content.includes('https://instagram.com/abd_l_wahid_') && content.includes('@abd_l_wahid_') },
  
  // 2. Strict Constraints: Zero Photos / Zero Videos on Main Homepage
  { name: 'Zero <video> tags on main homepage', test: () => !content.includes('<video') },
  { name: 'Zero <img> tags other than FESTORIA_LOGO', test: () => {
      const imgTags = content.match(/<img[^>]+>/g) || [];
      return imgTags.every(tag => tag.includes('FESTORIA_LOGO'));
    }
  },

  // 3. 3D Tailwind classes verification
  { name: '3D shadow-depths and inset highlights used', test: () => content.includes('shadow-[0_') && content.includes('inset_0_1px_0_rgba(255,255,255') },
  { name: '3D hover lift transformations applied', test: () => content.includes('hover:-translate-y-') }
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
  console.log(`\n🎉 ALL ${tests.length} VERIFICATION TESTS PASSED!`);
  process.exit(0);
} else {
  console.error(`\n❌ ${failed} / ${tests.length} TESTS FAILED.`);
  process.exit(1);
}
