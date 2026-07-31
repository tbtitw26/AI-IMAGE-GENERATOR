import { connectToDatabase } from '../../../lib/mongodb';
import { getUserFromToken } from '../../../lib/auth';
import { COLLECTIONS } from '../../../config/constants';

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function GET(req) {
  const user = await getUserFromToken(req);
  if (!user) return jsonResponse({ message: 'Authentication required.' }, 401);
  return jsonResponse({ settings: user.settings || {} }, 200);
}

export async function PATCH(req) {
  const user = await getUserFromToken(req);
  if (!user) return jsonResponse({ message: 'Authentication required.' }, 401);

  const { settings } = await req.json().catch(() => ({}));
  if (!settings || typeof settings !== 'object') {
    return jsonResponse({ message: 'Settings object is required.' }, 400);
  }

  const { db } = await connectToDatabase();
  await db.collection(COLLECTIONS.USER).updateOne(
    { _id: user._id },
    { $set: { settings, updatedAt: new Date() } }
  );

  return jsonResponse({ settings }, 200);
}
