#!/usr/bin/env node

/**
 * ANVION IT SERVICES - Authoritative Admin Bootstrap & Custom Claims Tool
 *
 * Usage:
 *   node scripts/set-admin.js <email_or_uid>
 * Example:
 *   node scripts/set-admin.js admin@anvion.in
 *
 * This trusted administrative script grants authoritative Firebase Custom Claims:
 *   { admin: true }
 * and synchronizes the trusted /admins/{uid} Firestore document.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.join(__dirname, '../firebase-applet-config.json');
let firebaseConfig = {};

if (fs.existsSync(configPath)) {
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    console.error('Failed reading firebase-applet-config.json:', err);
  }
}

// Service account option if present in environment
let app;
if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  app = initializeApp({
    credential: cert(serviceAccount),
    projectId: firebaseConfig.projectId || serviceAccount.project_id,
  });
} else {
  // Default project credentials
  app = initializeApp({
    projectId: firebaseConfig.projectId || 'pure-formula-xxjsq',
  });
}

const auth = getAuth(app);
const db = getFirestore(app);

async function setAdminRole(target) {
  if (!target) {
    console.error('Error: Please specify the user email or UID.');
    console.log('Usage: node scripts/set-admin.js <email_or_uid>');
    process.exit(1);
  }

  try {
    let user;
    if (target.includes('@')) {
      console.log(`[ANVION Admin] Looking up user by email: ${target}...`);
      user = await auth.getUserByEmail(target.trim().toLowerCase());
    } else {
      console.log(`[ANVION Admin] Looking up user by UID: ${target}...`);
      user = await auth.getUser(target.trim());
    }

    console.log(`[ANVION Admin] Found user: ${user.email} (UID: ${user.uid})`);

    // 1. Assign Authoritative Custom Claims
    console.log('[ANVION Admin] Granting authoritative Custom Claim { admin: true }...');
    await auth.setCustomUserClaims(user.uid, { admin: true });

    // 2. Synchronize trusted Firestore admins collection
    console.log('[ANVION Admin] Synchronizing /admins/{uid} in Cloud Firestore...');
    await db.collection('admins').doc(user.uid).set({
      uid: user.uid,
      email: user.email,
      role: 'ADMIN',
      addedAt: new Date().toISOString(),
    }, { merge: true });

    // 3. Update /users/{uid} document if exists
    try {
      await db.collection('users').doc(user.uid).set({
        role: 'ADMIN',
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (e) {
      console.warn('Could not update users collection (document may not exist yet):', e.message);
    }

    console.log('\nSUCCESS! Administrator privileges successfully granted:');
    console.log(`  - Target UID:   ${user.uid}`);
    console.log(`  - Target Email: ${user.email}`);
    console.log(`  - Custom Claim: { admin: true }`);
    console.log(`  - Firestore:    /admins/${user.uid} registered.`);
    console.log('\nThe user must sign out and sign back in for the ID token custom claims to take effect.\n');
  } catch (error) {
    console.error('\nFailed to assign admin privileges:', error.message);
    process.exit(1);
  }
}

const targetArg = process.argv[2];
setAdminRole(targetArg);
