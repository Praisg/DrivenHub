import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * POST /api/admin/skills/upload-content
 * Handles file uploads for skill content items
 * Uploads to Supabase Storage
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const skillId = formData.get('skillId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Try to list buckets to check if bucket exists
    // Note: This might fail due to permissions, but we'll try the upload anyway
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.warn('Could not list buckets (might be permissions issue):', listError.message);
      // Continue anyway - bucket might exist but we can't list it
    } else {
      const bucketExists = buckets?.some(b => b.name === 'skill-content');
      if (!bucketExists) {
        console.warn('Bucket "skill-content" not found in list. Attempting upload anyway...');
        // Continue anyway - might be a timing issue or the bucket was just created
      } else {
        console.log('✅ Bucket "skill-content" found in list');
      }
    }

    // Upload to Supabase Storage
    // Create a bucket path: skill-content/{skillId}/{filename}
    // Use timestamp + random to avoid collisions with multiple uploads
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_'); // Sanitize filename
    const fileName = `${skillId}/${timestamp}-${randomSuffix}-${sanitizedFileName}`;
    const fileBuffer = await file.arrayBuffer();
    const fileBlob = new Blob([fileBuffer], { type: file.type });

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('skill-content')
      .upload(fileName, fileBlob, {
        contentType: file.type,
        upsert: false, // Don't overwrite existing files
      });

    if (uploadError) {
      console.error('❌ Supabase storage upload error:', uploadError);
      console.error('❌ Error name:', uploadError.name);
      console.error('❌ Error message:', uploadError.message);
      console.error('❌ Error status:', uploadError.statusCode);
      console.error('❌ Full error object:', JSON.stringify(uploadError, null, 2));
      
      // Check for different error types
      const errorMessage = (uploadError.message || '').toLowerCase();
      const errorName = (uploadError.name || '').toLowerCase();
      const errorStatus = uploadError.statusCode || '';
      
      // Bucket doesn't exist (404 or specific messages)
      if (
        errorStatus === '404' || 
        errorMessage.includes('bucket not found') || 
        errorMessage.includes('bucket does not exist') ||
        errorMessage.includes('not found') ||
        errorName.includes('notfound')
      ) {
        return NextResponse.json(
          { 
            error: 'Storage bucket "skill-content" does not exist or is not accessible.',
            details: 'Please verify the bucket exists and is public.',
            instructions: [
              '1. Go to Supabase Dashboard → Storage',
              '2. Verify "skill-content" bucket exists',
              '3. Make sure it\'s marked as "Public"',
              '4. If bucket exists, run setup-storage-policies.sql in SQL Editor',
              '5. Try uploading again'
            ],
            technicalDetails: `Status: ${errorStatus}, Message: ${uploadError.message}`,
            helpDoc: 'See STORAGE_SETUP.md for detailed instructions'
          },
          { status: 500 }
        );
      }
      
      // Permission denied / RLS policy issue (403 or specific messages)
      if (
        errorStatus === '403' ||
        errorMessage.includes('permission') || 
        errorMessage.includes('policy') || 
        errorMessage.includes('row-level security') ||
        errorMessage.includes('new row violates row-level security') ||
        errorMessage.includes('rlspolicy') ||
        errorName.includes('forbidden')
      ) {
        return NextResponse.json(
          { 
            error: 'Permission denied: Storage policies not configured.',
            details: 'The bucket exists but upload permissions are not set up.',
            instructions: [
              '1. Go to Supabase Dashboard → SQL Editor',
              '2. Copy and run the SQL from setup-storage-policies.sql',
              '3. Click "Run" to execute',
              '4. Verify policies exist: Storage → Policies → skill-content',
              '5. Try uploading again'
            ],
            technicalDetails: `Status: ${errorStatus}, Message: ${uploadError.message}`,
            helpDoc: 'See STORAGE_SETUP.md for detailed instructions'
          },
          { status: 500 }
        );
      }
      
      // Other errors - return full details for debugging
      return NextResponse.json(
        { 
          error: 'Failed to upload file',
          details: uploadError.message || 'Unknown error',
          errorCode: errorStatus,
          errorName: uploadError.name,
          fullError: JSON.stringify(uploadError, Object.getOwnPropertyNames(uploadError)),
          troubleshooting: 'Check browser console and server logs for more details'
        },
        { status: 500 }
      );
    }

    // Use proxy route for file access (more reliable than public URL)
    // Encode the file path for the proxy route
    const encodedPath = encodeURIComponent(fileName);
    const proxyUrl = `/api/skills/content/${encodedPath}`;

    // Also try to get public URL as fallback
    const { data: { publicUrl } } = supabase.storage
      .from('skill-content')
      .getPublicUrl(fileName);

    return NextResponse.json({
      url: proxyUrl, // Use proxy route for better reliability
      publicUrl: publicUrl, // Also provide public URL as fallback
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      storagePath: fileName, // Store the storage path for reference
    });
  } catch (err: any) {
    console.error('Upload content error:', err);
    return NextResponse.json(
      { 
        error: 'Failed to upload file',
        details: err.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
