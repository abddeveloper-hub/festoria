import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(full));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}

const files = walk('./src').concat(['./index.html', './admin.html', './super-admin.html', './team-leader.html', './participant.html']);

console.log(`Auditing ${files.length} files...`);

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    // Check for any href starting with "/" but not "/festoria", "http", or "//"
    if (/href=["']\/(?!festoria)[^"']*["']/.test(line)) {
      console.log(`[ROOT HREF] ${f}:${idx + 1} -> ${line.trim()}`);
    }
    // Check for window.location = '/' or window.location.href = '/'
    if (/window\.location(\.href)?\s*=\s*['"]\/(?!festoria)[^'"]*['"]/.test(line)) {
      console.log(`[ROOT REDIRECT] ${f}:${idx + 1} -> ${line.trim()}`);
    }
    // Check for 100vw or w-screen
    if (/100vw|w-screen/.test(line)) {
      console.log(`[100VW TRAP] ${f}:${idx + 1} -> ${line.trim()}`);
    }
  });
}
