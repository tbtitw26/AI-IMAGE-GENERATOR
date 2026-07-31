import bcrypt from 'bcryptjs';
import { connectToDatabase } from '../../../../lib/mongodb';
import { getUserFromToken } from '../../../../lib/auth';
import { COLLECTIONS } from '../../../../config/constants';

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(req) {
  const user = await getUserFromToken(req);
  if (!user) return jsonResponse({ message: 'Authentication required.' }, 401);

  const { currentPassword, newPassword } = await req.json().catch(() => ({}));

  if (!currentPassword || !newPassword) {
    return jsonResponse({ message: 'Current and new password are required.' }, 400);
  }
  if (newPassword.length < 8) {
    return jsonResponse({ message: 'New password must be at least 8 characters.' }, 400);
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return jsonResponse({ message: 'Current password is incorrect.' }, 401);
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  const { db } = await connectToDatabase();
  await db.collection(COLLECTIONS.USER).updateOne(
    { _id: user._id },
    { $set: { password: hashed, updatedAt: new Date() } }
  );

  return jsonResponse({ message: 'Password updated successfully.' }, 200);
}
