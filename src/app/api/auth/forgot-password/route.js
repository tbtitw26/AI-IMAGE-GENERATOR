import { connectToDatabase } from '../../../../lib/mongodb';
import { sendEmail, buildPasswordResetEmail } from '../../../../lib/email';
import { createAuthToken } from '../../../../lib/auth';
import { ensureTestAccount } from '../../../../lib/test-account';
import { COLLECTIONS } from '../../../../config/constants';

export async function POST(req) {
  if (process.env.TEST_MODE === 'true') {
    await ensureTestAccount();
  }

  const { email } = await req.json();
  if (!email) {
    return new Response(JSON.stringify({ message: 'Email is required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { db } = await connectToDatabase();
    const user = await db.collection(COLLECTIONS.USER).findOne({ email: email.toLowerCase() });

    if (!user) {
      return new Response(JSON.stringify({ message: 'If that email exists, a reset message has been sent.' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

  const resetToken = createAuthToken({ purpose: 'reset_password', email: user.email });
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${encodeURIComponent(resetToken)}`;

  await db.collection(COLLECTIONS.USER).updateOne(
    { _id: user._id },
    {
      $set: {
        resetToken,
        resetTokenExpires: new Date(Date.now() + 60 * 60 * 1000),
      },
    }
  );

  const emailContent = buildPasswordResetEmail({
    name: user.firstName || 'Customer',
    resetUrl,
  });

    await sendEmail({
      to: user.email,
      ...emailContent,
    }).catch(() => null);

    return new Response(JSON.stringify({ message: 'If that email exists, a reset message has been sent.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Forgot password failed:', error);
    return new Response(JSON.stringify({ message: error.message || 'Unable to send reset email.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
