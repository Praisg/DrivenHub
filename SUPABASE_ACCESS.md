# How to Access Your Supabase Project

## Step 1: Sign Up / Log In

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"** (if new) or **"Sign In"** (if you have an account)
3. Sign in with GitHub, Google, or email

## Step 2: Create a New Project (if you don't have one)

1. Once logged in, click **"New Project"**
2. Fill in:
   - **Name**: Your project name (e.g., "Hub" or "Member Hub")
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free tier is fine for development
3. Click **"Create new project"**
4. Wait 2-3 minutes for project to initialize

## Step 3: Access Your Project Dashboard

1. After project creation, you'll be in your project dashboard
2. If you have multiple projects, select the one you want from the project dropdown (top left)

## Step 4: Find Your Project URL and API Keys

1. In your project dashboard, click **"Settings"** (gear icon in left sidebar)
2. Click **"API"** in the settings menu
3. You'll see:
   - **Project URL**: `https://xxxxx.supabase.co` (this is your `NEXT_PUBLIC_SUPABASE_URL`)
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

**Copy these values** - you'll need them for your `.env.local` file!

## Step 5: Access the SQL Editor

1. In your project dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New query"** button (top right)
3. This opens a SQL editor where you can run SQL commands

## Step 6: Run the Database Setup Script

1. Open the SQL editor (see Step 5)
2. Open the file `supabase-setup.sql` from your project
3. Copy **ALL** the SQL code from that file
4. Paste it into the SQL editor
5. Click **"Run"** button (or press `Cmd+Enter` / `Ctrl+Enter`)
6. You should see "Success. No rows returned" - this means it worked!

## Step 7: Verify Tables Were Created

1. In your project dashboard, click **"Table Editor"** in the left sidebar
2. You should see these tables:
   - `members`
   - `member_skills`
   - `skills`
   - `events` (new!)
   - `google_oauth_tokens` (new!)

## Quick Links

- **Dashboard**: https://app.supabase.com/project/_/overview
- **SQL Editor**: https://app.supabase.com/project/_/sql
- **Table Editor**: https://app.supabase.com/project/_/editor
- **API Settings**: https://app.supabase.com/project/_/settings/api

## Troubleshooting

### "I can't find my project"
- Check if you're logged in with the correct account
- Look in the project dropdown (top left) - you might have multiple projects

### "I forgot my database password"
- Go to Settings > Database
- You can reset it, but you'll need to update any connections

### "SQL script failed"
- Make sure you copied the ENTIRE script
- Check for error messages in the SQL editor
- Some tables might already exist - that's okay, the script uses `CREATE TABLE IF NOT EXISTS` where possible

### "Where do I find my API keys?"
- Settings > API
- Look for "Project URL" and "anon public" key
- These are safe to use in frontend code (they're public keys)

## Next Steps

After setting up Supabase:

1. Create `.env.local` file in your project root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. Restart your dev server:
   ```bash
   npm run dev
   ```

3. Test the connection by logging in or registering a member

