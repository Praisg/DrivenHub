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

    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get resources error details:', error);
      throw new Error(`Failed to fetch resources: ${error.message}`);
    }

    return NextResponse.json({ resources: data || [] });
  } catch (err: any) {
    console.error('Get resources error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch resources' },
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
      thumbnailUrl: bodyThumbnailUrl,
      assigned_member_ids,
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
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (member.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse URL to detect provider and generate thumbnail
    const parsed = parseResourceUrl(url);
    const thumbnailUrl = bodyThumbnailUrl || parsed.thumbnailUrl || null;

    // Create the resource record
    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .insert({
        title,
        description: description || null,
        url,
        thumbnail_url: thumbnailUrl,
        provider: parsed.provider,
        created_by: userId,
      })
      .select()
      .single();

    if (resourceError) {
      console.error('Create resource error details:', resourceError);
      throw new Error(`Failed to create resource: ${resourceError.message}`);
    }

    // Handle individual member assignments
    if (assigned_member_ids && Array.isArray(assigned_member_ids) && assigned_member_ids.length > 0) {
      const assignments = assigned_member_ids.map(mId => ({
        resource_id: resource.id,
        member_id: mId,
      }));

      const { error: assignmentError } = await supabase
        .from('resource_assignments')
        .insert(assignments);

      if (assignmentError) {
        console.error('Error creating assignments:', assignmentError);
      }
    }

    return NextResponse.json({ resource }, { status: 201 });
  } catch (err: any) {
    console.error('Create resource error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create resource' },
      { status: 500 }
    );
  }
}
