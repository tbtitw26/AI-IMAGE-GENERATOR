import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { connectToDatabase } from '../../../../lib/mongodb';
import { COLLECTIONS } from '../../../../config/constants';

const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || (process.env.NODE_ENV !== 'production' ? 'development-secret' : '');

export async function POST(req) {
  if (!secret) {
    return new Response(JSON.stringify({ message: 'JWT_SECRET or NEXTAUTH_SECRET is required in .env.local' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await req.json();
  const { email, password } = body;

  if (!email || !password) {
    return new Response(JSON.stringify({ message: 'Email and password are required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { db } = await connectToDatabase();
  const user = await db.collection(COLLECTIONS.USER).findOne({ email: email.toLowerCase() });

  if (!user) {
    return new Response(JSON.stringify({ message: 'Invalid email or password.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const isLocalDevelopment = process.env.NODE_ENV !== 'production';
  if (!user.emailVerified && !isLocalDevelopment) {
    return new Response(JSON.stringify({ message: 'Please verify your email address before signing in.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return new Response(JSON.stringify({ message: 'Invalid email or password.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const jti = randomUUID();

    const token = jwt.sign(
      {
        sub: user._id.toString(),
        email: user.email,
        jti,
      },
      secret,
      {
        expiresIn: '7d',
      }
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
    });

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
    };

    return new Response(JSON.stringify({ token, user: safeUser }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Login failed:', error);
    return new Response(JSON.stringify({ message: error.message || 'Login failed due to a server error.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
