/**
 * ANVION IT SERVICES - Authentication & User State Service
 * Connects with Firebase Auth v10 + Firestore
 */

import {
  auth,
  db,
  isFirebaseConnected,
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
} from "./firebase-config.js";

const LOCAL_USER_KEY = "anvion_active_user";
const LOCAL_INQUIRIES_KEY = "anvion_user_inquiries";

// Pre-packaged test personas for testing
export const DEMO_USERS = {
  client: {
    uid: "demo-client-001",
    email: "client@enterprise.com",
    displayName: "Alexander Vance",
    role: "Enterprise Client",
    company: "Vance Digital Logistics",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    phone: "+1 (555) 234-8901",
    isDemo: true
  },
  admin: {
    uid: "demo-admin-002",
    email: "admin@anvion.com",
    displayName: "Dhilip Raj (Director)",
    role: "Managing Director",
    company: "ANVION IT SERVICES",
    avatar: "images/dhilip.png",
    phone: "+91 98400 12345",
    isDemo: true
  }
};

/**
 * Get cached user from localStorage for zero-flicker UI
 */
export function getCachedUser() {
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Save cached user to localStorage
 */
function setCachedUser(user) {
  if (user) {
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(LOCAL_USER_KEY);
  }
  // Notify other tabs / components
  window.dispatchEvent(new CustomEvent("anvion:auth-changed", { detail: { user } }));
}

/**
 * Sign In with Email and Password
 */
export async function loginWithEmail(email, password, remember = true) {
  try {
    if (auth && isFirebaseConnected) {
      try {
        await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const user = formatUserData(cred.user);
        
        // Fetch extra profile from Firestore if available
        try {
          if (db) {
            const userRef = doc(db, "users", cred.user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              Object.assign(user, userSnap.data());
            }
          }
        } catch (dbErr) {
          console.warn("[Firestore] User doc read notice:", dbErr.message);
        }

        setCachedUser(user);
        return { success: true, user, isDemo: false };
      } catch (fbError) {
        // If error is invalid API key or network restricted, fallback to local demo auth for seamless UX
        if (fbError.code === "auth/api-key-not-valid" || fbError.code === "auth/network-request-failed") {
          console.warn("[Firebase] Falling back to simulated login due to demo/test key:", fbError.message);
          return fallbackLogin(email, password);
        }
        throw fbError;
      }
    } else {
      return fallbackLogin(email, password);
    }
  } catch (error) {
    console.error("[Auth] Login error:", error);
    return { success: false, error: formatAuthError(error) };
  }
}

/**
 * Sign Up with Full Name, Email, and Password
 */
export async function signupWithEmail(fullName, email, password) {
  try {
    if (auth && isFirebaseConnected) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        
        // Update Firebase profile
        await updateProfile(cred.user, {
          displayName: fullName
        });

        const user = formatUserData(cred.user, fullName);

        // Store user document in Firestore
        try {
          if (db) {
            await setDoc(doc(db, "users", cred.user.uid), {
              uid: cred.user.uid,
              displayName: fullName,
              email: email,
              role: "Client",
              createdAt: serverTimestamp()
            });
          }
        } catch (dbErr) {
          console.warn("[Firestore] Write doc warning:", dbErr.message);
        }

        setCachedUser(user);
        return { success: true, user, isDemo: false };
      } catch (fbError) {
        if (fbError.code === "auth/api-key-not-valid" || fbError.code === "auth/network-request-failed") {
          console.warn("[Firebase] Simulated account creation:", fbError.message);
          return fallbackSignup(fullName, email);
        }
        throw fbError;
      }
    } else {
      return fallbackSignup(fullName, email);
    }
  } catch (error) {
    console.error("[Auth] Signup error:", error);
    return { success: false, error: formatAuthError(error) };
  }
}

/**
 * Sign In with Google Provider
 */
export async function loginWithGoogle() {
  try {
    if (auth && isFirebaseConnected) {
      try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        const cred = await signInWithPopup(auth, provider);
        const user = formatUserData(cred.user);
        
        // Save to Firestore
        try {
          if (db) {
            await setDoc(doc(db, "users", cred.user.uid), {
              uid: cred.user.uid,
              displayName: cred.user.displayName,
              email: cred.user.email,
              avatar: cred.user.photoURL,
              lastLogin: serverTimestamp()
            }, { merge: true });
          }
        } catch (e) {
          // Ignore firestore warnings
        }

        setCachedUser(user);
        return { success: true, user, isDemo: false };
      } catch (fbError) {
        if (fbError.code === "auth/api-key-not-valid" || fbError.code === "auth/popup-closed-by-user") {
          if (fbError.code === "auth/popup-closed-by-user") {
            return { success: false, error: "Google sign-in popup was cancelled." };
          }
          console.warn("[Firebase] Fallback to demo Google persona:", fbError.message);
          return fallbackGoogleLogin();
        }
        throw fbError;
      }
    } else {
      return fallbackGoogleLogin();
    }
  } catch (error) {
    return { success: false, error: formatAuthError(error) };
  }
}

/**
 * Send Password Reset Email
 */
export async function resetPassword(email) {
  try {
    if (auth && isFirebaseConnected) {
      try {
        await sendPasswordResetEmail(auth, email);
        return { success: true, message: "Password reset link sent! Check your inbox." };
      } catch (fbError) {
        if (fbError.code === "auth/api-key-not-valid") {
          return { success: true, message: "Demo mode: Password reset email simulated for " + email };
        }
        throw fbError;
      }
    } else {
      return { success: true, message: "Demo mode: Password reset email simulated for " + email };
    }
  } catch (error) {
    return { success: false, error: formatAuthError(error) };
  }
}

/**
 * Fast One-Click Demo Mode Login
 */
export function loginDemo(role = "client") {
  const user = DEMO_USERS[role] || DEMO_USERS.client;
  setCachedUser(user);
  return { success: true, user, isDemo: true };
}

/**
 * Logout User
 */
export async function logoutUser() {
  try {
    if (auth) {
      await signOut(auth);
    }
  } catch (e) {
    console.warn("[Auth] Logout notice:", e.message);
  }
  setCachedUser(null);
  return { success: true };
}

/**
 * Listen for Auth changes across app
 */
export function onAuthChange(callback) {
  // 1. Initial trigger with cached user
  const initial = getCachedUser();
  callback(initial);

  // 2. Listen to Firebase native auth if available
  if (auth) {
    try {
      onAuthStateChanged(auth, (fbUser) => {
        if (fbUser) {
          const user = formatUserData(fbUser);
          setCachedUser(user);
          callback(user);
        } else {
          // If cached user is a demo user, don't overwrite with null unless explicit logout
          const current = getCachedUser();
          if (!current || !current.isDemo) {
            setCachedUser(null);
            callback(null);
          }
        }
      });
    } catch (e) {
      console.warn("[Auth] State listener note:", e);
    }
  }

  // 3. Listen to local custom event
  const handler = (e) => {
    callback(e.detail.user);
  };
  window.addEventListener("anvion:auth-changed", handler);

  return () => {
    window.removeEventListener("anvion:auth-changed", handler);
  };
}

/**
 * Submit Project Inquiry to Firestore or LocalStorage
 */
export async function submitProjectInquiry(inquiryData) {
  const activeUser = getCachedUser();
  const inquiry = {
    ...inquiryData,
    userId: activeUser ? activeUser.uid : "guest",
    userEmail: activeUser ? activeUser.email : inquiryData.email,
    submittedAt: new Date().toISOString(),
    status: "Under Review"
  };

  try {
    if (db && isFirebaseConnected) {
      try {
        await addDoc(collection(db, "inquiries"), {
          ...inquiry,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.warn("[Firestore] Saved locally:", err.message);
      }
    }
  } catch (e) {}

  // Save to local inquiries list
  try {
    const list = getStoredInquiries();
    list.unshift(inquiry);
    localStorage.setItem(LOCAL_INQUIRIES_KEY, JSON.stringify(list));
  } catch (e) {}

  return { success: true, inquiry };
}

/**
 * Retrieve User Inquiries
 */
export function getStoredInquiries() {
  try {
    const raw = localStorage.getItem(LOCAL_INQUIRIES_KEY);
    return raw ? JSON.parse(raw) : [
      {
        id: "INQ-2026-904",
        name: "Alexander Vance",
        email: "client@enterprise.com",
        projectType: "Custom Software",
        serviceCategory: "Cloud Infrastructure",
        budget: "$50k - $250k",
        scope: "Global logistics telemetry dashboard with real-time fleet analytics and enterprise SSO integration.",
        status: "In Progress",
        submittedAt: "2026-10-24T10:15:00Z"
      },
      {
        id: "INQ-2026-881",
        name: "Alexander Vance",
        email: "client@enterprise.com",
        projectType: "Mobile Application",
        serviceCategory: "Cybersecurity",
        budget: "< $50k",
        scope: "Zero-trust biometric mobile authentication portal for field engineers.",
        status: "Completed",
        submittedAt: "2026-09-12T14:30:00Z"
      }
    ];
  } catch (e) {
    return [];
  }
}

// Helpers
function formatUserData(fbUser, overrideName = null) {
  return {
    uid: fbUser.uid,
    email: fbUser.email,
    displayName: overrideName || fbUser.displayName || fbUser.email.split("@")[0],
    avatar: fbUser.photoURL || null,
    role: "Client",
    company: "Enterprise Partner",
    phone: fbUser.phoneNumber || "",
    isDemo: false
  };
}

function fallbackLogin(email, password) {
  const name = email.split("@")[0];
  const user = {
    uid: "usr-" + Math.random().toString(36).substr(2, 9),
    email: email,
    displayName: name.charAt(0).toUpperCase() + name.slice(1),
    role: email.includes("admin") ? "Administrator" : "Client",
    company: "Partner Enterprise",
    avatar: null,
    isDemo: true
  };
  setCachedUser(user);
  return { success: true, user, isDemo: true };
}

function fallbackSignup(fullName, email) {
  const user = {
    uid: "usr-" + Math.random().toString(36).substr(2, 9),
    email: email,
    displayName: fullName,
    role: "Client",
    company: "New Organization",
    avatar: null,
    isDemo: true
  };
  setCachedUser(user);
  return { success: true, user, isDemo: true };
}

function fallbackGoogleLogin() {
  const user = {
    uid: "goog-" + Math.random().toString(36).substr(2, 9),
    email: "alexander.vance@gmail.com",
    displayName: "Alexander Vance",
    role: "Client",
    company: "Google Workspace Enterprise",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    isDemo: true
  };
  setCachedUser(user);
  return { success: true, user, isDemo: true };
}

function formatAuthError(error) {
  if (!error) return "An unexpected error occurred.";
  const code = error.code || "";
  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password combination.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Please log in instead.";
    case "auth/weak-password":
      return "Password is too weak. Please choose at least 6 characters.";
    case "auth/popup-closed-by-user":
      return "Google sign-in popup was closed before finishing.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please wait a few moments and try again.";
    default:
      return error.message || "Authentication failed. Please try again.";
  }
}
