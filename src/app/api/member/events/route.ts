import { NextRequest, NextResponse } from 'next/server';
import { getUserEvents } from '@/lib/google-calendar';
import { getSupabase } from '@/lib/supabase';

/**
 * GET /api/member/events
 * Gets events for the authenticated member using user_events join table
 * Requires userId query parameter (from authenticated session)
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required. Please ensure you are logged in.' },
        { status: 400 }
      );
    }

    // Get events via user_events join table
    // Time complexity: O(k) where k = number of events mapped to that user
    // Space complexity: O(k) to hold the list of events
    console.log(`[Member Events API] Fetching events for userId: ${userId} (type: ${typeof userId}, length: ${userId.length})`);
    
    // Debug: First verify the user exists and get their email
    const supabase = getSupabase();
    const { data: userData, error: userError } = await supabase
      .from('members')
      .select('id, name, email')
      .eq('id', userId)
      .maybeSingle();
    
    if (userError) {
      console.error(`[Member Events API] Error fetching user:`, userError);
    } else if (userData) {
      console.log(`[Member Events API] User found: ${userData.name} (${userData.email})`);
    } else {
      console.warn(`[Member Events API] No user found with id: ${userId}`);
    }
    
    // Debug: Check if user_events table has any mappings for this user
    const { data: mappings, error: mappingCheckError } = await supabase
      .from('user_events')
      .select('event_id, user_id')
      .eq('user_id', userId);
    
    if (!mappingCheckError) {
      console.log(`[Member Events API] Found ${mappings?.length || 0} user_events mappings for user ${userId}`);
      if (mappings && mappings.length > 0) {
        console.log(`[Member Events API] Mapping event IDs:`, mappings.map((m: any) => m.event_id));
      }
    } else {
      console.error(`[Member Events API] Error checking mappings:`, mappingCheckError);
    }
    
    const events = await getUserEvents(userId);
    
    console.log(`[Member Events API] Found ${events.length} events for user ${userId}`);

    // Transform to match Event interface
    const transformedEvents = events.map((event: any) => ({
      id: event.id,
      googleEventId: event.google_event_id,
      title: event.title,
      startISO: event.start_time,
      endISO: event.end_time,
      zoomUrl: event.zoom_url, // This can be Zoom or Google Meet link
      eventbriteUrl: event.eventbrite_url,
      description: event.description || '',
      organizerEmail: event.organizer_email,
      attendeesEmails: event.attendees_emails || [],
      location: event.location,
    }));

    return NextResponse.json({ events: transformedEvents });
  } catch (err: any) {
    console.error('Get member events error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

