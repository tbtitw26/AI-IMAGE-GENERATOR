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

    const requireEmailVerification =
      process.env.REGISTRATION_REQUIRE_EMAIL_VERIFICATION === 'true' &&
      process.env.NODE_ENV === 'production';

    let verificationToken = null;
    if (requireEmailVerification) {
      verificationToken = createAuthToken({
        purpose: 'verify_email',
        email: email.toLowerCase().trim(),
      });
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

      await sendEmail({
        to: newUser.email,
        ...buildVerificationEmail({
          name: firstName || lastName || 'Customer',
          verificationUrl,
        }),
      }).catch((err) => {
        console.warn('Verification email failed to send:', err.message);
      });

      return Response.json(
        {
          message:
            'Registration successful. Please check your email to verify your account.',
        },
        { status: 201 }
      );
    }

    return Response.json(
      { message: 'Registration successful.' },
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
