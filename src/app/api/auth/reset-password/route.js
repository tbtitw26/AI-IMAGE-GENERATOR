import bcrypt from 'bcryptjs';
import { connectToDatabase } from '../../../../lib/mongodb';
import { verifyAuthToken } from '../../../../lib/auth';
import { ensureTestAccount } from '../../../../lib/test-account';
import { COLLECTIONS } from '../../../../config/constants';

export async function POST(req) {
  try {
    if (process.env.TEST_MODE === 'true') {
      await ensureTestAccount();
    }

    const { token, password } = await req.json();
    if (!token || !password) {
      return new Response(JSON.stringify({ message: 'Token and password are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

  let payload;
  try {
    payload = verifyAuthToken(token);
  } catch (error) {
    return new Response(JSON.stringify({ message: 'Reset link is invalid or expired.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (payload.purpose !== 'reset_password' || !payload.email) {
    return new Response(JSON.stringify({ message: 'Reset link is invalid.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (password.length < 8) {
    return new Response(JSON.stringify({ message: 'Password must be at least 8 characters.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { db } = await connectToDatabase();
  const user = await db.collection(COLLECTIONS.USER).findOne({ email: payload.email, resetToken: token });
  if (!user) {
    return new Response(JSON.stringify({ message: 'Reset link is invalid or expired.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!user.resetTokenExpires || user.resetTokenExpires < new Date()) {
    return new Response(JSON.stringify({ message: 'Reset link has expired.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
    await db.collection(COLLECTIONS.USER).updateOne(
      { _id: user._id },
      {
        $set: { password: hashedPassword },
        $unset: { resetToken: '', resetTokenExpires: '' },
      }
    );

    return new Response(JSON.stringify({ message: 'Your password has been updated successfully.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Reset password failed:', error);
    return new Response(JSON.stringify({ message: error.message || 'Unable to reset password.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
