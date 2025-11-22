import { NextRequest, NextResponse } from 'next/server';
import { getUserEvents } from '@/lib/google-calendar';
import { getSupabase } from '@/lib/supabase';

/**
 * GET /api/events
 * Gets events for the authenticated user (filtered by their email)
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userEmail = searchParams.get('email');

    if (!userEmail) {
      return NextResponse.json(
        { error: 'email parameter is required' },
        { status: 400 }
      );
    }

    // Check if Supabase is configured
    try {
      // Get events for this user
      const events = await getUserEvents(userEmail);

      // Transform to match Event interface
      const transformedEvents = events.map((event: any) => ({
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
    } catch (supabaseError: any) {
      // If Supabase is not configured, return empty array (fallback to JSON files)
      if (supabaseError.message?.includes('Supabase environment variables')) {
        console.warn('Supabase not configured, returning empty events array');
        return NextResponse.json({ events: [] });
      }
      throw supabaseError;
    }
  } catch (err: any) {
    console.error('Get events error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

