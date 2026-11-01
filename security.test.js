import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const server = read('./server.js');
const auth = read('./src/middleware/auth.js');
const client = read('./js/firebase-client.js');
const rules = read('./firestore.rules');
const database = read('./src/db/index.ts');

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
  assert.match(server, /const JWT_SECRET = process\.env\.ADMIN_JWT_SECRET;/);
  assert.doesNotMatch(server, /anvion_secure_super_secret_jwt_key_2026/);
  assert.match(auth, /if \(!JWT_SECRET\) return null;/);
  assert.match(auth, /decoded\.role !== 'ADMIN'/);
});

test('client enquiry history uses the authenticated identity, not a query email', () => {
  const route = server.match(/app\.get\('\/api\/my-enquiries',[\s\S]*?\n\}\);/);
  assert.ok(route, 'my-enquiries route should exist');
  assert.match(route[0], /requireAuth/);
  assert.match(route[0], /req\.user\?\.email/);
  assert.doesNotMatch(route[0], /req\.query\.email/);
});

test('public project and service endpoints expose published content only', () => {
  assert.match(server, /eq\(projects\.status, 'published'\)/);
  assert.match(server, /eq\(services\.status, 'published'\)/);
});

test('static hosting blocks private uploads and backend source', () => {
  assert.match(server, /src\|node_modules\|uploads/);
  assert.match(server, /server\\?\.js/);
});

test('admin fallback checks require the explicit ADMIN role in backend, client and rules', () => {
  assert.match(auth, /adminDoc\.data\(\)\?\.role === 'ADMIN'/);
  assert.match(client, /adminDoc\.data\(\)\?\.role === 'ADMIN'/);
  assert.match(rules, /get\([^\n]+admins\/\$\(request\.auth\.uid\)[^\n]+\)\.data\.role == 'ADMIN'/);
});

test('PostgreSQL connection honors SQL_PORT', () => {
  assert.match(database, /port: Number\(process\.env\.SQL_PORT \|\| 5432\)/);
});
