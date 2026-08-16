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
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirm your dexericai account</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f6f9; padding: 40px 10px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08); border: 1px solid #e9ecef;">
                <!-- Header Banner -->
                <tr>
                  <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 36px 40px; text-align: center;">
                    <div style="font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">
                      dexeric<span style="color: #3b82f6;">.ai</span>
                    </div>
                  </td>
                </tr>
                
                <!-- Content Body -->
                <tr>
                  <td style="padding: 40px 40px 32px 40px;">
                    <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #0f172a; line-height: 1.3;">
                      Welcome to dexericai! 👋
                    </h1>
                    
                    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #334155;">
                      Hi <strong>${name || 'there'}</strong>,
                    </p>
                    
                    <p style="margin: 0 0 28px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                      Thanks for registering! Please confirm your email address by clicking the button below:
                    </p>

                    <!-- CTA Button -->
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 32px auto;">
                      <tr>
                        <td align="center" style="border-radius: 10px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);">
                          <a href="${verificationUrl}" target="_blank" style="display: inline-block; padding: 16px 36px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 10px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);">
                            Confirm Email Address
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Notice Box -->
                    <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 6px; padding: 16px 20px; margin-top: 32px;">
                      <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                        <strong>Note:</strong> This link will expire in <strong>24 hours</strong>. If you did not create a dexericai account, you can safely ignore this email.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #fafafa; padding: 24px 40px; border-top: 1px solid #f1f5f9; text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: #94a3b8;">
                      © 2026 dexericai. All rights reserved.
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #cbd5e1;">
                      AI Image Generation Platform
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };
}

export function buildPasswordResetEmail({ name, resetUrl }) {
  return {
    subject: 'Reset your dexericai password',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset your dexericai password</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f6f9; padding: 40px 10px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08); border: 1px solid #e9ecef;">
                <!-- Header Banner -->
                <tr>
                  <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 36px 40px; text-align: center;">
                    <div style="font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">
                      dexeric<span style="color: #3b82f6;">.ai</span>
                    </div>
                  </td>
                </tr>
                
                <!-- Content Body -->
                <tr>
                  <td style="padding: 40px 40px 32px 40px;">
                    <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #0f172a; line-height: 1.3;">
                      Password Reset Request 🔐
                    </h1>
                    
                    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #334155;">
                      Hi <strong>${name || 'there'}</strong>,
                    </p>
                    
                    <p style="margin: 0 0 28px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                      We received a request to reset your password. Click the button below to choose a new password for your account:
                    </p>

                    <!-- CTA Button -->
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 32px auto;">
                      <tr>
                        <td align="center" style="border-radius: 10px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);">
                          <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 16px 36px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 10px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);">
                            Reset Password
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Notice Box -->
                    <div style="background-color: #f8fafc; border-left: 4px solid #eab308; border-radius: 6px; padding: 16px 20px; margin-top: 32px;">
                      <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                        If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #fafafa; padding: 24px 40px; border-top: 1px solid #f1f5f9; text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: #94a3b8;">
                      © 2026 dexericai. All rights reserved.
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #cbd5e1;">
                      AI Image Generation Platform
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };
}

export function buildInvoiceEmail({ name, invoiceNumber, amount, currency }) {
  const formattedAmount = amount && currency ? `${amount} ${currency}` : null;
  return {
    subject: `Your dexericai invoice ${invoiceNumber}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your dexericai invoice ${invoiceNumber}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f6f9; padding: 40px 10px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08); border: 1px solid #e9ecef;">
                <!-- Header Banner -->
                <tr>
                  <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 36px 40px; text-align: center;">
                    <div style="font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">
                      dexeric<span style="color: #3b82f6;">.ai</span>
                    </div>
                  </td>
                </tr>
                
                <!-- Content Body -->
                <tr>
                  <td style="padding: 40px 40px 32px 40px;">
                    <div style="display: inline-block; background-color: #dcfce7; color: #166534; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 6px 14px; border-radius: 20px; margin-bottom: 16px;">
                      ✓ Payment Confirmed
                    </div>
                    
                    <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #0f172a; line-height: 1.3;">
                      Payment Confirmed
                    </h1>
                    
                    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #334155;">
                      Hi <strong>${name || 'there'}</strong>,
                    </p>

                    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                      Thank you for your purchase! Your invoice <strong>${invoiceNumber}</strong> is attached to this email as a PDF document.
                    </p>

                    <!-- Invoice Summary Card -->
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin: 24px 0; padding: 20px;">
                      <tr>
                        <td style="padding-bottom: 12px; border-bottom: 1px solid #e2e8f0;">
                          <span style="font-size: 13px; color: #64748b;">Invoice Number</span><br>
                          <strong style="font-size: 16px; color: #0f172a; font-family: monospace;">${invoiceNumber}</strong>
                        </td>
                        <td align="right" style="padding-bottom: 12px; border-bottom: 1px solid #e2e8f0;">
                          <span style="font-size: 13px; color: #64748b;">Status</span><br>
                          <strong style="font-size: 14px; color: #16a34a;">PAID</strong>
                        </td>
                      </tr>
                      ${formattedAmount ? `
                      <tr>
                        <td colspan="2" style="padding-top: 12px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0;">
                          <span style="font-size: 13px; color: #64748b;">Amount Paid</span><br>
                          <strong style="font-size: 16px; color: #0f172a;">${formattedAmount}</strong>
                        </td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td colspan="2" style="padding-top: 12px;">
                          <span style="font-size: 13px; color: #64748b;">Attached File</span><br>
                          <span style="font-size: 14px; color: #2563eb; font-weight: 600;">📎 ${invoiceNumber}.pdf</span>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 1.6; color: #64748b;">
                      If you have questions, reply to this email anytime.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #fafafa; padding: 24px 40px; border-top: 1px solid #f1f5f9; text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: #94a3b8;">
                      © 2026 dexericai. All rights reserved.
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #cbd5e1;">
                      AI Image Generation Platform
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };
}

