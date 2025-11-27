import { NextRequest, NextResponse } from 'next/server';
import { syncGoogleCalendarEvents } from '@/lib/google-calendar';
import { getSupabase } from '@/lib/supabase';

/**
 * POST /api/events/sync
 * Syncs events from Google Calendar for the authenticated admin
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

    // Verify user is admin
    const supabase = getSupabase();
    const { data: user, error: userError } = await supabase
      .from('members')
      .select('role')
      .eq('id', userId)
      .single();

    if (userError || !user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    // Sync events from Google Calendar
    console.log('[API] Starting sync for user:', userId, email);
    const result = await syncGoogleCalendarEvents(userId, email);
    console.log('[API] Sync completed successfully:', result);

    // Explicitly return 200 status with clear success response
    return NextResponse.json(
      {
        success: true,
        synced: result.synced,
        total: result.total,
        message: `Successfully synced ${result.synced} events from Google Calendar`,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[API] Sync error:', {
      message: err.message,
      stack: err.stack,
      code: err.code,
      name: err.name,
      fullError: JSON.stringify(err, Object.getOwnPropertyNames(err)),
    });
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to sync events',
      },
      { status: 500 }
    );
  }
}

