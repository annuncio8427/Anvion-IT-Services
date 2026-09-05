import { adminAuth, adminDb } from '../lib/firebase-admin.ts';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'anvion_secure_super_secret_jwt_key_2026';

export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing authentication token' });
  }

  const token = authHeader.split('Bearer ')[1];

  // Try JWT Admin Token first
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded && decoded.email) {
      req.user = { ...decoded, isAdmin: true, role: 'ADMIN' };
      return next();
    }
  } catch (err) {
    // If not JWT, try Firebase ID token
  }

  // Try Firebase Token if adminAuth is initialized
  if (adminAuth) {
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      const isAdmin = Boolean(decodedToken.admin);
      req.user = {
        ...decodedToken,
        email: decodedToken.email,
        uid: decodedToken.uid,
        isAdmin,
        role: isAdmin ? 'ADMIN' : 'USER',
      };
      return next();
    } catch (error) {
      // Fall through to 401
    }
  }

  return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
};

export const requireAdminAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing administrator token' });
  }

  const token = authHeader.split('Bearer ')[1];

  // 1. Check legacy/fallback Admin JWT
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded && decoded.email) {
      req.user = { ...decoded, isAdmin: true, role: 'ADMIN' };
      return next();
    }
  } catch (err) {}

  // 2. Authoritative Firebase Custom Claims verification
  if (adminAuth) {
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);

      if (decodedToken.admin === true) {
        req.user = {
          ...decodedToken,
          isAdmin: true,
          role: 'ADMIN',
        };
        return next();
      }

      // Check fallback admin collection in Firestore
      if (adminDb && decodedToken.uid) {
        const adminDoc = await adminDb.collection('admins').doc(decodedToken.uid).get();
        if (adminDoc.exists) {
          req.user = {
            ...decodedToken,
            isAdmin: true,
            role: 'ADMIN',
          };
          return next();
        }
      }

      return res.status(403).json({ error: 'Forbidden: Administrator privileges required.' });
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }
  }

  return res.status(401).json({ error: 'Unauthorized: Security provider unavailable' });
};

