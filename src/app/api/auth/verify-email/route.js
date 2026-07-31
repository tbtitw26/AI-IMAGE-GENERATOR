import { connectToDatabase } from '../../../../lib/mongodb';
import { verifyAuthToken } from '../../../../lib/auth';
import { COLLECTIONS } from '../../../../config/constants';

export async function POST(req) {
  const { token } = await req.json();
  if (!token) {
    return new Response(JSON.stringify({ message: 'Verification token is required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let payload;
  try {
    payload = verifyAuthToken(token);
  } catch (error) {
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

  if (user.emailVerified) {
    return new Response(JSON.stringify({ message: 'Email already verified.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

    await db.collection(COLLECTIONS.USER).updateOne(
      { _id: user._id },
      {
        $set: { emailVerified: true },
        $unset: { verificationToken: '' },
      }
    );

    return new Response(JSON.stringify({ message: 'Email verified successfully. You can now sign in.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Email verification failed:', error);
    return new Response(JSON.stringify({ message: error.message || 'Verification failed due to a server error.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
