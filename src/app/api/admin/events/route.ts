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
    const transformedEvents = (data || [])
      .map((event: any) => ({
        id: event.id,
        googleEventId: event.google_event_id,
        title: event.title || 'Untitled Event',
        startISO: event.start_time || null,
        endISO: event.end_time || null,
        zoomUrl: event.zoom_url || null,
        eventbriteUrl: event.eventbrite_url || null,
        description: event.description || '',
        organizerEmail: event.organizer_email || null,
        attendeesEmails: Array.isArray(event.attendees_emails) ? event.attendees_emails : [],
        location: event.location || null,
      }))
      .filter((event: any) => {
        // Filter out events with missing critical fields
        if (!event.id || !event.title) {
          console.warn('Skipping event with missing id or title:', event);
          return false;
        }
        return true;
      });

    return NextResponse.json({ events: transformedEvents });
  } catch (err: any) {
    console.error('Get admin events error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

