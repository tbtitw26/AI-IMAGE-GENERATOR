import { connectToDatabase } from '../../../../lib/mongodb';
import { getUserFromToken } from '../../../../lib/auth';
import { COLLECTIONS } from '../../../../config/constants';

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// GET → the user's most recent login events, newest first. Each login creates a
// session record; this surfaces that same record as a "Login History" entry.
export async function GET(req) {
  const user = await getUserFromToken(req);
  if (!user) return jsonResponse({ message: 'Authentication required.' }, 401);

  const { db } = await connectToDatabase();
  const sessions = await db
    .collection(COLLECTIONS.SESSIONS)
    .find({ userId: user._id })
    .sort({ createdAt: -1 })
    .limit(20)
    .toArray();

  return jsonResponse(
    {
      history: sessions.map((s) => ({
        id: s._id,
        userAgent: s.userAgent || 'Unknown device',
        ip: s.ip || null,
        createdAt: s.createdAt,
        status: s.revokedAt ? 'Signed out' : 'Active',
      })),
    },
    200
  );
}
