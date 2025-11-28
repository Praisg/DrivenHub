import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * GET /api/admin/skills/test-storage
 * Test endpoint to diagnose storage bucket access issues
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const results: any = {
      bucketName: 'skill-content',
      checks: {},
    };

    // Test 1: List buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    results.checks.listBuckets = {
      success: !listError,
      error: listError?.message || null,
      bucketsFound: buckets?.map(b => ({ name: b.name, public: b.public })) || [],
      bucketExists: buckets?.some(b => b.name === 'skill-content') || false,
    };

    // Test 2: Try to get bucket info
    const { data: bucketInfo, error: bucketError } = await supabase.storage.getBucket('skill-content');
    results.checks.getBucket = {
      success: !bucketError,
      error: bucketError?.message || null,
      bucketInfo: bucketInfo || null,
    };

    // Test 3: Try to list files in bucket (should work even if empty)
    const { data: files, error: listFilesError } = await supabase.storage
      .from('skill-content')
      .list('', { limit: 1 });
    results.checks.listFiles = {
      success: !listFilesError,
      error: listFilesError?.message || null,
      canAccess: !listFilesError,
    };

    // Test 4: Try to upload a small test file
    const testContent = new Blob(['test'], { type: 'text/plain' });
    const testFileName = `test-${Date.now()}.txt`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('skill-content')
      .upload(testFileName, testContent, {
        contentType: 'text/plain',
        upsert: true,
      });
    
    results.checks.testUpload = {
      success: !uploadError,
      error: uploadError?.message || null,
      errorName: uploadError?.name || null,
      errorStatus: uploadError?.statusCode || null,
      fullError: uploadError ? JSON.stringify(uploadError, Object.getOwnPropertyNames(uploadError)) : null,
    };

    // Clean up test file if upload succeeded
    if (!uploadError && uploadData) {
      await supabase.storage.from('skill-content').remove([testFileName]);
    }

    // Summary
    const allChecksPassed = Object.values(results.checks).every((check: any) => check.success);
    results.summary = {
      allChecksPassed,
      recommendation: allChecksPassed 
        ? 'Storage is configured correctly!'
        : 'Storage needs configuration. Check individual checks above.',
    };

    return NextResponse.json(results, { status: allChecksPassed ? 200 : 500 });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: 'Test failed',
        details: err.message,
        stack: err.stack,
      },
      { status: 500 }
    );
  }
}

