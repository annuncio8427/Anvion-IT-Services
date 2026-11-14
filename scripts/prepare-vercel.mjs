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
for (const directory of ['images', 'js', 'admin']) {
  const source = path.join(root, directory);
  if (fs.existsSync(source) && fs.statSync(source).isDirectory()) {
    fs.cpSync(source, path.join(output, directory), { recursive: true });
  }
}

// Copy CSS files only; the source css/ folder also contains a legacy HTML page.
const cssSource = path.join(root, 'css');
const publicCss = path.join(output, 'css');
if (fs.existsSync(cssSource) && fs.statSync(cssSource).isDirectory()) {
  fs.mkdirSync(publicCss, { recursive: true });
  for (const entry of fs.readdirSync(cssSource, { withFileTypes: true })) {
    if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== '.css') continue;
    fs.copyFileSync(path.join(cssSource, entry.name), path.join(publicCss, entry.name));
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


// Install Google Tag Manager on public pages only. Private portal pages are intentionally excluded.
const GTM_ID = 'GTM-NRKHWLRP';
const PRIVATE_HTML_PAGES = new Set([
  '404.html',
  'admin.html',
  'admin-login.html',
  'admin/login.html',
  'login.html',
  'signup.html',
  'forgot-password.html',
  'profile.html',
  'dashboard.html',
]);

function injectGoogleTagManager(directory) {
  let updated = 0;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      updated += injectGoogleTagManager(target);
      continue;
    }
    if (!entry.isFile() || !/\.html?$/i.test(entry.name)) continue;

    const relativePath = path.relative(output, target).split(path.sep).join('/');
    if (PRIVATE_HTML_PAGES.has(relativePath)) continue;

    let html = fs.readFileSync(target, 'utf8');
    if (html.includes(GTM_ID)) continue;
    if (!/<\/head>/i.test(html) || !/<body\b[^>]*>/i.test(html)) {
      throw new Error('Cannot inject Google Tag Manager: missing head or body in ' + relativePath);
    }

    const headSnippet = `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');</script>
<!-- End Google Tag Manager -->`;

    const bodySnippet = `<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`;

    html = html.replace(/<\/head>/i, headSnippet + '\n</head>');
    html = html.replace(/(<body\b[^>]*>)/i, '$1\n' + bodySnippet);
    fs.writeFileSync(target, html, 'utf8');
    updated += 1;
  }
  return updated;
}

const googleTagManagerPages = injectGoogleTagManager(output);
console.log('Installed Google Tag Manager on ' + googleTagManagerPages + ' public HTML pages.');

const seoSummary = applySeo(output);
console.log('Prepared public website assets in ./public');
console.log('Applied SEO metadata to ' + seoSummary.pageCount + ' public pages; marked ' + seoSummary.noindexCount + ' private pages noindex.');
