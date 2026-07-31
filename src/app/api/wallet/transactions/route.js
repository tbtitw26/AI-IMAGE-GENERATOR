import { connectToDatabase } from '../../../../lib/mongodb';
import { getUserFromToken } from '../../../../lib/auth';
import { COLLECTIONS } from '../../../../config/constants';

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function GET(req) {
  const user = await getUserFromToken(req);
  if (!user) return jsonResponse({ message: 'Authentication required.' }, 401);

  const { db } = await connectToDatabase();
  const doc = await db
    .collection(COLLECTIONS.USER)
    .findOne({ _id: user._id }, { projection: { transactions: 1, balance: 1 } });

  const transactions = (doc?.transactions || [])
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return jsonResponse({ transactions, balance: doc?.balance || { USD: 0, EUR: 0, GBP: 0 } }, 200);
}
