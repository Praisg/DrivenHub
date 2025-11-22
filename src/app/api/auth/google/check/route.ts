import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * GET /api/auth/google/check
 * Checks if user has connected Google Calendar
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'userId and email are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('google_oauth_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('email', email)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      connected: !!data,
      email: data?.email || null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to check connection' },
      { status: 500 }
    );
  }
}

