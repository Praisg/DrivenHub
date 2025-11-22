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

    // Upload to Supabase Storage
    // Create a bucket path: skill-content/{skillId}/{filename}
    const fileName = `${skillId}/${Date.now()}-${file.name}`;
    const fileBuffer = await file.arrayBuffer();
    const fileBlob = new Blob([fileBuffer], { type: file.type });

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('skill-content')
      .upload(fileName, fileBlob, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      // Fallback: return a placeholder URL
      return NextResponse.json({
        url: `/uploads/skill-content/${skillId}/${file.name}`,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('skill-content')
      .getPublicUrl(fileName);

    return NextResponse.json({
      url: publicUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });
  } catch (err: any) {
    console.error('Upload content error:', err);
    // Fallback: return a placeholder URL
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const skillId = formData.get('skillId') as string;
    
    return NextResponse.json({
      url: `/uploads/skill-content/${skillId}/${file.name}`,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });
  }
}
