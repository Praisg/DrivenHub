import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * POST /api/admin/resources/upload
 * Handles file uploads for resources (files and thumbnails)
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'resource' or 'thumbnail'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Ensure bucket exists (best effort)
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketName = 'resources';
    if (!buckets?.some(b => b.name === bucketName)) {
      // In a real app, you might want to create it here if you have permissions
      // For now we assume it's created or will be created via dashboard
    }

    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${type}/${timestamp}-${randomSuffix}-${sanitizedFileName}`;
    
    const fileBuffer = await file.arrayBuffer();
    const fileBlob = new Blob([fileBuffer], { type: file.type });

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileBlob, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Resource upload error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return NextResponse.json({
      url: publicUrl,
      fileName: file.name,
      storagePath: fileName,
    });
  } catch (err: any) {
    console.error('Upload resource error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

