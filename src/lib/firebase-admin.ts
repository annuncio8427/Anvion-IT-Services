import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let firebaseConfig = null;
const configPath = path.join(__dirname, '../../firebase-applet-config.json');

if (fs.existsSync(configPath)) {
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    console.warn('Failed to parse firebase-applet-config.json:', err);
  }
}

if (!getApps().length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      initializeApp({
        credential: cert(serviceAccount),
        projectId: firebaseConfig?.projectId || serviceAccount.project_id,
      });
    } catch (e) {
      console.warn('Failed to initialize with FIREBASE_SERVICE_ACCOUNT_KEY:', e.message);
      initializeApp({
        projectId: firebaseConfig?.projectId || 'pure-formula-xxjsq',
      });
    }
  } else {
    initializeApp({
      projectId: firebaseConfig?.projectId || 'pure-formula-xxjsq',
    });
  }
}

export const adminAuth = getApps().length ? getAuth() : null;
export const adminDb = getApps().length ? getFirestore() : null;

