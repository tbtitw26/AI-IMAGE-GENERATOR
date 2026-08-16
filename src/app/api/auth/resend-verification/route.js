import { connectToDatabase } from '../../../../lib/mongodb';
import { sendEmail, buildVerificationEmail } from '../../../../lib/email';
import { createAuthToken } from '../../../../lib/auth';
import { COLLECTIONS } from '../../../../config/constants';

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ message: 'Invalid request body.' }, { status: 400 });
  }

  const { email } = body;
  if (!email) {
    return Response.json({ message: 'Email is required.' }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection(COLLECTIONS.USER);
    const user = await usersCollection.findOne({ email: normalizedEmail });

    // Always respond with a generic success message, whether or not the
    // account exists — this avoids leaking which emails are registered.
    const genericResponse = {
      message: 'If an account with that email exists and is not yet verified, a new verification email has been sent.',
    };

    if (!user || user.emailVerified) {
      return Response.json(genericResponse, { status: 200 });
    }

    const verificationToken = createAuthToken(
      { purpose: 'verify_email', email: normalizedEmail },
      { expiresIn: '24h' }
    );

    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { verificationToken, updatedAt: new Date() } }
    );

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_URL ||
      'http://localhost:3000';
    const verificationUrl = `${appUrl}/verify-email?token=${encodeURIComponent(verificationToken)}`;

    console.log(`\n==================================================`);
    console.log(`🔗 [DEV RESEND VERIFICATION LINK] for ${user.email}:`);
    console.log(`👉 ${verificationUrl}`);
    console.log(`==================================================\n`);

    const emailSent = await sendEmail({
      to: user.email,
      ...buildVerificationEmail({
        name: user.firstName || user.lastName || 'Customer',
        verificationUrl,
      }),
    }).catch((err) => {
      console.warn('Resend verification email failed to send:', err.message);
      return false;
    });

    const isDevOrTest = process.env.NODE_ENV === 'development' || process.env.TEST_MODE === 'true';

    return Response.json(
      {
        ...genericResponse,
        emailSent: Boolean(emailSent),
        ...(isDevOrTest ? { devVerificationUrl: verificationUrl } : {}),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Resend Verification API] Error:', error);
    return Response.json(
      { message: error.message || 'Failed to resend verification email due to a server error.' },
      { status: 500 }
    );
  }
}
