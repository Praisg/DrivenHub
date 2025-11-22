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

  return NextResponse.json({ authUrl });
}

