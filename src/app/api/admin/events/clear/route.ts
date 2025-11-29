import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * POST /api/admin/events/clear
 * Clears all synced events from Google Calendar
 * Admin-only endpoint
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();

    // First, delete all user_event mappings (if they exist)
    // Check if the table exists by trying to query it
    try {
      const { error: mappingError } = await supabase
        .from('user_events')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using a condition that matches all rows)
      
      if (mappingError && !mappingError.message.includes('does not exist')) {
        console.warn('Error deleting user_event mappings:', mappingError);
      }
    } catch (err) {
      // Table might not exist, that's okay
      console.log('user_events table may not exist, skipping');
    }

    // Delete all events from the events table
    const { data: deletedEvents, error: deleteError } = await supabase
      .from('events')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
      .select('id');

    if (deleteError) {
      throw new Error(`Failed to delete events: ${deleteError.message}`);
    }

    const clearedCount = deletedEvents?.length || 0;

    return NextResponse.json({ 
      success: true,
      cleared: clearedCount,
      message: `Cleared ${clearedCount} synced event${clearedCount !== 1 ? 's' : ''}`
    });
  } catch (err: any) {
    console.error('Clear events error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to clear events' },
      { status: 500 }
    );
  }
}

