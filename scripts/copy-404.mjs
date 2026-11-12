import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
const indexPath = path.join(distDir, 'index.html');
const fallbackPath = path.join(distDir, '404.html');

// 1. Generate 404.html for GitHub Pages client-side routing fallback
if (fs.existsSync(indexPath)) {
  fs.copyFileSync(indexPath, fallbackPath);
  console.log('✓ Successfully generated 404.html from index.html for GitHub Pages routing');
} else {
  console.warn('⚠️ index.html not found in dist directory');
}

// 2. Mirror assets and HTML into /dist/festoria/ so the build is 100% universal
// (works whether served at root domain or /festoria/ subpath on any CDN / Firebase Hosting)
const festoriaSubdir = path.join(distDir, 'festoria');
if (!fs.existsSync(festoriaSubdir)) {
  fs.mkdirSync(festoriaSubdir, { recursive: true });
}

// Mirror all HTML and image/icon assets into /dist/festoria/
const files = fs.readdirSync(distDir);
for (const file of files) {
  if (file.endsWith('.html') || file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.svg') || file.endsWith('.ico')) {
    fs.copyFileSync(path.join(distDir, file), path.join(festoriaSubdir, file));
  }
}

// Mirror assets directory into /dist/festoria/assets
const assetsDir = path.join(distDir, 'assets');
const festoriaAssetsDir = path.join(festoriaSubdir, 'assets');
if (fs.existsSync(assetsDir)) {
  if (!fs.existsSync(festoriaAssetsDir)) {
    fs.mkdirSync(festoriaAssetsDir, { recursive: true });
  }
  const assetFiles = fs.readdirSync(assetsDir);
  for (const asset of assetFiles) {
    fs.copyFileSync(path.join(assetsDir, asset), path.join(festoriaAssetsDir, asset));
  }
  console.log(`✓ Mirrored ${assetFiles.length} assets to /dist/festoria/assets for universal domain compatibility`);
}
