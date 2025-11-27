import { google } from 'googleapis';
import { getSupabase } from './supabase';

// Construct redirect URI dynamically
function getRedirectUri() {
  return process.env.GOOGLE_REDIRECT_URI || 
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/callback`;
}

// Create OAuth client factory function to ensure fresh values
function createOAuthClient() {
  const redirectUri = getRedirectUri();
  
  // Always log in production to debug Heroku issues
  console.log('Creating OAuth client with:', {
    clientId: process.env.GOOGLE_CLIENT_ID ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...` : 'NOT SET',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ? `SET (length: ${process.env.GOOGLE_CLIENT_SECRET.length}, starts with: ${process.env.GOOGLE_CLIENT_SECRET.substring(0, 6)}...)` : 'NOT SET',
    redirectUri: redirectUri,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
    nodeEnv: process.env.NODE_ENV,
  });

  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
}

// Create initial OAuth client (will be recreated if env vars change)
let oauth2Client = createOAuthClient();

/**
 * Get Google OAuth authorization URL
 */
export function getGoogleAuthUrl(state?: string): string {
  // Recreate client to ensure we have latest env vars
  const client = createOAuthClient();
  
  const scopes = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // Force consent to get refresh token
    state: state,
    include_granted_scopes: true, // Include previously granted scopes
  });

  console.log('Generated auth URL with redirect URI:', getRedirectUri());
  
  return authUrl;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string) {
  // Recreate client to ensure we have latest env vars
  const client = createOAuthClient();
  const redirectUri = getRedirectUri();
  
  try {
    console.log('Exchanging code for tokens:', {
      redirectUri: redirectUri,
      clientId: process.env.GOOGLE_CLIENT_ID ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...` : 'NOT SET',
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasCode: !!code,
    });
    
    const { tokens } = await client.getToken(code);
    return tokens;
  } catch (error: any) {
    // Enhanced error logging for Heroku
    console.error('Token exchange error:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      redirectUri: getRedirectUri(),
      clientId: process.env.GOOGLE_CLIENT_ID ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...` : 'NOT SET',
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
    });
    throw error;
  }
}

/**
 * Get OAuth client with stored refresh token
 */
export async function getAuthenticatedClient(userId: string, email: string) {
  const supabase = getSupabase();
  
  // Get stored refresh token from database
  const { data: tokenData, error } = await supabase
    .from('google_oauth_tokens')
    .select('*')
    .eq('user_id', userId)
    .eq('email', email)
    .single();

  if (error || !tokenData) {
    throw new Error('No OAuth token found. Please reconnect your Google account.');
  }

  oauth2Client.setCredentials({
    refresh_token: tokenData.refresh_token,
    access_token: tokenData.access_token,
    expiry_date: tokenData.token_expires_at ? new Date(tokenData.token_expires_at).getTime() : undefined,
  });

  // Refresh token if expired
  if (tokenData.token_expires_at && new Date(tokenData.token_expires_at) < new Date()) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    // Update stored token
    await supabase
      .from('google_oauth_tokens')
      .update({
        access_token: credentials.access_token,
        token_expires_at: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('email', email);

    oauth2Client.setCredentials(credentials);
  }

  return oauth2Client;
}

/**
 * Store OAuth tokens in database
 */
export async function storeOAuthTokens(
  userId: string,
  email: string,
  tokens: any
) {
  const supabase = getSupabase();

  const tokenData = {
    user_id: userId,
    email: email,
    refresh_token: tokens.refresh_token,
    access_token: tokens.access_token,
    token_expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('google_oauth_tokens')
    .upsert(tokenData, {
      onConflict: 'user_id,email',
    });

  if (error) {
    throw new Error(`Failed to store OAuth tokens: ${error.message}`);
  }
}

/**
 * Get user info from Google
 */
export async function getGoogleUserInfo(accessToken: string) {
  oauth2Client.setCredentials({ access_token: accessToken });
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();
  return data;
}

/**
 * Sync events from Google Calendar
 */
export async function syncGoogleCalendarEvents(userId: string, email: string) {
  let authClient;
  try {
    authClient = await getAuthenticatedClient(userId, email);
  } catch (error: any) {
    throw new Error(`Authentication failed: ${error.message}. Please reconnect your Google account.`);
  }

  const calendar = google.calendar({ version: 'v3', auth: authClient });
  const supabase = getSupabase();

  // Get events from primary calendar
  const now = new Date();
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(now.getFullYear() + 1);

  let response;
  try {
    response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: oneYearFromNow.toISOString(),
      maxResults: 2500,
      singleEvents: true,
      orderBy: 'startTime',
    });
  } catch (error: any) {
    // Check for insufficient scopes error
    if (error.message?.includes('insufficient authentication scopes') || 
        error.code === 403 || 
        error.message?.includes('Insufficient Permission')) {
      throw new Error('Insufficient permissions. Please disconnect and reconnect your Google account to grant calendar access.');
    }
    throw error;
  }

  const events = response.data.items || [];
  const syncedEvents = [];

  for (const event of events) {
    if (!event.id || !event.start || !event.end) continue;

    // Extract attendee emails from Google Calendar event
    // Normalize emails: lowercase and trim to ensure consistent filtering
    // Time complexity: O(n) where n = number of attendees, Space: O(n) for the array
    const attendeeEmails = (event.attendees || [])
      .map(attendee => attendee.email?.toLowerCase().trim())
      .filter((email): email is string => !!email);

    // Extract meeting URL - prioritize hangoutLink (Google Meet), then Zoom from description
    // hangoutLink is the Google Meet link if the event has video conferencing
    let meetingUrl = event.hangoutLink || null;
    
    // If no hangoutLink, check for conference data (Google Meet links)
    if (!meetingUrl && event.conferenceData?.entryPoints) {
      const meetLink = event.conferenceData.entryPoints.find(
        (entry: any) => entry.entryPointType === 'video' && entry.uri
      );
      if (meetLink) {
        meetingUrl = meetLink.uri;
      }
    }
    
    // If still no meeting URL, try extracting from description or location
    // Check for Google Meet first, then Zoom
    if (!meetingUrl) {
      const description = event.description || event.location || '';
      meetingUrl = extractGoogleMeetUrl(description) || extractZoomUrl(description);
    }

    const eventData = {
      google_event_id: event.id,
      title: event.summary || 'Untitled Event',
      description: event.description || '',
      start_time: event.start.dateTime || event.start.date,
      end_time: event.end.dateTime || event.end.date,
      organizer_email: event.organizer?.email?.toLowerCase() || email.toLowerCase(),
      attendees_emails: attendeeEmails, // Store all attendee emails for filtering
      zoom_url: meetingUrl, // Store meeting URL (Zoom or Google Meet)
      location: event.location || null,
      updated_at: new Date().toISOString(),
    };

    // Upsert event
    const { data: upsertedEvent, error: upsertError } = await supabase
      .from('events')
      .upsert(eventData, {
        onConflict: 'google_event_id',
      })
      .select()
      .single();

    if (upsertError) {
      console.error(`Error upserting event ${event.id}:`, upsertError);
      continue;
    }

    if (!upsertedEvent) {
      console.warn(`Event ${event.id} was not upserted`);
      continue;
    }

    // Delete existing user_events mappings for this event
    // This ensures we don't have stale mappings if attendees changed
    const { error: deleteError } = await supabase
      .from('user_events')
      .delete()
      .eq('event_id', upsertedEvent.id);

    if (deleteError) {
      console.warn(`Error deleting old user_events mappings for event ${upsertedEvent.id}:`, deleteError);
    }

    // Create user_events mappings for each attendee email
    // Time complexity: O(A) where A = number of attendees per event
    // Space complexity: O(1) extra per mapping
    console.log(`[Sync] Processing ${attendeeEmails.length} attendees for event: ${eventData.title}`);
    
    let mappingsCreated = 0;
    for (const attendeeEmail of attendeeEmails) {
      // Normalize email for lookup (lowercase and trim)
      const normalizedAttendeeEmail = attendeeEmail.toLowerCase().trim();
      
      // Find member with matching email
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('id, name, email')
        .eq('email', normalizedAttendeeEmail)
        .maybeSingle();

      if (memberError) {
        console.error(`[Sync] Error looking up member for email ${normalizedAttendeeEmail}:`, memberError);
        continue;
      }

      // If member exists, create user_events mapping
      if (member) {
        console.log(`[Sync] Found member: ${member.name} (${member.email}) -> ${member.id}`);
        const { error: mappingError } = await supabase
          .from('user_events')
          .insert({
            user_id: member.id,
            event_id: upsertedEvent.id,
          });

        if (mappingError) {
          // Ignore duplicate key errors (shouldn't happen since we delete first, but just in case)
          if (!mappingError.message.includes('duplicate') && !mappingError.message.includes('unique')) {
            console.error(`[Sync] Error creating user_events mapping for user ${member.id} and event ${upsertedEvent.id}:`, mappingError);
          } else {
            console.log(`[Sync] Mapping already exists for user ${member.id} and event ${upsertedEvent.id}`);
          }
        } else {
          mappingsCreated++;
          console.log(`[Sync] ✓ Created user_events mapping: user ${member.id} (${member.email}) -> event ${upsertedEvent.id} (${eventData.title})`);
        }
      } else {
        // Member not found - this is okay, they might not be registered yet
        console.log(`[Sync] ⚠ No member found for attendee email: ${normalizedAttendeeEmail} (event: ${eventData.title})`);
      }
    }
    
    console.log(`[Sync] Created ${mappingsCreated} mappings for event: ${eventData.title}`);

    syncedEvents.push(eventData);
  }

  return {
    synced: syncedEvents.length,
    total: events.length,
  };
}

/**
 * Extract Zoom URL from text
 */
function extractZoomUrl(text: string): string | null {
  const zoomPattern = /https?:\/\/(?:[a-z0-9-]+\.)?zoom\.us\/(?:j\/|my\/|s\/)?[\d\w-]+/i;
  const match = text.match(zoomPattern);
  return match ? match[0] : null;
}

/**
 * Extract Google Meet URL from text
 */
function extractGoogleMeetUrl(text: string): string | null {
  const meetPattern = /https?:\/\/meet\.google\.com\/[a-z-]+/i;
  const match = text.match(meetPattern);
  return match ? match[0] : null;
}

/**
 * Get events for a specific user (using user_events join table)
 * This uses the explicit join table instead of filtering by email arrays
 * Time complexity: O(k) where k = number of events mapped to that user
 * Space complexity: O(k) to hold the list of events
 */
export async function getUserEvents(userId: string) {
  const supabase = getSupabase();
  
  console.log(`[getUserEvents] Querying events for userId: ${userId} (type: ${typeof userId})`);
  
  // Query user_events join table to get event IDs for this user
  const { data: userEventMappings, error: mappingError } = await supabase
    .from('user_events')
    .select('event_id')
    .eq('user_id', userId);

  if (mappingError) {
    console.error(`[getUserEvents] Error fetching mappings:`, mappingError);
    throw new Error(`Failed to fetch user event mappings: ${mappingError.message}`);
  }

  console.log(`[getUserEvents] Found ${userEventMappings?.length || 0} mappings for user ${userId}`);
  
  if (!userEventMappings || userEventMappings.length === 0) {
    console.log(`[getUserEvents] No event mappings found for user ${userId}`);
    // Debug: Check if user_events table has any data at all
    const { data: allMappings } = await supabase
      .from('user_events')
      .select('user_id, event_id')
      .limit(5);
    console.log(`[getUserEvents] Sample mappings in table:`, allMappings);
    return [];
  }

  // Extract event IDs
  const eventIds = userEventMappings.map((mapping: any) => mapping.event_id);
  console.log(`[getUserEvents] Event IDs to fetch:`, eventIds);

  // Query events for those IDs
  // Show all events (both past and future) - members should see all events they were invited to
  // Events will be categorized on the frontend into Today/Upcoming/Past
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .in('id', eventIds)
    .order('start_time', { ascending: true }); // Order by start time ascending (past first, then future)

  if (eventsError) {
    console.error(`[getUserEvents] Error fetching events:`, eventsError);
    throw new Error(`Failed to fetch events: ${eventsError.message}`);
  }

  console.log(`[getUserEvents] Found ${events?.length || 0} events for user ${userId}`);
  if (events && events.length > 0) {
    console.log(`[getUserEvents] Event titles:`, events.map((e: any) => e.title));
  }
  return events || [];
}

