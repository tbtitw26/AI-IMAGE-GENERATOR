import { getUserFromToken } from '../../../../lib/auth';
import { connectToDatabase } from '../../../../lib/mongodb';
import { COLLECTIONS } from '../../../../config/constants';
import { getPlanInfo } from '../../../../lib/plan';

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function toSafeUser(user, imageCount) {
  return {
    id: user._id.toString(),
    email: user.email,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    phone: user.phone || '',
    dob: user.dob || '',
    bio: user.bio || '',
    company: user.company || '',
    position: user.position || '',
    photo: user.photo || '',
    streetAddress: user.streetAddress || '',
    city: user.city || '',
    country: user.country || '',
    postalCode: user.postalCode || '',
    balance: user.balance || { USD: 0, EUR: 0, GBP: 0 },
    settings: user.settings || {},
    emailVerified: Boolean(user.emailVerified),
    createdAt: user.createdAt || null,
    stats: { generations: imageCount },
    ...getPlanInfo(user),
  };
}

export async function GET(req) {
  const user = await getUserFromToken(req);
  if (!user) {
    return jsonResponse({ message: 'Invalid or expired session.' }, 401);
  }
  const { db } = await connectToDatabase();
  const imageCount = await db.collection(COLLECTIONS.IMAGES).countDocuments({ userId: user._id });
  return jsonResponse({ user: toSafeUser(user, imageCount) }, 200);
}
