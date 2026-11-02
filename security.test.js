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

test('Vercel runs the Express app through the framework entry point', () => {
  assert.equal(packageJson.main, 'index.js');
  assert.equal(vercelConfig.framework, 'express');
  assert.equal(vercelConfig.buildCommand, 'npm run build');
  assert.ok(vercelEntry.includes("export { default } from './server.js';"));
  assert.ok(server.includes('if (!process.env.VERCEL)'));
  assert.ok(server.includes('export default app;'));
});

test('Vercel build prepares public pages and browser assets', () => {
  assert.ok(packageJson.scripts.build.includes('npm run prepare:vercel'));
  assert.ok(packageJson.scripts['prepare:vercel'].includes('scripts/prepare-vercel.mjs'));
  assert.ok(prepareScript.includes("['images', 'js', 'admin']"));
  assert.ok(prepareScript.includes('firebase-applet-config.json'));
  assert.ok(!prepareScript.includes("'src'"));
});

test('Vercel public output contains the site pages and browser assets, not backend source', () => {
  for (const file of [
    './public/index.html',
    './public/contact.html',
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
  assert.ok(staticBlock.includes("if (!process.env.VERCEL) {\\n  app.get('*'"));
});
