import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
const indexPath = path.join(distDir, 'index.html');
const fallbackPath = path.join(distDir, '404.html');

if (fs.existsSync(indexPath)) {
  fs.copyFileSync(indexPath, fallbackPath);
  console.log('✓ Successfully generated 404.html from index.html for GitHub Pages routing');
} else {
  console.warn('⚠️ index.html not found in dist directory');
}

