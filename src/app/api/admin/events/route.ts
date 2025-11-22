import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * GET /api/admin/events
 * Gets all events (admin only - no filtering)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_time', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch events: ${error.message}`);
    }

    // Transform to match Event interface
    const transformedEvents = (data || []).map((event: any) => ({
      id: event.id,
      googleEventId: event.google_event_id,
      title: event.title,
      startISO: event.start_time,
      endISO: event.end_time,
      zoomUrl: event.zoom_url,
      eventbriteUrl: event.eventbrite_url,
      description: event.description || '',
      organizerEmail: event.organizer_email,
      attendeesEmails: event.attendees_emails || [],
      location: event.location,
    }));

    return NextResponse.json({ events: transformedEvents });
  } catch (err: any) {
    console.error('Get admin events error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

