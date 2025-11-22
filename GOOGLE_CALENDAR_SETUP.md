# Google Calendar Integration Setup Guide

This guide explains how to set up Google Calendar integration so that events created in Gmail/Google Calendar with attendee emails will sync to your Hub.

## Overview

The integration works as follows:

1. **Admin creates events in Gmail/Google Calendar** with attendee emails
2. **Admin connects Google account** to the Hub via OAuth
3. **Admin syncs events** from Google Calendar
4. **Users log in** with their email address
5. **Users see only events** where their email appears in the attendee list

## Prerequisites

- Google Cloud Project with Calendar API enabled
- Supabase database set up
- Admin account in the Hub

## Step 1: Set Up Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Calendar API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/google/callback` (for local development)
     - `https://your-domain.com/api/auth/google/callback` (for production)
   - Save and note your **Client ID** and **Client Secret**

## Step 2: Update Database Schema

Run the updated SQL in `supabase-setup.sql` in your Supabase SQL editor. This creates:
- `events` table with attendee emails
- `google_oauth_tokens` table for storing OAuth tokens
- Proper RLS policies

## Step 3: Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For production, update `GOOGLE_REDIRECT_URI` and `NEXT_PUBLIC_APP_URL` to your production domain.

## Step 4: Connect Google Calendar (Admin)

1. Log in as an admin
2. Go to Admin Dashboard > "Google Calendar" tab
3. Click "Connect Google Calendar"
4. Authorize the application in Google's OAuth flow
5. You'll be redirected back to the dashboard

## Step 5: Sync Events

1. In the Admin Dashboard > "Google Calendar" tab
2. Click "Sync Events Now"
3. The system will fetch events from your primary Google Calendar
4. Events will be stored in the database with attendee emails

## Step 6: Create Events in Google Calendar

When creating events in Gmail or Google Calendar:

1. Create a new event
2. Add attendee emails in the "Guests" field
3. Add any Zoom links in the description or location
4. Save the event
5. Sync events in the Hub to import the new event

## How It Works

### Event Filtering

- When a user logs in, their email is used to query events
- Only events where `user.email` is in `attendees_emails[]` are shown
- If a user wasn't invited → they won't see that event

### Database Structure

**Events Table:**
```sql
- id: UUID (primary key)
- google_event_id: TEXT (unique, from Google Calendar)
- title: TEXT
- description: TEXT
- start_time: TIMESTAMP
- end_time: TIMESTAMP
- organizer_email: TEXT
- attendees_emails: TEXT[] (array of email addresses)
- zoom_url: TEXT (extracted from description)
- location: TEXT
```

### API Endpoints

- `GET /api/auth/google` - Initiates OAuth flow
- `GET /api/auth/google/callback` - Handles OAuth callback
- `GET /api/auth/google/check` - Checks if Google is connected
- `POST /api/events/sync` - Syncs events from Google Calendar
- `GET /api/events?email=...` - Gets events for a user (filtered by email)

## Troubleshooting

### "No OAuth token found"
- Make sure you've completed the OAuth flow
- Check that tokens are stored in `google_oauth_tokens` table

### "Failed to sync events"
- Verify Google Calendar API is enabled
- Check that OAuth scopes include `calendar.readonly`
- Ensure your Google account has access to the calendar

### "Users don't see events"
- Verify the user's email matches exactly (case-insensitive)
- Check that the event has attendees in Google Calendar
- Ensure events were synced after attendees were added

### Events not appearing
- Make sure events are in the future (past events are filtered)
- Verify attendee emails match user emails exactly
- Check database for synced events: `SELECT * FROM events WHERE attendees_emails @> ARRAY['user@example.com'];`

## Security Notes

- OAuth tokens are stored securely in Supabase
- Row Level Security (RLS) ensures users only see their events
- Admin access is required to sync events
- Refresh tokens are used to maintain access without re-authentication

## Production Checklist

- [ ] Update `GOOGLE_REDIRECT_URI` to production domain
- [ ] Update `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Add production redirect URI in Google Cloud Console
- [ ] Test OAuth flow in production
- [ ] Test event syncing
- [ ] Verify users can see their events
- [ ] Set up automatic syncing (optional - via cron job)

## Optional: Automatic Syncing

You can set up automatic syncing using:
- Vercel Cron Jobs
- Supabase Edge Functions
- External cron service

Example cron job (runs every hour):
```typescript
// This would be a separate API route or edge function
POST /api/events/sync
Body: { userId, email }
```

