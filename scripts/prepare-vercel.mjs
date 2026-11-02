import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'public');

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

// Public HTML pages stay at the same URL paths, including /admin/login.html.
for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  if (!entry.isFile()) continue;
  const extension = path.extname(entry.name).toLowerCase();
  const isPublicPage = ['.html', '.htm'].includes(extension);
  const isPublicMetadata = ['metadata.json', 'firebase-applet-config.json'].includes(entry.name);
  const isPublicAsset = ['.css', '.svg', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.ico', '.woff', '.woff2'].includes(extension);
  if (isPublicPage || isPublicMetadata || isPublicAsset) {
    fs.copyFileSync(path.join(root, entry.name), path.join(output, entry.name));
  }
}

// Copy only browser-facing assets. Private scripts and server sources are excluded.
for (const directory of ['images', 'js', 'admin']) {
  const source = path.join(root, directory);
  if (fs.existsSync(source) && fs.statSync(source).isDirectory()) {
    fs.cpSync(source, path.join(output, directory), { recursive: true });
  }
}

console.log('Prepared public website assets in ./public');
