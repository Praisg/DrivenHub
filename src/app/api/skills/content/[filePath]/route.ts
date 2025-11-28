import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * GET /api/skills/content/[filePath]
 * Proxy route to serve files from Supabase Storage
 * This ensures files are accessible even if the bucket isn't public
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { filePath: string } }
) {
  try {
    const { filePath } = params;
    const supabase = getSupabase();

    // Decode the file path (it might be URL encoded)
    // Handle both single and double encoding
    let decodedPath = filePath;
    try {
      decodedPath = decodeURIComponent(filePath);
      // Try decoding again in case it was double-encoded
      if (decodedPath.includes('%')) {
        decodedPath = decodeURIComponent(decodedPath);
      }
    } catch (e) {
      // If decoding fails, use original path
      decodedPath = filePath;
    }

    // Download file from Supabase Storage
    const { data, error } = await supabase.storage
      .from('skill-content')
      .download(decodedPath);

    if (error) {
      console.error('Error downloading file from storage:', error);
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Get file metadata to determine content type
    const { data: fileInfo } = await supabase.storage
      .from('skill-content')
      .list(decodedPath.split('/').slice(0, -1).join('/'), {
        search: decodedPath.split('/').pop(),
      });

    // Determine content type from file extension or use default
    const fileName = decodedPath.split('/').pop() || 'file';
    const contentType = getContentType(fileName);

    // Convert blob to buffer
    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Return file with appropriate headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err: any) {
    console.error('Error serving file:', err);
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    );
  }
}

/**
 * Determine content type from file extension
 */
function getContentType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const contentTypes: { [key: string]: string } = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    txt: 'text/plain',
    epub: 'application/epub+zip',
    mobi: 'application/x-mobipocket-ebook',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    mp4: 'video/mp4',
    mp3: 'audio/mpeg',
  };
  return contentTypes[extension || ''] || 'application/octet-stream';
}

