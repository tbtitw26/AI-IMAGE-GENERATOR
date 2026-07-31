import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from './mongodb';
import { COLLECTIONS } from '../config/constants';

const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || (process.env.NODE_ENV !== 'production' ? 'development-secret' : '');

export function createAuthToken(payload) {
  if (!secret) {
    throw new Error('Please define JWT_SECRET or NEXTAUTH_SECRET in .env.local');
  }
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

export function verifyAuthToken(token) {
  if (!secret || !token) {
    return null;
  }
  try {
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}

export async function getUserFromToken(request) {
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;

  try {
    const payload = verifyAuthToken(token);
    if (!payload) return null;
    const { db } = await connectToDatabase();

    let user = null;
    try {
      user = await db.collection(COLLECTIONS.USER).findOne({ _id: new ObjectId(payload.sub) });
    } catch {
      user = await db.collection(COLLECTIONS.USER).findOne({ _id: payload.sub });
    }
    if (!user) return null;

    // If this token was issued with a session id (jti), make sure that session
    // hasn't been revoked from the Security page ("Sign out" / "Sign out of all
    // other devices"). Tokens issued before this feature existed have no jti and
    // are left untouched for backwards compatibility.
    if (payload.jti) {
      try {
        const session = await db.collection(COLLECTIONS.SESSIONS).findOne({ _id: payload.jti });
        if (session && session.revokedAt) {
          return null;
        }
        if (session) {
          db.collection(COLLECTIONS.SESSIONS)
            .updateOne({ _id: payload.jti }, { $set: { lastActiveAt: new Date() } })
            .catch(() => {});
        }
      } catch {
        // If the session lookup itself fails, don't lock the user out of the app.
      }
    }

    return user;
  } catch (error) {
    return null;
  }
}

/**
 * Extracts the session id (jti) from a request's bearer token, if present,
 * without re-hitting the database. Used by the security/sessions endpoints
 * to figure out which session is "this device".
 */
export function getSessionIdFromRequest(request) {
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  const payload = verifyAuthToken(token);
  return payload?.jti || null;
}
