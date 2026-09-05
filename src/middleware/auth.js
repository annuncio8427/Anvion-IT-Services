import { adminAuth } from '../lib/firebase-admin.ts';
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
      req.user = decoded;
      return next();
    }
  } catch (err) {
    // If not JWT, try Firebase ID token
  }

  // Try Firebase Token if adminAuth is initialized
  if (adminAuth) {
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      req.user = decodedToken;
      return next();
    } catch (error) {
      // Fall through to 401
    }
  }

  return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
};
