import bcrypt from 'bcryptjs';
import { connectToDatabase } from './mongodb';
import { COLLECTIONS } from '../config/constants';

export async function ensureTestAccount() {
  const isTestMode = process.env.TEST_MODE === 'true';
  if (!isTestMode) return;

  const email = process.env.TEST_ACCOUNT_EMAIL || 'test@aetherframe.ai';
  const password = process.env.TEST_ACCOUNT_PASSWORD || 'Test1234!';
  const initialBalance = 1000000;

  const hashedPassword = await bcrypt.hash(password, 10);
  const { db } = await connectToDatabase();

  await db.collection(COLLECTIONS.USER).updateOne(
    { email: email.toLowerCase() },
    {
      $set: {
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        emailVerified: true,
        agreeTerms: true,
        balance: {
          USD: initialBalance,
          EUR: initialBalance,
          GBP: initialBalance,
        },
        testAccount: true,
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );
}
