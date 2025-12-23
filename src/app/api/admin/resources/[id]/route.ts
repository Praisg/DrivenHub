import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { parseResourceUrl } from '@/lib/resources';

/**
 * GET /api/admin/resources/[id]
 * Get a single resource
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('resources')
      .select(`
        *,
        created_by:members (
          id,
          name,
          email
        )
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch resource: ${error.message}`);
    }

    if (!data) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    return NextResponse.json({ resource: data });
  } catch (err: any) {
    console.error('Get resource error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch resource' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/resources/[id]
 * Update a resource (admin only)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { 
      title, 
      description, 
      url, 
      thumbnailUrl: customThumbnailUrl,
      is_lab_wide,
      visibility_alumni,
      cohorts,
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

    const supabase = getSupabase();

    // Verify user is admin
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (memberError || !member) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (member.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse URL to detect provider and generate thumbnail
    const parsed = parseResourceUrl(url);
    const thumbnailUrl = customThumbnailUrl || parsed.thumbnailUrl || null;

    // Update resource
    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .update({
        title,
        description: description || null,
        url,
        thumbnail_url: thumbnailUrl,
        provider: parsed.provider,
        is_lab_wide: is_lab_wide ?? true,
        visibility_alumni: visibility_alumni ?? false,
        cohorts: cohorts || [],
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (resourceError) {
      throw new Error(`Failed to update resource: ${resourceError.message}`);
    }

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    return NextResponse.json({ resource });
  } catch (err: any) {
    console.error('Update resource error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to update resource' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/resources/[id]
 * Delete a resource (admin only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Verify user is admin
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (memberError || !member) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (member.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Delete resource
    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('id', params.id);

    if (error) {
      throw new Error(`Failed to delete resource: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Delete resource error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete resource' },
      { status: 500 }
    );
  }
}
