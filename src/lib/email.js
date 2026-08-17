import { Resend } from 'resend';
import nodemailer from 'nodemailer';

const resendApiKey = process.env.RESEND_API_KEY;
let resend;

if (resendApiKey) {
  resend = new Resend(resendApiKey);
}

const fromEmail = process.env.EMAIL_FROM || 'noreply@dexeric.ai';
const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpSecure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';

const smtpTransport = smtpHost && smtpUser && smtpPass
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })
  : null;

export async function sendEmail({ to, subject, html, attachments }) {
  if (resend) {
    try {
      let response = await resend.emails.send({
        from: fromEmail,
        to,
        subject,
        html,
      });

      // Fallback to onboarding@resend.dev if custom domain is not authorized/verified in Resend
      if (
        response &&
        response.error &&
        fromEmail !== 'onboarding@resend.dev' &&
        (response.error.message?.includes('not authorized') || response.error.message?.includes('verify a domain'))
      ) {
        console.warn(`[Resend Warning] '${fromEmail}' is not authorized in Resend. Retrying with 'onboarding@resend.dev'...`);
        response = await resend.emails.send({
          from: 'onboarding@resend.dev',
          to,
          subject,
          html,
        });
      }

      if (response && response.error) {
        console.error('Failed to send email via Resend:', response.error);
      } else if (response && response.data) {
        console.log(`[Email Sent] Successfully sent email via Resend to ${to} (ID: ${response.data.id})`);
        return true;
      } else {
        console.warn('Resend returned unexpected response:', response);
      }
    } catch (error) {
      console.error('Failed to send email via Resend exception:', error);
    }
  }

  if (smtpTransport) {
    try {
      const info = await smtpTransport.sendMail({
        from: fromEmail,
        to,
        subject,
        html,
        attachments,
      });

      if (info?.messageId) {
        console.log(`[Email Sent] Successfully sent email via SMTP to ${to} (MessageID: ${info.messageId})`);
        return true;
      }

      console.warn('SMTP email provider responded without a messageId:', info);
      return false;
    } catch (error) {
      console.error('Failed to send email via SMTP:', error);
      return false;
    }
  }

  console.warn(
    'No email provider configured or all email providers failed. Set RESEND_API_KEY or SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS in .env.local to send verification emails.'
  );
  return false;
}

export function buildVerificationEmail({ name, verificationUrl }) {
  return {
    subject: 'Confirm your dexericai account',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #0b72ff; margin-bottom: 20px;">Welcome to dexericai!</h1>
          <p style="font-size: 16px; margin-bottom: 20px;">Hi ${name || 'there'},</p>
          <p style="font-size: 16px; margin-bottom: 30px;">Thanks for registering. Please confirm your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #0b72ff; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Confirm Email Address</a>
          </div>
          <p style="font-size: 14px; color: #666; margin-bottom: 20px;">Or copy and paste this link in your browser:</p>
          <p style="font-size: 14px; color: #0b72ff; word-break: break-all; margin-bottom: 30px;">${verificationUrl}</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
          <p style="font-size: 12px; color: #999;">If you did not create a dexericai account, you can safely ignore this email.</p>
          <p style="font-size: 12px; color: #999;">This link will expire in 24 hours.</p>
          <p style="font-size: 12px; color: #999; margin-top: 20px;">© 2024 dexericai. All rights reserved.</p>
        </div>
      </div>`,
  };
}

export function buildPasswordResetEmail({ name, resetUrl }) {
  return {
    subject: 'Reset your dexericai password',
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
    subject: `Your dexericai invoice ${invoiceNumber}`,
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
