/**
 * ANVION IT SERVICES - Enterprise Firebase Client Library
 *
 * Integrates Firebase Authentication, Cloud Firestore, Firebase Storage,
 * and Firebase App Check with Zero-Trust RBAC and strict error handling.
 */

// Import Firebase Modular SDK via CDN ESM for client-side web compatibility
import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  getIdTokenResult,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
} from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js';
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
  getDocFromServer,
} from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-storage.js';
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
} from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-app-check.js';

// Configuration Loader
let config = null;

// Fetch config from server or fallback
async function loadFirebaseConfig() {
  if (config) return config;
  try {
    const res = await fetch('/api/firebase-config');
    if (res.ok) {
      config = await res.json();
      return config;
    }
  } catch (e) {
    // Fallback to static applet config
  }

  try {
    const staticRes = await fetch('/firebase-applet-config.json');
    if (staticRes.ok) {
      config = await staticRes.json();
      return config;
    }
  } catch (e) {
    console.warn('Could not load static firebase-applet-config.json');
  }

  // Environment fallback
  config = {
    projectId: "pure-formula-xxjsq",
    appId: "1:514186575326:web:b88af124692fd9138c714f",
    apiKey: "AIzaSyBK1B0W_bTsQ0TGKTJmKknik5IrjjBJcw4",
    authDomain: "pure-formula-xxjsq.firebaseapp.com",
    storageBucket: "pure-formula-xxjsq.firebasestorage.app",
    messagingSenderId: "514186575326",
    oAuthClientId: "514186575326-gou7sg4ft1b32dg08p4rc9v7f4usphuq.apps.googleusercontent.com"
  };
  return config;
}

const firebaseConfig = await loadFirebaseConfig();

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Firebase App Check if site key is configured
export let appCheck = null;
if (typeof window !== 'undefined' && firebaseConfig.recaptchaSiteKey) {
  try {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(firebaseConfig.recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
    console.log('[ANVION AppCheck] Initialized successfully');
  } catch (err) {
    console.warn('[ANVION AppCheck] Provider skipped or in local dev mode:', err.message);
  }
}

// ==========================================
// ERROR HANDLER (Conforming to FirestoreErrorInfo)
// ==========================================
export const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
};

export function handleFirestoreError(error, operationType, path) {
  const currentUser = auth.currentUser;
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path: path || null,
    authInfo: {
      userId: currentUser?.uid || null,
      email: currentUser?.email || null,
      emailVerified: currentUser?.emailVerified || false,
      isAnonymous: currentUser?.isAnonymous || false,
      providerInfo: currentUser?.providerData?.map((p) => ({
        providerId: p.providerId,
        email: p.email,
      })) || [],
    },
  };
  console.error('[ANVION Firestore Security Error]:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[ANVION Firebase] Client offline. Check network configuration.');
    }
  }
}
testFirestoreConnection();

// ==========================================
// AUTHENTICATION UTILITIES
// ==========================================

/**
 * Register new user with strict client-side validation and default role: USER
 */
export async function registerUser({ name, email, phone, password }) {
  // Validate required inputs
  if (!name || !email || !password) {
    throw new Error('Name, email, and password are required.');
  }

  // Strict Password Strength Rules
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()[\]{}|:;<>.~_-])[A-Za-z\d@$!%*?&^#()[\]{}|:;<>.~_-]{8,}$/;
  if (!passwordRegex.test(password)) {
    throw new Error('Password must be at least 8 characters long and include an uppercase letter, lowercase letter, number, and special character.');
  }

  try {
    // 1. Create account in Firebase Authentication
    const credential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    const user = credential.user;

    // 2. Update display name in Firebase Auth
    await updateProfile(user, { displayName: name.trim() });

    // 3. Optional: Send email verification
    try {
      await sendEmailVerification(user);
    } catch (e) {
      console.warn('Could not send verification email immediately:', e);
    }

    // 4. Create authoritative user profile document in Firestore (strictly role = 'USER')
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      uid: user.uid,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : '',
      role: 'USER', // FORBIDDEN to set ADMIN on signup!
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return { user, role: 'USER' };
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('An account with this email address already exists. Please sign in instead.');
    }
    if (error.code === 'auth/invalid-email') {
      throw new Error('The email address provided is invalid.');
    }
    if (error.code === 'auth/weak-password') {
      throw new Error('The password is too weak. Please use a stronger password.');
    }
    throw error;
  }
}

/**
 * Login user and inspect Custom Claims / Roles
 */
export async function loginUser(email, password) {
  try {
    const credential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    const user = credential.user;

    // Force refresh token to obtain latest Custom Claims
    const tokenResult = await getIdTokenResult(user, true);
    const isAdmin = Boolean(tokenResult.claims.admin);

    // If not reflected in claim, check Firestore admins collection as fallback
    let isDbAdmin = false;
    try {
      const adminDoc = await getDoc(doc(db, 'admins', user.uid));
      isDbAdmin = adminDoc.exists() && adminDoc.data().role === 'ADMIN';
    } catch (e) {
      // Ignored if permissions restrict
    }

    const effectiveRole = (isAdmin || isDbAdmin) ? 'ADMIN' : 'USER';

    return {
      user,
      isAdmin: effectiveRole === 'ADMIN',
      role: effectiveRole,
      token: tokenResult.token,
    };
  } catch (error) {
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      throw new Error('Invalid email or password.');
    }
    if (error.code === 'auth/too-many-requests') {
      throw new Error('Access to this account has been temporarily disabled due to many failed login attempts. Please reset your password or try again later.');
    }
    throw error;
  }
}

/**
 * Google Sign-in popup with role assignment
 */
export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Ensure user document exists in Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists()) {
      await setDoc(userDocRef, {
        uid: user.uid,
        name: user.displayName || 'Google User',
        email: user.email || '',
        phone: user.phoneNumber || '',
        role: 'USER',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    const tokenResult = await getIdTokenResult(user, true);
    const isAdmin = Boolean(tokenResult.claims.admin);

    return {
      user,
      isAdmin,
      role: isAdmin ? 'ADMIN' : 'USER',
      token: tokenResult.token,
    };
  } catch (error) {
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in popup was closed before completing authentication.');
    }
    throw error;
  }
}

/**
 * Sign out and clear local session state
 */
export async function logoutUser() {
  try {
    await signOut(auth);
    localStorage.removeItem('anvion_admin_jwt');
    sessionStorage.clear();
    window.location.href = '/';
  } catch (error) {
    console.error('Logout failed:', error);
  }
}

/**
 * Send password reset email (without disclosing if account exists)
 */
export async function resetPassword(email) {
  if (!email || !email.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }
  try {
    await sendPasswordResetEmail(auth, email.trim().toLowerCase());
  } catch (error) {
    // Suppress user-not-found to prevent email enumeration
    if (error.code !== 'auth/user-not-found') {
      console.warn('Password reset notice:', error.code);
    }
  }
}

/**
 * Check if the current authenticated user is an authorized Administrator
 */
export async function checkAdminAuthorization(user = auth.currentUser) {
  if (!user) return false;
  try {
    const tokenResult = await getIdTokenResult(user, false);
    if (tokenResult.claims && tokenResult.claims.admin === true) {
      return true;
    }
    // Check fallback admin document in Firestore
    const adminDoc = await getDoc(doc(db, 'admins', user.uid));
    return adminDoc.exists();
  } catch (e) {
    return false;
  }
}

/**
 * Submit Project Enquiry with optional file attachment & user correlation
 */
export async function submitProjectEnquiry(formData) {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch('/api/project-enquiries', {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to submit project inquiry.');
  }

  return await res.json();
}

/**
 * Submit Contact Message
 */
export async function submitContactMessage(payload) {
  const res = await fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to submit contact message.');
  }

  return await res.json();
}

/**
 * Upload Media File to Firebase Storage
 */
export async function uploadMediaFile(file, folder = 'uploads') {
  if (!file) throw new Error('No file provided for upload.');

  // Validate size (10MB)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File exceeds the 10MB maximum size limit.');
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${folder}/${Date.now()}_${safeName}`;
  const fileRef = ref(storage, path);

  const snapshot = await uploadBytesResumable(fileRef, file);
  const downloadUrl = await getDownloadURL(snapshot.ref);

  return {
    downloadUrl,
    path,
    filename: file.name,
    size: file.size,
    type: file.type,
  };
}

/**
 * Fetch enquiries associated with the current user
 */
export async function getUserEnquiries() {
  const user = auth.currentUser;
  if (!user) return [];

  // Try fetching from backend endpoint with auth
  try {
    const token = await user.getIdToken();
    const res = await fetch(`/api/my-enquiries?email=${encodeURIComponent(user.email)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (e) {
    console.warn('Backend query for enquiries failed, checking Firestore directly:', e);
  }

  // Fallback to Firestore client query
  try {
    const q = query(
      collection(db, 'projectEnquiries'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(25)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (fe) {
    return [];
  }
}

export {
  // Firestore primitives
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
  // Storage primitives
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  // Auth listener
  onAuthStateChanged,
};

