import { google } from 'googleapis';
import { getSupabase } from './supabase';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/callback`
);

/**
 * Get Google OAuth authorization URL
 */
export function getGoogleAuthUrl(state?: string): string {
  const scopes = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // Force consent to get refresh token
    state: state,
    include_granted_scopes: true, // Include previously granted scopes
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
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

    // Extract attendee emails
    const attendeeEmails = (event.attendees || [])
      .map(attendee => attendee.email?.toLowerCase())
      .filter((email): email is string => !!email);

    // Extract Zoom URL from description or location
    const zoomUrl = extractZoomUrl(event.description || event.location || '');

    const eventData = {
      google_event_id: event.id,
      title: event.summary || 'Untitled Event',
      description: event.description || '',
      start_time: event.start.dateTime || event.start.date,
      end_time: event.end.dateTime || event.end.date,
      organizer_email: event.organizer?.email?.toLowerCase() || email.toLowerCase(),
      attendees_emails: attendeeEmails,
      zoom_url: zoomUrl,
      location: event.location || null,
      updated_at: new Date().toISOString(),
    };

    // Upsert event
    const { error } = await supabase
      .from('events')
      .upsert(eventData, {
        onConflict: 'google_event_id',
      });

    if (!error) {
      syncedEvents.push(eventData);
    }
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
 * Get events for a specific user (filtered by their email)
 */
export async function getUserEvents(userEmail: string) {
  const supabase = getSupabase();
  
  const normalizedEmail = userEmail.toLowerCase().trim();
  
  // Query events where the user's email is in the attendees_emails array
  // Using PostgreSQL array contains operator: attendees_emails @> ARRAY[email]
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .contains('attendees_emails', [normalizedEmail])
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true });

  if (error) {
    // If contains doesn't work, try using cs (contains) filter
    console.warn('First query failed, trying alternative:', error.message);
    
    // Alternative approach: filter in JavaScript if Supabase query fails
    const { data: allEvents, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true });
    
    if (fetchError) {
      throw new Error(`Failed to fetch events: ${fetchError.message}`);
    }
    
    // Filter events where user's email is in attendees_emails array
    const filteredEvents = (allEvents || []).filter((event: any) => {
      const attendees = event.attendees_emails || [];
      return Array.isArray(attendees) && attendees.includes(normalizedEmail);
    });
    
    return filteredEvents;
  }

  return data || [];
}

