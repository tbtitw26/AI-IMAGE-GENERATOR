import nodemailer from 'nodemailer';

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
const smtpSecure = process.env.SMTP_SECURE === 'true';
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const fromEmail = process.env.EMAIL_FROM || 'no-reply@aetherframe.ai';

let transporter;

if (smtpHost && smtpUser && smtpPass) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

export async function sendEmail({ to, subject, html, attachments }) {
  if (!transporter) {
    console.warn('SMTP is not configured. Email not sent:', subject, to);
    return false;
  }

  await transporter.sendMail({
    from: fromEmail,
    to,
    subject,
    html,
    attachments,
  });
  return true;
}

export function buildVerificationEmail({ name, verificationUrl }) {
  return {
    subject: 'Confirm your AetherFrame account',
    html: `
      <div style="font-family: sans-serif; line-height: 1.5; color: #111;">
        <h1>Welcome to AetherFrame</h1>
        <p>Hi ${name || 'there'},</p>
        <p>Thanks for registering. Please confirm your email address by clicking the button below:</p>
        <p><a href="${verificationUrl}" style="background:#0b72ff;color:white;padding:12px 18px;border-radius:8px;text-decoration:none;">Confirm Email</a></p>
        <p>If you did not create an account, you can ignore this message.</p>
      </div>
    `,
  };
}

export function buildPasswordResetEmail({ name, resetUrl }) {
  return {
    subject: 'Reset your AetherFrame password',
    html: `
      <div style="font-family: sans-serif; line-height: 1.5; color: #111;">
        <h1>Password reset request</h1>
        <p>Hi ${name || 'there'},</p>
        <p>We received a request to reset your password. Click below to create a new password:</p>
        <p><a href="${resetUrl}" style="background:#0b72ff;color:white;padding:12px 18px;border-radius:8px;text-decoration:none;">Reset Password</a></p>
        <p>If you didn’t request this, you can safely ignore this message.</p>
      </div>
    `,
  };
}

export function buildInvoiceEmail({ name, invoiceNumber }) {
  return {
    subject: `Your AetherFrame invoice ${invoiceNumber}`,
    html: `
      <div style="font-family: sans-serif; line-height: 1.5; color: #111;">
        <h1>Payment confirmed</h1>
        <p>Hi ${name || 'there'},</p>
        <p>Thank you for your purchase. Your invoice <strong>${invoiceNumber}</strong> is attached.</p>
        <p>If you have questions, reply to this email anytime.</p>
      </div>
    `,
  };
}
