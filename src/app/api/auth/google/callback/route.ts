import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, storeOAuthTokens, getGoogleUserInfo } from '@/lib/google-calendar';
import { getSupabase } from '@/lib/supabase';

/**
 * GET /api/auth/google/callback
 * Handles Google OAuth callback
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Get base URL from environment or use request origin
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
    `${req.nextUrl.protocol}//${req.nextUrl.host}`;

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin/dashboard?error=${encodeURIComponent(error)}`, baseUrl)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/admin/dashboard?error=missing_code_or_state', baseUrl)
    );
  }

  try {
    // Parse state to get userId and email
    const { userId, email } = JSON.parse(state);

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    
    if (!tokens.refresh_token) {
      throw new Error('No refresh token received. Please try again.');
    }

    // Get user info from Google
    const userInfo = await getGoogleUserInfo(tokens.access_token!);
    const googleEmail = userInfo.email?.toLowerCase();

    if (!googleEmail) {
      throw new Error('Could not retrieve email from Google');
    }

    // Store tokens in database
    await storeOAuthTokens(userId, googleEmail, tokens);

    // Redirect to admin home with success message
    return NextResponse.redirect(
      new URL('/admin/home?success=google_connected', baseUrl)
    );
  } catch (err: any) {
    console.error('OAuth callback error:', err);
    return NextResponse.redirect(
      new URL(`/admin/home?error=${encodeURIComponent(err.message)}`, baseUrl)
    );
  }
}

