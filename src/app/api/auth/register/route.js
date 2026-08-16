import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
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

  const {
    email,
    password,
    firstName = '',
    lastName = '',
    phone = '',
    dob = '',
    streetAddress = '',
    city = '',
    country = '',
    postalCode = '',
    agreeTerms,
  } = body;

  if (!email || !password) {
    return Response.json(
      { message: 'Email and password are required.' },
      { status: 400 }
    );
  }

  const requireTerms = process.env.REGISTRATION_REQUIRE_TERMS === 'true';
  if (requireTerms && !agreeTerms) {
    return Response.json(
      { message: 'You must agree to the terms before registering.' },
      { status: 400 }
    );
  }

  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection(COLLECTIONS.USER);

    const existingUser = await usersCollection.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingUser) {
      return Response.json(
        { message: 'A user with this email already exists.' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Always require email verification in production
    const requireEmailVerification =
      process.env.REGISTRATION_REQUIRE_EMAIL_VERIFICATION !== 'false';

    let verificationToken = null;
    if (requireEmailVerification) {
      verificationToken = createAuthToken(
        {
          purpose: 'verify_email',
          email: email.toLowerCase().trim(),
        },
        { expiresIn: '24h' }
      );
    }

    const newUser = {
      _id: new ObjectId(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      dob,
      streetAddress,
      city,
      country,
      postalCode,
      agreeTerms: Boolean(agreeTerms),
      emailVerified: !requireEmailVerification,
      verificationToken,
      balance: {
        USD: 0,
        EUR: 0,
        GBP: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await usersCollection.insertOne(newUser);

    // Optionally send verification email (don't block registration if it fails)
    if (requireEmailVerification && verificationToken) {
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.APP_URL ||
        'http://localhost:3000';
      const verificationUrl = `${appUrl}/verify-email?token=${encodeURIComponent(verificationToken)}`;

      console.log(`\n==================================================`);
      console.log(`🔗 [DEV VERIFICATION LINK] for ${newUser.email}:`);
      console.log(`👉 ${verificationUrl}`);
      console.log(`==================================================\n`);

      const emailSent = await sendEmail({
        to: newUser.email,
        ...buildVerificationEmail({
          name: firstName || lastName || 'Customer',
          verificationUrl,
        }),
      }).catch((err) => {
        console.warn('Verification email failed to send:', err.message);
        return false;
      });

      const isDevOrTest = process.env.NODE_ENV === 'development' || process.env.TEST_MODE === 'true';

      return Response.json(
        {
          message: emailSent
            ? 'Registration successful. Please check your email to verify your account.'
            : 'Registration successful, but we could not send the verification email right now. Please use "Resend verification email" or contact support.',
          emailSent: Boolean(emailSent),
          requiresVerification: true,
          ...(isDevOrTest ? { devVerificationUrl: verificationUrl } : {}),
        },
        { status: 201 }
      );
    }

    return Response.json(
      { message: 'Registration successful.', requiresVerification: false },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Register API] Error:', error);
    return Response.json(
      { message: error.message || 'Registration failed due to a server error.' },
      { status: 500 }
    );
  }
}
