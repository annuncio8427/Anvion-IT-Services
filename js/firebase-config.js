/**
 * ANVION IT SERVICES - Firebase Configuration & Initialization
 * Firebase v10 Modular SDK Integration
 */

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Purge any stale custom config from previous browser sessions
try {
  localStorage.removeItem("anvion_custom_firebase_config");
} catch (e) {}

// Official Firebase Configuration for ANVION IT SERVICES
export const DEFAULT_FIREBASE_CONFIG = {
  projectId: "pure-formula-xxjsq",
  appId: "1:514186575326:web:b88af124692fd9138c714f",
  apiKey: "AIzaSyBK1B0W_bTsQ0TGKTJmKknik5IrjjBJcw4",
  authDomain: "pure-formula-xxjsq.firebaseapp.com",
  storageBucket: "pure-formula-xxjsq.firebasestorage.app",
  messagingSenderId: "514186575326",
  oAuthClientId: "514186575326-gou7sg4ft1b32dg08p4rc9v7f4usphuq.apps.googleusercontent.com"
};

/**
 * Retrieves the active Firebase configuration.
 * Supports window.__ANVION_FIREBASE_CONFIG__ for runtime environments.
 */
export function getActiveFirebaseConfig() {
  if (typeof window !== "undefined" && window.__ANVION_FIREBASE_CONFIG__ && window.__ANVION_FIREBASE_CONFIG__.projectId) {
    return window.__ANVION_FIREBASE_CONFIG__;
  }
  return DEFAULT_FIREBASE_CONFIG;
}

export function saveCustomFirebaseConfig() {
  return true;
}

export function resetFirebaseConfig() {
  try {
    localStorage.removeItem("anvion_custom_firebase_config");
    return true;
  } catch (e) {
    return false;
  }
}

// Global Firebase instance references
let firebaseApp = null;
let firebaseAuth = null;
let firestoreDb = null;
let isLive = false;

try {
  const currentConfig = getActiveFirebaseConfig();
  if (!getApps().length) {
    firebaseApp = initializeApp(currentConfig);
  } else {
    firebaseApp = getApp();
  }
  firebaseAuth = getAuth(firebaseApp);
  firestoreDb = getFirestore(firebaseApp);
  isLive = true;
  console.log("[Firebase] Successfully initialized with project:", currentConfig.projectId);
} catch (error) {
  console.warn("[Firebase] Standard initialization warning:", error.message);
  isLive = false;
}

export {
  firebaseApp as app,
  firebaseAuth as auth,
  firestoreDb as db,
  isLive as isFirebaseConnected,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp
};
