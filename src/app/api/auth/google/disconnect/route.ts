import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * POST /api/auth/google/disconnect
 * Disconnects Google Calendar by deleting OAuth tokens
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, email } = await req.json();

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'userId and email are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Delete OAuth tokens
    const { error } = await supabase
      .from('google_oauth_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('email', email);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Google Calendar disconnected successfully',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to disconnect' },
      { status: 500 }
    );
  }
}

