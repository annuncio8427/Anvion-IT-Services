import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applySeo } from './seo.mjs';

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
for (const directory of ['images', 'js', 'admin', 'css']) {
  const source = path.join(root, directory);
  if (fs.existsSync(source) && fs.statSync(source).isDirectory()) {
    fs.cpSync(source, path.join(output, directory), { recursive: true });
  }
}

// Add the shared responsive layer to every public HTML page, including nested portal/admin pages.
function injectMobileStyles(directory) {
  let updated = 0;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      updated += injectMobileStyles(target);
      continue;
    }
    if (!entry.isFile() || !/\.html?$/i.test(entry.name)) continue;
    let html = fs.readFileSync(target, 'utf8');
    if (html.includes('/css/mobile-responsive.css')) continue;
    if (!/<\/head>/i.test(html)) {
      throw new Error('Cannot inject mobile stylesheet: missing </head> in ' + target);
    }
    html = html.replace(
      /<\/head>/i,
      '<link rel="stylesheet" href="/css/mobile-responsive.css">\n</head>'
    );
    fs.writeFileSync(target, html, 'utf8');
    updated += 1;
  }
  return updated;
}

const mobileResponsivePages = injectMobileStyles(output);
console.log('Applied shared mobile layout stylesheet to ' + mobileResponsivePages + ' HTML pages.');

const seoSummary = applySeo(output);
console.log('Prepared public website assets in ./public');
console.log('Applied SEO metadata to ' + seoSummary.pageCount + ' public pages; marked ' + seoSummary.noindexCount + ' private pages noindex.');
