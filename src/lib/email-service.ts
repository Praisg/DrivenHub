/**
 * Email service for sending emails via Resend
 * 
 * Required environment variables for production:
 * - RESEND_API_KEY: Your Resend API key (get from https://resend.com/api-keys)
 * - EMAIL_FROM: The sender email address, e.g., "DRIVEN Institute <no-reply@driven.com>"
 * 
 * In development or when env vars are missing, emails are logged to console instead.
 */

import { Resend } from 'resend';

interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

/**
 * Send an email via Resend (production) or log to console (development/fallback)
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const { to, subject, html, text } = options;

  // Check for required environment variables
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  // Log email details (useful for debugging)
  console.log(`[EMAIL] Would send to ${to}: ${subject}`);
  if (html) {
    console.log(`[EMAIL] Body: ${html.substring(0, 200)}...`);
  }

  // If missing required config, log warning and return (fallback mode)
  if (!apiKey || !from) {
    console.warn(
      `[EMAIL] Missing RESEND_API_KEY or EMAIL_FROM; not sending real email. ` +
      `Set these environment variables in production to enable email sending.`
    );
    
    // In development, show full email details
    if (process.env.NODE_ENV === 'development') {
      console.log('='.repeat(60));
      console.log('📧 EMAIL (Development Mode - No API Key)');
      console.log('='.repeat(60));
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log('---');
      if (html) {
        console.log('HTML Body:');
        console.log(html);
      }
      if (text) {
        console.log('Text Body:');
        console.log(text);
      }
      console.log('='.repeat(60));
    }
    return;
  }

  // Send real email via Resend
  try {
    const resend = new Resend(apiKey);
    
    const result = await resend.emails.send({
      from,
      to: [to],
      subject,
      html: html || text,
      text: text || (html ? html.replace(/<[^>]*>/g, '') : undefined),
    });

    console.log(`[EMAIL] Successfully sent to ${to} (ID: ${result.data?.id || 'unknown'})`);
  } catch (error: any) {
    console.error(`[EMAIL] Failed to send email to ${to}:`, error);
    throw error; // Re-throw so caller can handle if needed
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  const subject = 'Reset Your Password - DRIVEN Community Institute';
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #682770; color: #FCFAF6; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">DRIVEN Community Institute</h1>
        </div>
        <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #682770; margin-top: 0;">Password Reset Request</h2>
          <p>You requested to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #7EA25A; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
          <p style="color: #666; font-size: 12px; word-break: break-all;">${resetUrl}</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
          </p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>DRIVEN Community Institute - Communication Hub</p>
        </div>
      </body>
    </html>
  `;

  const text = `
DRIVEN Community Institute - Password Reset Request

You requested to reset your password. Click the link below to create a new password:

${resetUrl}

This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.

DRIVEN Community Institute - Communication Hub
  `;

  await sendEmail({
    to: email,
    subject,
    html,
    text,
  });
}

