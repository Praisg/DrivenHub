/**
 * Email service for sending emails
 * Currently logs emails to console (for development)
 * TODO: Integrate with Resend, SendGrid, or another email service for production
 */

interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

/**
 * Send an email
 * In production, this should integrate with an email service provider
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const { to, subject, html, text } = options;

  // In development, log the email
  if (process.env.NODE_ENV === 'development') {
    console.log('='.repeat(60));
    console.log('📧 EMAIL (Development Mode)');
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
    return;
  }

  // In production, integrate with email service
  // Example with Resend:
  /*
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }

  const resend = new Resend(RESEND_API_KEY);
  
  await resend.emails.send({
    from: 'noreply@yourdomain.com',
    to: [to],
    subject,
    html: html || text,
    text: text || html?.replace(/<[^>]*>/g, ''),
  });
  */

  // For now, log in production too (remove this and implement actual email sending)
  console.log(`[EMAIL] Would send to ${to}: ${subject}`);
  if (html) {
    console.log(`[EMAIL] Body: ${html.substring(0, 200)}...`);
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

