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

const targetProjectId = process.env.FIREBASE_PROJECT_ID || firebaseConfig?.projectId || 'pure-formula-xxjsq';

if (!getApps().length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      let rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
      if (!rawKey.startsWith('{') && fs.existsSync(rawKey)) {
        rawKey = fs.readFileSync(rawKey, 'utf8');
      }
      const serviceAccount = JSON.parse(rawKey);
      initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || targetProjectId,
      });
    } catch (e) {
      console.warn('Failed to initialize with FIREBASE_SERVICE_ACCOUNT_KEY:', e.message);
      initializeApp({
        projectId: targetProjectId,
      });
    }
  } else {
    initializeApp({
      projectId: targetProjectId,
    });
  }
}

export const adminAuth = getApps().length ? getAuth() : null;
export const adminDb = getApps().length ? getFirestore() : null;
