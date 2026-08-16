import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { connectToDatabase } from '../../../../lib/mongodb';
import { verifyAuthToken } from '../../../../lib/auth';
import { COLLECTIONS } from '../../../../config/constants';
import { getPlanInfo } from '../../../../lib/plan';

const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || (process.env.NODE_ENV !== 'production' ? 'development-secret' : '');

export async function POST(req) {
  const { token } = await req.json();
  if (!token) {
    return new Response(JSON.stringify({ message: 'Verification token is required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const payload = verifyAuthToken(token);

  if (!payload) {
    return new Response(JSON.stringify({ message: 'Verification link is invalid or expired.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (payload.purpose !== 'verify_email' || !payload.email) {
    return new Response(JSON.stringify({ message: 'Verification link is invalid.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { db } = await connectToDatabase();
    const user = await db.collection(COLLECTIONS.USER).findOne({ email: payload.email.toLowerCase() });

    if (!user) {
      return new Response(JSON.stringify({ message: 'Verification link is invalid.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!user.emailVerified) {
      await db.collection(COLLECTIONS.USER).updateOne(
        { _id: user._id },
        {
          $set: { emailVerified: true },
          $unset: { verificationToken: '' },
        }
      );
    }

    // Auto-login: generate session JWT & session record
    const jti = randomUUID();
    const sessionToken = jwt.sign(
      {
        sub: user._id.toString(),
        email: user.email,
        jti,
      },
      secret,
      { expiresIn: '7d' }
    );

    const userAgent = req.headers.get('user-agent') || 'Unknown device';
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : req.headers.get('x-real-ip') || null;

    await db.collection(COLLECTIONS.SESSIONS).insertOne({
      _id: jti,
      userId: user._id,
      userAgent,
      ip,
      createdAt: new Date(),
      lastActiveAt: new Date(),
      revokedAt: null,
    }).catch(() => null);

    const safeUser = {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      balance: user.balance || {
        USD: 0,
        EUR: 0,
        GBP: 0,
      },
      ...getPlanInfo(user),
    };

    return new Response(
      JSON.stringify({
        message: 'Email verified successfully.',
        token: sessionToken,
        user: safeUser,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Email verification failed:', error);
    return new Response(JSON.stringify({ message: error.message || 'Verification failed due to a server error.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
