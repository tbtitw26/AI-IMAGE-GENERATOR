import { connectToDatabase } from '../../../lib/mongodb';
import { getUserFromToken } from '../../../lib/auth';
import { COLLECTIONS } from '../../../config/constants';

const EDITABLE_FIELDS = ['firstName', 'lastName', 'phone', 'dob', 'bio', 'company', 'position', 'photo', 'streetAddress', 'city', 'country', 'postalCode'];

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function PATCH(req) {
  const user = await getUserFromToken(req);
  if (!user) return jsonResponse({ message: 'Authentication required.' }, 401);

  const body = await req.json().catch(() => ({}));
  const update = { updatedAt: new Date() };

  for (const field of EDITABLE_FIELDS) {
    if (typeof body[field] === 'string') {
      update[field] = body[field];
    }
  }

  const { db } = await connectToDatabase();
  await db.collection(COLLECTIONS.USER).updateOne({ _id: user._id }, { $set: update });

  return jsonResponse({ message: 'Profile updated successfully.' }, 200);
}
