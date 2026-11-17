import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const server = read('./server.js');
const auth = read('./src/middleware/auth.js');
const client = read('./js/firebase-client.js');
const rules = read('./firestore.rules');
const database = read('./src/db/index.ts');
const packageJson = JSON.parse(read('./package.json'));
const vercelConfig = JSON.parse(read('./vercel.json'));
const vercelEntry = read('./index.js');
const prepareScript = read('./scripts/prepare-vercel.mjs');
const seoScript = read('./scripts/seo.mjs');
const mobileCss = read('./css/mobile-responsive.css');

test('every admin API route requires administrator authorization', () => {
  const routes = [...server.matchAll(/app\.(?:get|post|patch|delete)\(\s*['"](\/api\/admin[^'"]*)['"]\s*,\s*([A-Za-z_$][\w$]*)/g)];
  assert.ok(routes.length >= 10, `Expected to find all admin API routes, found ${routes.length}`);
  assert.deepEqual(
    routes.filter(([, , middleware]) => middleware !== 'requireAdminAuth'),
    [],
    'An admin API route is missing requireAdminAuth'
  );
});

test('legacy JWT authentication has no built-in fallback secret', () => {
  assert.ok(server.includes('const JWT_SECRET = process.env.ADMIN_JWT_SECRET;'));
  assert.ok(!server.includes('anvion_secure_super_secret_jwt_key_2026'));
  assert.ok(auth.includes('if (!JWT_SECRET) return null;'));
  assert.ok(auth.includes("decoded.role !== 'ADMIN'"));
});

test('client enquiry history uses the authenticated identity, not a query email', () => {
  const route = server.match(/app\.get\('\/api\/my-enquiries',[\s\S]*?\n\}\);/);
  assert.ok(route, 'my-enquiries route should exist');
  assert.ok(route[0].includes('requireAuth'));
  assert.ok(route[0].includes('req.user?.email'));
  assert.ok(!route[0].includes('req.query.email'));
});

test('public project and service endpoints expose published content only', () => {
  assert.ok(server.includes("eq(projects.status, 'published')"));
  assert.ok(server.includes("eq(services.status, 'published')"));
});

test('static hosting blocks private uploads and backend source', () => {
  assert.ok(server.includes(String.raw`src|node_modules|uploads`));
  assert.ok(server.includes(String.raw`server\.js`));
});

test('admin fallback checks require the explicit ADMIN role in backend, client and rules', () => {
  assert.ok(auth.includes("isAdmin = adminDoc.exists && adminDoc.data()?.role === 'ADMIN'"));
  assert.ok(client.includes("adminDoc.exists() && adminDoc.data()?.role === 'ADMIN'"));
  assert.ok(rules.includes("get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role == 'ADMIN'"));
});

test('PostgreSQL connection honors SQL_PORT', () => {
  assert.ok(database.includes('port: Number(process.env.SQL_PORT || 5432)'));
});

test('Vercel uses the root Express app and runs the asset build', () => {
  assert.equal(vercelConfig.buildCommand, 'npm run build');
  assert.ok(vercelEntry.includes("import express from 'express';"));
  assert.ok(vercelEntry.includes("import app from './server.js';"));
  assert.ok(vercelEntry.includes('export default app;'));
  assert.ok(server.includes('if (!process.env.VERCEL)'));
  assert.ok(server.includes('export default app;'));
});

test('Vercel build prepares public pages and browser assets', () => {
  assert.ok(packageJson.scripts.build.includes('npm run prepare:vercel'));
  assert.ok(packageJson.scripts['prepare:vercel'].includes('scripts/prepare-vercel.mjs'));
  assert.ok(prepareScript.includes("['images', 'js', 'admin']"));
  assert.ok(prepareScript.includes("const cssSource = path.join(root, 'css')"));
  assert.ok(prepareScript.includes("path.extname(entry.name).toLowerCase() !== '.css'"));
  assert.ok(prepareScript.includes('injectMobileStyles(output)'));
  assert.ok(prepareScript.includes('firebase-applet-config.json'));
  assert.ok(!prepareScript.includes("'src'"));
});

test('Vercel public output contains the site pages and browser assets, not backend source', () => {
  for (const file of [
    './public/index.html',
    './public/contact.html',
    './public/css/mobile-responsive.css',
    './public/js/firebase-client.js',
    './public/images/annuncio.png',
    './public/admin/login.html',
    './public/firebase-applet-config.json',
  ]) {
    assert.ok(existsSync(new URL(file, import.meta.url)), `Missing expected public asset: ${file}`);
  }

  for (const privateFile of [
    './public/server.js',
    './public/package.json',
    './public/firestore.rules',
    './public/src',
  ]) {
    assert.ok(!existsSync(new URL(privateFile, import.meta.url)), `Private file was copied: ${privateFile}`);
  }
});

test('Vercel serves public HTML through the CDN, not through Express file reads', () => {
  const staticBlock = server.slice(
    server.indexOf('// Vercel publishes public/** through its CDN.'),
    server.indexOf('// Vercel executes the Express app as a serverless function.')
  );
  assert.ok(staticBlock.includes('if (!process.env.VERCEL)'));
  assert.ok(staticBlock.includes('app.use(express.static(publicDir'));
  assert.ok(staticBlock.includes('if (process.env.VERCEL) return res.redirect(308'));
  assert.match(staticBlock, /if \(!process\.env\.VERCEL\)\s*\{\s*app\.get\('\*'/);
});


test('Vercel uses one Express application and serves public assets through its CDN', () => {
  assert.ok(vercelEntry.includes("import app from './server.js';"));
  assert.ok(server.includes('// Vercel publishes public/** through its CDN.'));
  assert.ok(prepareScript.includes("const output = path.join(root, 'public')"));
  assert.ok(!existsSync(new URL('./api/index.js', import.meta.url)));
});


test('SEO build generates unique titles, descriptions, canonical URLs and social metadata', () => {
  for (const file of [
    'index.html',
    'about.html',
    'services.html',
    'web-development.html',
    'mobile-development.html',
    'ai-machine-learning.html',
    'cybersecurity.html',
    'it-consulting.html',
    'projects.html',
    'portfolio.html',
    'case-studies.html',
    'contact.html',
    'careers.html',
    'solution.html',
    'service-details.html',
    'start-a-project.html',
    'privacy-policy.html',
    'terms-of-service.html',
  ]) {
    const html = read('./public/' + file);
    assert.ok(html.includes('<title>') && html.includes('</title>'), file + ' should have a title');
    assert.ok(html.includes('<meta name="description" content="'), file + ' should have a meta description');
    assert.ok(html.includes('<link rel="canonical" href="https://'), file + ' should have a canonical URL');
    assert.ok(html.includes('<meta property="og:title" content="'), file + ' should have Open Graph metadata');
    assert.ok(html.includes('<script type="application/ld+json">'), file + ' should have structured data');
  }
});

test('Vercel SEO build publishes the uploaded ANVION logo favicon and web app manifest', () => {
  const homepage = read('./public/index.html');
  assert.ok(homepage.includes('<link rel="icon" type="image/png" sizes="48x48" href="/favicon.png">'));
  assert.ok(homepage.includes('<link rel="icon" type="image/x-icon" href="/favicon.ico">'));
  assert.ok(homepage.includes('<link rel="apple-touch-icon" href="/images/logo.png">'));
  assert.ok(homepage.includes('<link rel="manifest" href="/site.webmanifest">'));

  assert.ok(existsSync(new URL('./public/favicon.png', import.meta.url)), '48px logo favicon should be copied to public output');
  assert.ok(existsSync(new URL('./public/favicon.ico', import.meta.url)), 'ICO fallback should be copied to public output');
  assert.ok(prepareScript.includes("'.ico'") && prepareScript.includes("'.png'"));

  const manifest = JSON.parse(read('./public/site.webmanifest'));
  assert.equal(manifest.name, 'ANVION IT SERVICES');
  assert.equal(manifest.short_name, 'ANVION');
  assert.ok(manifest.icons.some((icon) => icon.src === '/favicon.png' && icon.sizes === '48x48'));
  assert.ok(manifest.icons.some((icon) => icon.src === '/favicon.ico'));
  assert.ok(manifest.icons.some((icon) => icon.src === '/images/logo.png'));
});


test('SEO build publishes the three new service landing pages with local canonical URLs', () => {
  for (const file of ['digital-marketing.html', 'branding-ui-ux.html', 'custom-desktop-software.html']) {
    const html = read('./public/' + file);
    assert.ok(html.includes('<h1'), file + ' should have a main heading');
    assert.ok(html.includes('<meta name="description" content="'), file + ' should have a meta description');
    assert.ok(html.includes('<link rel="canonical" href="https://www.anvionitservices.in/'), file + ' should use the production canonical host');
    assert.ok(html.includes('<script type="application/ld+json">'), file + ' should include structured data');
    assert.ok(html.includes('FAQ'), file + ' should show its FAQ section');
  }
});

test('SEO structured data includes the business location and service identity without review claims', () => {
  const homepage = read('./public/index.html');
  assert.ok(homepage.includes('"ProfessionalService"'));
  assert.ok(homepage.includes('Karungal'));
  assert.ok(homepage.includes('629178'));
  assert.ok(homepage.includes('anvionitservices@gmail.com'));
  assert.ok(homepage.includes('+91 9150270802'));
  assert.ok(!homepage.includes('aggregateRating'));
  assert.ok(!homepage.includes('"@type":"Review"'));
});

test('Public build uses clean canonical internal links and conversion event wiring', () => {
  const homepage = read('./public/index.html');
  assert.ok(homepage.includes('href="/web-development"'));
  assert.ok(homepage.includes('href="/digital-marketing"'));
  assert.ok(homepage.includes('href="/branding-ui-ux"'));
  assert.ok(!homepage.includes('href="web-development.html"'));
  assert.ok(homepage.includes('/js/seo-conversions.js'));

  const conversions = read('./public/js/seo-conversions.js');
  assert.ok(conversions.includes('whatsapp_click'));
  assert.ok(conversions.includes('phone_click'));
  assert.ok(conversions.includes('generate_lead'));
  assert.ok(conversions.includes('window.anvionTrackLead'));
});

test('Build helpers rewrite links safely, improve image loading, and inject conversion tracking', () => {
  assert.ok(prepareScript.includes('function rewriteInternalLinksToCleanUrls'));
  assert.ok(prepareScript.includes('const linkRewriteSummary = rewriteInternalLinksToCleanUrls(output)'));
  assert.ok(prepareScript.includes('loading="lazy"'));
  assert.ok(prepareScript.includes('/js/seo-conversions.js'));
  assert.ok(prepareScript.includes('new RegExp') === false);
});

test('Homepage uses local project imagery and links to dedicated marketing and design pages', () => {
  const homepage = read('./public/index.html');
  assert.ok(!homepage.includes('images.openai.com'));
  assert.ok(homepage.includes('href="/digital-marketing"'));
  assert.ok(homepage.includes('href="/branding-ui-ux"'));
  assert.ok(homepage.includes('Website, Mobile App'));
});

test('Lead conversion event only follows successful backend form responses', () => {
  const contactPage = read('./contact.html');
  const projectPage = read('./start-a-project.html');
  assert.ok(contactPage.includes('fetch("/api/contact"'));
  assert.ok(contactPage.includes('if (!response.ok)'));
  assert.ok(contactPage.includes('event: "generate_lead"'));
  assert.ok(projectPage.includes('if (!response.ok)'));
  assert.ok(projectPage.includes('event: "generate_lead"'));
});

test('SEO build marks private account pages noindex and excludes them from sitemap', () => {
  for (const file of ['admin.html', 'admin-login.html', 'admin/login.html', 'login.html', 'signup.html', 'forgot-password.html', 'profile.html']) {
    const html = read('./public/' + file);
    assert.ok(html.includes('<meta name="robots" content="noindex,nofollow">'), file + ' should be noindex');
  }

  const sitemap = read('./public/sitemap.xml');
  assert.ok(sitemap.includes('https://www.anvionitservices.in/'));
  assert.ok(sitemap.includes('https://www.anvionitservices.in/portfolio'));
  assert.ok(sitemap.includes('https://www.anvionitservices.in/contact'));
  assert.ok(sitemap.includes('https://www.anvionitservices.in/project-homeluxe'));
  assert.ok(!sitemap.includes('.html</loc>'), 'sitemap should use Vercel clean canonical URLs');
  assert.ok(!sitemap.includes('/admin'));
  assert.ok(!sitemap.includes('/login.html'));
  assert.ok(!sitemap.includes('/profile.html'));

  const robots = read('./public/robots.txt');
  assert.ok(robots.includes('User-agent: *'));
  assert.ok(robots.includes('Disallow: /api/'));
  assert.ok(robots.includes('Sitemap: https://www.anvionitservices.in/sitemap.xml'));
});

test('SEO generator only maps public pages and builds accurate organization/service markup', () => {
  assert.ok(seoScript.includes("'index.html'"));
  assert.ok(seoScript.includes("'portfolio.html'"));
  assert.ok(seoScript.includes("'contact.html'"));
  assert.ok(seoScript.includes("'@type': 'Organization'"));
  assert.ok(seoScript.includes("'@type': 'WebSite'"));
  assert.ok(seoScript.includes("'@type': 'Service'"));
  assert.ok(seoScript.includes("'@type': 'BreadcrumbList'"));
  assert.ok(seoScript.includes('noindex,nofollow'));
});


test('Vercel serves public pages statically and sends API paths to the catch-all function', () => {
  assert.equal(vercelConfig.outputDirectory, 'public');
  assert.equal(vercelConfig.buildCommand, 'npm run build');
  assert.ok(existsSync(new URL('./api/[...path].js', import.meta.url)));
  assert.ok(prepareScript.includes("const output = path.join(root, 'public')"));
  assert.ok(server.includes("app.get('/api/health'"));
  assert.ok(server.includes('[ANVION API ERROR]'));
});

test('Express backend starts in Vercel mode and answers the health endpoint', async () => {
  const originalVercel = process.env.VERCEL;
  let app;

  try {
    process.env.VERCEL = '1';
    ({ default: app } = await import('./server.js?vercel-runtime-smoke'));
  } finally {
    if (originalVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = originalVercel;
  }

  const { createServer } = await import('node:http');
  const serverInstance = createServer(app);

  await new Promise((resolve, reject) => {
    serverInstance.once('error', reject);
    serverInstance.listen(0, '127.0.0.1', resolve);
  });

  try {
    const address = serverInstance.address();
    const response = await fetch('http://127.0.0.1:' + address.port + '/api/health');
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.status, 'healthy');
    assert.ok(payload.timestamp);
  } finally {
    await new Promise((resolve, reject) => {
      serverInstance.close((error) => error ? reject(error) : resolve());
    });
  }
});


test('Shared responsive stylesheet is injected into every public page family', () => {
  assert.ok(mobileCss.includes('@media (max-width: 767px)'));
  assert.ok(mobileCss.includes('grid-template-columns: minmax(0, 1fr)'));
  assert.ok(mobileCss.includes('overflow-x: auto'));
  assert.ok(mobileCss.includes('#sidebar'));
  assert.ok(mobileCss.includes('#mobileDrawerPanel'));

  for (const file of [
    './public/index.html',
    './public/services.html',
    './public/portfolio.html',
    './public/contact.html',
    './public/login.html',
    './public/signup.html',
    './public/admin.html',
    './public/admin/login.html',
  ]) {
    const html = read(file);
    assert.ok(
      html.includes('<link rel="stylesheet" href="/css/mobile-responsive.css">'),
      file + ' should load the shared mobile stylesheet'
    );
  }
});

test('Responsive stylesheet build copies nested CSS assets into Vercel output', () => {
  assert.ok(existsSync(new URL('./public/css/mobile-responsive.css', import.meta.url)));
  assert.ok(!existsSync(new URL('./public/css/index.html', import.meta.url)), 'Legacy HTML inside css/ should not be copied');
});

test('extended admin portal routes strictly enforce requireAdminAuth', () => {
  const extendedAdminPaths = [
    '/api/admin/clients',
    '/api/admin/leads',
    '/api/admin/tasks',
    '/api/admin/payments',
    '/api/admin/audit-logs',
    '/api/admin/website-content'
  ];

  for (const p of extendedAdminPaths) {
    const regex = new RegExp(`app\\.(?:get|post|patch|delete)\\(\\s*['"]` + p.replace('/', '\\/') + `(?:\\/:[a-zA-Z0-9_]+)?['"]\\s*,\\s*([A-Za-z_$][\\w$]*)`);
    const match = server.match(regex);
    assert.ok(match, `Route ${p} should be registered in server.js`);
    assert.equal(match[1], 'requireAdminAuth', `Route ${p} must use requireAdminAuth`);
  }
});

test('client portal routes strictly require user authentication and ownership', () => {
  const portalRoutes = [
    '/api/portal/overview',
    '/api/portal/invoices',
    '/api/portal/tickets',
    '/api/portal/projects',
    '/api/portal/tasks',
    '/api/portal/payments',
    '/api/portal/profile'
  ];

  for (const p of portalRoutes) {
    const regex = new RegExp(`app\\.(?:get|post|patch)\\(\\s*['"]` + p.replace('/', '\\/') + `(?:\\/[a-zA-Z0-9_\\-]+)?['"]\\s*,\\s*([A-Za-z_$][\\w$]*)`);
    const match = server.match(regex);
    assert.ok(match, `Portal route ${p} should be registered in server.js`);
    assert.equal(match[1], 'requireAuth', `Portal route ${p} must use requireAuth`);
  }
});

test('task tracking enforces client visibility restrictions', () => {
  assert.ok(server.includes('isClientVisible === true'), 'Server must filter client-visible tasks');
  assert.ok(rules.includes("existing().get('isClientVisible', false) == true"), 'Firestore rules must check isClientVisible');
});

test('firestore rules enforce immutable audit logs and prevent role escalation', () => {
  assert.ok(rules.includes("match /adminAuditLogs/{logId}"));
  assert.ok(rules.includes("allow update, delete: if false;"));
  assert.ok(rules.includes("incoming().role == 'USER'"));
  assert.ok(rules.includes("Never allow modifying role or UID"));
});
