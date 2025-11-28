# Supabase Storage Setup for Skill Content

## Quick Setup (Recommended)

### Option 1: Manual Setup (Easiest)

1. **Go to Supabase Dashboard**
   - Navigate to [supabase.com](https://supabase.com)
   - Select your project

2. **Create Storage Bucket**
   - Click **"Storage"** in the left sidebar
   - Click **"New bucket"** button
   - **Bucket name**: `skill-content`
   - ✅ **Check "Public bucket"** (important!)
   - Click **"Create bucket"**

3. **Set Up Storage Policies** (IMPORTANT!)
   - Go to Supabase Dashboard → SQL Editor
   - Copy and run the SQL from `setup-storage-policies.sql`
   - This allows your app to upload files to the bucket
   - Click "Run" to execute the SQL

4. **Verify**
   - You should see `skill-content` in your buckets list
   - Status should show as "Public"
   - Go to Storage → Policies → skill-content
   - You should see policies allowing SELECT, INSERT, UPDATE, DELETE

### Option 2: Automated Setup (One-time)

If you have your service role key (for one-time setup only):

1. **Get Service Role Key**
   - Go to Supabase Dashboard → Settings → API
   - Copy the **"service_role"** key (NOT the anon key)
   - ⚠️ **NEVER commit this key to git!**

2. **Add to .env.local**
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

3. **Run Setup Script**
   ```bash
   node scripts/create-storage-bucket.js
   ```

4. **Remove Service Role Key** (after setup)
   - Remove `SUPABASE_SERVICE_ROLE_KEY` from `.env.local`
   - It's only needed once for bucket creation

## Bucket Configuration

- **Name**: `skill-content`
- **Public**: Yes (required for file access)
- **File Size Limit**: 50MB
- **Allowed Types**: PDF, DOC, DOCX, TXT, EPUB, MOBI, Images, Videos, Audio

## Troubleshooting

### Error: "Bucket not found"
- Make sure you created the bucket named exactly `skill-content`
- Check that it's marked as "Public"

### Error: "Permission denied" or "Bucket not found" (even though bucket exists)
- **This is the most common issue!**
- The bucket exists but storage policies are not set up
- **Solution**: Run `setup-storage-policies.sql` in SQL Editor
- Go to Storage → Policies → skill-content to verify policies exist
- Policies should allow: SELECT, INSERT, UPDATE, DELETE for `skill-content` bucket

### Files not accessible
- Ensure bucket is public
- Check file URLs are correct
- Verify proxy route is working (`/api/skills/content/...`)

## Security Notes

- Service role key has full admin access - use only for setup
- Never expose service role key in client-side code
- Public bucket means files are accessible via URL (by design for skill content)

