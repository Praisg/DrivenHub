/**
 * Script to create Supabase Storage bucket for skill content
 * 
 * Usage:
 * 1. Set SUPABASE_SERVICE_ROLE_KEY in your environment (one-time setup)
 * 2. Run: node scripts/create-storage-bucket.js
 * 
 * Note: Service role key should only be used server-side and never exposed to client
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function createStorageBucket() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set in .env.local');
    process.exit(1);
  }

  if (!serviceRoleKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set in .env.local');
    console.log('\n📝 To get your service role key:');
    console.log('   1. Go to Supabase Dashboard → Settings → API');
    console.log('   2. Copy the "service_role" key (NOT the anon key)');
    console.log('   3. Add it to .env.local as: SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
    console.log('   4. ⚠️  NEVER commit this key to git!');
    process.exit(1);
  }

  // Create Supabase client with service role (has admin permissions)
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  console.log('🔄 Checking for existing bucket...');

  // Check if bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error('❌ Error listing buckets:', listError.message);
    process.exit(1);
  }

  const bucketExists = buckets?.some(b => b.name === 'skill-content');

  if (bucketExists) {
    console.log('✅ Bucket "skill-content" already exists!');
    return;
  }

  console.log('📦 Creating bucket "skill-content"...');

  // Create the bucket
  const { data, error } = await supabase.storage.createBucket('skill-content', {
    public: true,
    fileSizeLimit: 52428800, // 50MB
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/epub+zip',
      'application/x-mobipocket-ebook',
      'image/jpeg',
      'image/png',
      'image/gif',
      'video/mp4',
      'audio/mpeg',
    ],
  });

  if (error) {
    console.error('❌ Failed to create bucket:', error.message);
    console.log('\n📝 Manual setup instructions:');
    console.log('   1. Go to Supabase Dashboard → Storage');
    console.log('   2. Click "New bucket"');
    console.log('   3. Name: skill-content');
    console.log('   4. Check "Public bucket"');
    console.log('   5. Click "Create bucket"');
    process.exit(1);
  }

  console.log('✅ Successfully created bucket "skill-content"!');
  console.log('✅ Bucket is public and ready to use.');
}

createStorageBucket().catch(console.error);

