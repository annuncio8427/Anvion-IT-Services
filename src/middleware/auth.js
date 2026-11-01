import { adminAuth, adminDb } from '../lib/firebase-admin.ts';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.ADMIN_JWT_SECRET;

function readBearerToken(req) {
  const value = req.headers.authorization;
  if (!value || !value.startsWith('Bearer ')) return null;
  return value.slice(7).trim() || null;
}

// Legacy admin JWTs are accepted only when an explicit secret is configured.
// They must carry the ADMIN role; Firebase ID tokens are verified separately.
function verifyLegacyAdminToken(token) {
  if (!JWT_SECRET) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    if (!decoded || decoded.role !== 'ADMIN' || !decoded.email) return null;
    return { ...decoded, isAdmin: true, role: 'ADMIN' };
  } catch {
    return null;
  }
}

export const requireAuth = async (req, res, next) => {
  const token = readBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Missing authentication token' });
  }

  const legacyAdmin = verifyLegacyAdminToken(token);
  if (legacyAdmin) {
    req.user = legacyAdmin;
    return next();
  }

  if (!adminAuth) {
    return res.status(503).json({ error: 'Authentication service unavailable' });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = {
      ...decodedToken,
      email: decodedToken.email,
      uid: decodedToken.uid,
      isAdmin: decodedToken.admin === true,
      role: decodedToken.admin === true ? 'ADMIN' : 'USER',
    };
    return next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

export const requireAdminAuth = async (req, res, next) => {
  const token = readBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Missing administrator token' });
  }

  const legacyAdmin = verifyLegacyAdminToken(token);
  if (legacyAdmin) {
    req.user = legacyAdmin;
    return next();
  }

  if (!adminAuth) {
    return res.status(503).json({ error: 'Authentication service unavailable' });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    let isAdmin = decodedToken.admin === true;

    if (!isAdmin && adminDb && decodedToken.uid) {
      const adminDoc = await adminDb.collection('admins').doc(decodedToken.uid).get();
      isAdmin = adminDoc.exists && adminDoc.data()?.role === 'ADMIN';
    }

    if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Administrator privileges required.' });
    }

    req.user = { ...decodedToken, isAdmin: true, role: 'ADMIN' };
    return next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};
