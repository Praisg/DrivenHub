# Database Setup Instructions

## Quick Setup

1. **Go to your Supabase SQL Editor:**
   - Visit: https://app.supabase.com/project/wbleojuizxhjojwhhfqo/sql/new

2. **Copy and paste the entire contents of `supabase-setup-complete.sql`**

3. **Click "Run"** (or press Cmd+Enter / Ctrl+Enter)

4. **Verify the setup:**
   - Check the results at the bottom - you should see:
     - 5 tables listed (members, member_skills, skills, events, google_oauth_tokens)
     - Your admin user (praisegavi with gavipraise@gmail.com)
     - 6 skills inserted

## What This Creates

### Tables:
- ✅ `members` - User accounts (admin/member)
- ✅ `member_skills` - Skills assigned to members
- ✅ `skills` - Available skills library
- ✅ `events` - Google Calendar events with attendee emails
- ✅ `google_oauth_tokens` - OAuth tokens for Google Calendar sync

### Initial Data:
- ✅ Admin user: **praisegavi** (gavipraise@gmail.com)
- ✅ 6 sample skills (JavaScript, React, Node.js, etc.)

### Security:
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Policies configured (permissive for development - you can tighten later)

## After Running the Script

1. **Test admin login:**
   - Go to http://localhost:3000/admin/login
   - Enter email: `gavipraise@gmail.com`
   - You should be able to access the admin dashboard

2. **Test Google Calendar integration:**
   - Log in as admin
   - Go to Admin Dashboard → Google Calendar tab
   - Connect your Google account
   - Sync events

3. **Test member registration:**
   - Go to http://localhost:3000/register
   - Register a new member
   - Log in at http://localhost:3000/member/login

## Troubleshooting

### "relation already exists" errors
- This means tables already exist - that's okay!
- The script uses `CREATE TABLE IF NOT EXISTS` so it's safe to run multiple times

### "policy already exists" errors
- The script drops and recreates policies, so this shouldn't happen
- If it does, you can ignore it or manually drop the policy first

### Can't log in as admin
- Verify the admin user exists:
  ```sql
  SELECT * FROM members WHERE email = 'gavipraise@gmail.com';
  ```
- Make sure the role is 'admin' (not 'Admin' or 'ADMIN')

## Next Steps

Once the database is set up:
1. ✅ Restart your dev server: `npm run dev`
2. ✅ Test admin login
3. ✅ Set up Google Calendar OAuth (if not done already)
4. ✅ Start syncing events!

