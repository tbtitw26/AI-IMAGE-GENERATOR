import { connectToDatabase } from '../../../../lib/mongodb';
import { getUserFromToken, getSessionIdFromRequest } from '../../../../lib/auth';
import { COLLECTIONS } from '../../../../config/constants';

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function toSafeSession(session, currentSessionId) {
  return {
    id: session._id,
    userAgent: session.userAgent || 'Unknown device',
    ip: session.ip || null,
    createdAt: session.createdAt,
    lastActiveAt: session.lastActiveAt || session.createdAt,
    isCurrent: session._id === currentSessionId,
  };
}

// GET → list this user's active (non-revoked) sessions, most recently active first.
export async function GET(req) {
  const user = await getUserFromToken(req);
  if (!user) return jsonResponse({ message: 'Authentication required.' }, 401);

  const currentSessionId = getSessionIdFromRequest(req);
  const { db } = await connectToDatabase();

  const sessions = await db
    .collection(COLLECTIONS.SESSIONS)
    .find({ userId: user._id, revokedAt: null })
    .sort({ lastActiveAt: -1 })
    .toArray();

  return jsonResponse(
    { sessions: sessions.map((s) => toSafeSession(s, currentSessionId)) },
    200
  );
}

// POST → { action: 'revoke', sessionId } to sign a single device out,
//        or { action: 'revoke_others' } to sign out every device but this one.
export async function POST(req) {
  const user = await getUserFromToken(req);
  if (!user) return jsonResponse({ message: 'Authentication required.' }, 401);

  const currentSessionId = getSessionIdFromRequest(req);
  const { action, sessionId } = await req.json().catch(() => ({}));
  const { db } = await connectToDatabase();
  const sessionsCollection = db.collection(COLLECTIONS.SESSIONS);

  if (action === 'revoke_self') {
    if (!currentSessionId) return jsonResponse({ message: 'No active session on this token.' }, 200);
    await sessionsCollection.updateOne(
      { _id: currentSessionId, userId: user._id },
      { $set: { revokedAt: new Date() } }
    );
    return jsonResponse({ message: 'Session signed out.' }, 200);
  }

  if (action === 'revoke_others') {
    await sessionsCollection.updateMany(
      { userId: user._id, revokedAt: null, _id: { $ne: currentSessionId } },
      { $set: { revokedAt: new Date() } }
    );
    return jsonResponse({ message: 'Signed out of all other devices.' }, 200);
  }

  if (action === 'revoke') {
    if (!sessionId) return jsonResponse({ message: 'sessionId is required.' }, 400);

    const session = await sessionsCollection.findOne({ _id: sessionId, userId: user._id });
    if (!session) return jsonResponse({ message: 'Session not found.' }, 404);

    await sessionsCollection.updateOne({ _id: sessionId }, { $set: { revokedAt: new Date() } });
    return jsonResponse(
      { message: 'Session signed out.', wasCurrent: sessionId === currentSessionId },
      200
    );
  }

  return jsonResponse({ message: 'Unknown action.' }, 400);
}
