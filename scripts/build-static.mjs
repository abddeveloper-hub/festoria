import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');

// Clean and recreate dist directory
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

function copyDir(src, dest, ignoreNames = []) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoreNames.includes(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, ignoreNames);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 1. Copy css, js, supabase folders
copyDir(path.resolve('css'), path.join(distDir, 'css'));
copyDir(path.resolve('js'), path.join(distDir, 'js'));
copyDir(path.resolve('supabase'), path.join(distDir, 'supabase'));

// 2. Copy root HTML and asset files
const rootFiles = [
  'index.html',
  'admin.html',
  'festoria-logo.jpg',
  'favicon.svg'
];

for (const file of rootFiles) {
  const src = path.resolve(file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(distDir, file));
  }
}

// 3. Generate 404.html from index.html for GitHub Pages routing
const indexPath = path.join(distDir, 'index.html');
const fallbackPath = path.join(distDir, '404.html');
if (fs.existsSync(indexPath)) {
  fs.copyFileSync(indexPath, fallbackPath);
}

// 4. Mirror into /dist/festoria/ for subpath compatibility
const festoriaDir = path.join(distDir, 'festoria');
copyDir(distDir, festoriaDir, ['festoria']);

console.log('✓ Pure Static Site successfully built in dist/');
