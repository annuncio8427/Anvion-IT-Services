/**
 * ANVION IT SERVICES - Authentication & User State Service
 * Connects directly with Firebase Auth v10 + Firestore
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

// Pre-configured role templates
export const DEMO_USERS = {};

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
 * Connects with Firebase Authentication and authoritative Command Center API
 */
export async function loginWithEmail(email, password, remember = true) {
  const cleanEmail = (email || "").trim().toLowerCase();

  // 1. Check for Authoritative Administrator Login
  if (cleanEmail === "annuncio8427@gmail.com" && password === "Annuncio@08") {
    try {
      const apiRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password })
      });
      if (apiRes.ok) {
        const apiData = await apiRes.json();
        if (apiData.token) {
          localStorage.setItem("anvion_admin_jwt", apiData.token);
        }
      }
    } catch (e) {
      console.warn("[Auth] Backend login sync notice:", e.message);
    }

    const adminUser = {
      uid: "admin-annuncio-01",
      email: cleanEmail,
      displayName: "Annuncio (Admin)",
      role: "ADMIN",
      isAdmin: true,
      company: "ANVION IT SERVICES",
      phone: "+91 9150270802",
      isDemo: false
    };
    setCachedUser(adminUser);
    return { success: true, user: adminUser, isAdmin: true, isDemo: false };
  }

  // 2. Client Authentication via Firebase Auth
  try {
    if (auth && isFirebaseConnected) {
      try {
        await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
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
        return { success: true, user, isAdmin: user.role === "ADMIN", isDemo: false };
      } catch (fbError) {
        // If Firebase email/password provider is disabled on console, inform clearly
        if (fbError.code === "auth/operation-not-allowed" || (fbError.message && fbError.message.includes("PASSWORD_LOGIN_DISABLED"))) {
          return {
            success: false,
            error: "Email/Password sign-in is disabled in your Firebase console. Please enable Email/Password provider under Authentication -> Sign-in method, or sign in using Google."
          };
        }
        throw fbError;
      }
    } else {
      return { success: false, error: "Firebase authentication service is connecting. Please check your connection." };
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
  const cleanEmail = (email || "").trim().toLowerCase();
  try {
    if (auth && isFirebaseConnected) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        
        // Update Firebase profile
        await updateProfile(cred.user, {
          displayName: fullName
        });

        const user = formatUserData(cred.user, fullName);

        // Store user document in Firestore (/users/{userId})
        try {
          if (db) {
            await setDoc(doc(db, "users", cred.user.uid), {
              uid: cred.user.uid,
              name: fullName,
              displayName: fullName,
              email: cleanEmail,
              role: "USER",
              createdAt: serverTimestamp()
            });
          }
        } catch (dbErr) {
          console.warn("[Firestore] Write user doc notice:", dbErr.message);
        }

        setCachedUser(user);
        return { success: true, user, isDemo: false };
      } catch (fbError) {
        if (fbError.code === "auth/operation-not-allowed" || (fbError.message && fbError.message.includes("PASSWORD_LOGIN_DISABLED"))) {
          return {
            success: false,
            error: "Email/Password registration is disabled in Firebase console. Please enable Email/Password provider under Authentication -> Sign-in method, or sign in using Google."
          };
        }
        throw fbError;
      }
    } else {
      return { success: false, error: "Firebase connection is unavailable. Please check your connection." };
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
              role: cred.user.email?.toLowerCase() === "annuncio8427@gmail.com" ? "ADMIN" : "USER",
              lastLogin: serverTimestamp()
            }, { merge: true });
          }
        } catch (e) {
          // Ignore firestore warnings
        }

        if (cred.user.email?.toLowerCase() === "annuncio8427@gmail.com") {
          user.role = "ADMIN";
          user.isAdmin = true;
        }

        setCachedUser(user);
        return { success: true, user, isAdmin: user.isAdmin || user.role === "ADMIN", isDemo: false };
      } catch (fbError) {
        if (fbError.code === "auth/popup-closed-by-user") {
          return { success: false, error: "Google sign-in popup was closed before finishing." };
        }
        throw fbError;
      }
    } else {
      return { success: false, error: "Firebase service is not initialized." };
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
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      return { success: true, message: "Password reset link sent! Check your inbox." };
    } else {
      return { success: false, error: "Firebase authentication service is not connected." };
    }
  } catch (error) {
    return { success: false, error: formatAuthError(error) };
  }
}

/**
 * Legacy quick login compatibility
 */
export function loginDemo(role = "client") {
  return { success: false, error: "Demo logins are disabled in production. Please sign in with real credentials." };
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
  localStorage.removeItem("anvion_admin_jwt");
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
          if (fbUser.email?.toLowerCase() === "annuncio8427@gmail.com") {
            user.role = "ADMIN";
            user.isAdmin = true;
          }
          setCachedUser(user);
          callback(user);
        } else {
          const current = getCachedUser();
          if (!current || !current.isAdmin) {
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
 * Submit Project Inquiry to Firestore and LocalStorage
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
        await addDoc(collection(db, "projectEnquiries"), {
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
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

// Helpers
function formatUserData(fbUser, overrideName = null) {
  const cleanEmail = fbUser.email || "";
  const isAdmin = cleanEmail.toLowerCase() === "annuncio8427@gmail.com";
  return {
    uid: fbUser.uid,
    email: cleanEmail,
    displayName: overrideName || fbUser.displayName || cleanEmail.split("@")[0],
    avatar: fbUser.photoURL || null,
    role: isAdmin ? "ADMIN" : "Client",
    company: isAdmin ? "ANVION IT SERVICES" : "Enterprise Client",
    phone: fbUser.phoneNumber || "",
    isAdmin: isAdmin,
    isDemo: false
  };
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
