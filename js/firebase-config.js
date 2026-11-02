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

// Storage key for user-configured credentials (allows easy browser-based key management)
const FIREBASE_STORAGE_KEY = "anvion_custom_firebase_config";

// Default Firebase Configuration Template
// Replace with your real Firebase Project credentials from Firebase Console -> Project Settings -> General -> Your apps
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyB3AnvionDemoCloudKey_Enterprise2026",
  authDomain: "anvion-it-services.firebaseapp.com",
  projectId: "anvion-it-services",
  storageBucket: "anvion-it-services.appspot.com",
  messagingSenderId: "948201849102",
  appId: "1:948201849102:web:48a91c0b3f81e7d92c"
};

/**
 * Retrieves the active Firebase configuration
 * Checks localStorage first for user-provided configuration, falls back to default.
 */
export function getActiveFirebaseConfig() {
  try {
    const saved = localStorage.getItem(FIREBASE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.apiKey) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("[Firebase] Could not read custom config from localStorage:", e);
  }
  return DEFAULT_FIREBASE_CONFIG;
}

/**
 * Saves custom Firebase configuration to localStorage
 */
export function saveCustomFirebaseConfig(config) {
  try {
    localStorage.setItem(FIREBASE_STORAGE_KEY, JSON.stringify(config));
    return true;
  } catch (e) {
    console.error("[Firebase] Error saving custom config:", e);
    return false;
  }
}

/**
 * Resets Firebase configuration back to default
 */
export function resetFirebaseConfig() {
  try {
    localStorage.removeItem(FIREBASE_STORAGE_KEY);
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
  console.warn("[Firebase] Standard initialization warning (demo mode enabled):", error.message);
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
