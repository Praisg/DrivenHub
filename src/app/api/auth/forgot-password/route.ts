import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { sendPasswordResetEmail } from '@/lib/email-service';
import crypto from 'crypto';

/**
 * POST /api/auth/forgot-password
 * Generate password reset token and send email
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Find user by email (case-insensitive)
    const { data: user, error: userError } = await supabase
      .from('members')
      .select('id, email, name')
      .ilike('email', email.toLowerCase().trim())
      .maybeSingle();

    // Always return success to avoid email enumeration
    // If user doesn't exist, we still return success message
    if (userError || !user) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      return NextResponse.json({
        message: 'If an account exists with that email, we\'ve sent a password reset link.',
      });
    }

    // Generate secure random token (32 bytes = 256 bits)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Expires in 1 hour

    // Delete any existing tokens for this user
    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('user_id', user.id);

    // Insert new token
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      throw new Error(`Failed to create reset token: ${tokenError.message}`);
    }

    // Send email with reset link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (emailError) {
      // Log error but don't fail the request (to avoid email enumeration)
      console.error('Failed to send password reset email:', emailError);
      // In development, still log the link
      if (process.env.NODE_ENV === 'development') {
        console.log(`[PASSWORD RESET] Reset link for ${user.email}: ${resetUrl}`);
      }
    }

    return NextResponse.json({
      message: 'If an account exists with that email, we\'ve sent a password reset link.',
    });
  } catch (err: any) {
    console.error('Forgot password error:', err);
    // Still return success to avoid leaking errors
    return NextResponse.json({
      message: 'If an account exists with that email, we\'ve sent a password reset link.',
    });
  }
}

