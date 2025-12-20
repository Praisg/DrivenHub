import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { parseResourceUrl } from '@/lib/resources';

/**
 * GET /api/admin/resources
 * Get all resources (admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase();

    // Simplified query - just get resources without joins first
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // Detailed error logging
      console.error('Get resources error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        query: 'SELECT * FROM resources ORDER BY created_at DESC',
      });
      throw new Error(`Failed to fetch resources: ${error.message} (Code: ${error.code || 'unknown'})`);
    }

    return NextResponse.json({ resources: data || [] });
  } catch (err: any) {
    console.error('Get resources error:', {
      message: err.message,
      stack: err.stack,
      error: err,
    });
    return NextResponse.json(
      { 
        error: err.message || 'Failed to fetch resources',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/resources
 * Create a new resource (admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      title, 
      description, 
      url, 
      categoryId, 
      coverImageUrl,
      visibility,
      selectedMemberIds,
      userId 
    } = body;

    if (!title || !url) {
      return NextResponse.json(
        { error: 'Title and URL are required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Verify user is admin
    const supabase = getSupabase();
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (member.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse URL to detect provider and generate thumbnail
    const parsed = parseResourceUrl(url);
    const thumbnailUrl = coverImageUrl || parsed.thumbnailUrl || null;

    // Simplified insert - basic fields only
    const insertData: any = {
      title,
      description: description || null,
      url,
      cover_image_url: coverImageUrl || null,
      thumbnail_url: thumbnailUrl,
      provider: parsed.provider,
      visibility: visibility || 'all',
      created_by: userId,
    };

    // Only add category_id if provided and categories table exists
    if (categoryId) {
      insertData.category_id = categoryId;
    }

    // Create resource
    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .insert(insertData)
      .select()
      .single();

    if (resourceError) {
      // Detailed error logging
      console.error('Create resource error details:', {
        message: resourceError.message,
        code: resourceError.code,
        details: resourceError.details,
        hint: resourceError.hint,
        insertData,
      });
      throw new Error(`Failed to create resource: ${resourceError.message} (Code: ${resourceError.code || 'unknown'})`);
    }

    // Skip assignments for now - keep it simple
    // Can add later once basic create/read works

    return NextResponse.json({ resource }, { status: 201 });
  } catch (err: any) {
    console.error('Create resource error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create resource' },
      { status: 500 }
    );
  }
}

