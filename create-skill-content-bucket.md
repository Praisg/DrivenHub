# Create Supabase Storage Bucket for Skill Content

## Steps to Create the Bucket

1. **Go to Supabase Dashboard**
   - Navigate to your Supabase project
   - Go to **Storage** section in the left sidebar

2. **Create New Bucket**
   - Click **"New bucket"** or **"Create bucket"**
   - Bucket name: `skill-content`
   - **Important**: Make it **Public** (check the "Public bucket" option)
   - Click **"Create bucket"**

3. **Set Bucket Policies (if needed)**
   - Go to **Storage** → **Policies**
   - Select the `skill-content` bucket
   - Ensure there are policies that allow:
     - **SELECT** (read) for all users
     - **INSERT** (upload) for authenticated users or service role
     - **UPDATE** (update) for authenticated users or service role
     - **DELETE** (delete) for authenticated users or service role

## Alternative: Use Proxy Route (Already Implemented)

If you prefer not to make the bucket public, the code now includes a proxy route at `/api/skills/content/[filePath]` that will serve files securely through your API.

The upload endpoint will return a proxy URL that routes through your API, ensuring files are accessible even if the bucket is private.

## Verify Upload Works

After creating the bucket:
1. Try uploading a file when creating/editing a skill
2. Check the browser console for any errors
3. The file URL should be either:
   - A Supabase public URL (if bucket is public)
   - A proxy URL like `/api/skills/content/...` (if using proxy route)

