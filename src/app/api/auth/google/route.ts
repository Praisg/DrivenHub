import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAuthUrl } from '@/lib/google-calendar';

/**
 * GET /api/auth/google
 * Initiates Google OAuth flow
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  const email = searchParams.get('email');

  if (!userId || !email) {
    return NextResponse.json(
      { error: 'userId and email are required' },
      { status: 400 }
    );
  }

  // Store userId and email in state for callback
  const state = JSON.stringify({ userId, email });
  const authUrl = getGoogleAuthUrl(state);

  // Debug logging to verify redirect URI
  console.log('Google OAuth Initiation:', {
    redirectUri: process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/callback`,
    clientId: process.env.GOOGLE_CLIENT_ID ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...` : 'NOT SET',
    authUrl: authUrl.substring(0, 100) + '...',
  });

  return NextResponse.json({ authUrl });
}

