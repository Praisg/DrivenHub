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
        category:resource_categories (
          id,
          name,
          sort_order
        ),
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
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    // Get assigned members if visibility is 'selected'
    let assignedMembers: any[] = [];
    if (data.visibility === 'selected') {
      const { data: assignments } = await supabase
        .from('resource_assignments')
        .select(`
          member_id,
          member:members (
            id,
            name,
            email
          )
        `)
        .eq('resource_id', params.id);

      assignedMembers = (assignments || []).map((a: any) => a.member);
    }

    return NextResponse.json({ 
      resource: {
        ...data,
        assignedMembers,
      }
    });
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

    const supabase = getSupabase();

    // Verify user is admin
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

    // Update resource
    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .update({
        title,
        description: description || null,
        url,
        category_id: categoryId || null,
        cover_image_url: coverImageUrl || null,
        thumbnail_url: thumbnailUrl,
        provider: parsed.provider,
        visibility: visibility || 'all',
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (resourceError) {
      throw new Error(`Failed to update resource: ${resourceError.message}`);
    }

    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    // Update assignments
    // Delete existing assignments
    await supabase
      .from('resource_assignments')
      .delete()
      .eq('resource_id', params.id);

    // Insert new assignments if visibility is 'selected'
    if (visibility === 'selected' && selectedMemberIds && selectedMemberIds.length > 0) {
      const assignments = selectedMemberIds.map((memberId: string) => ({
        resource_id: params.id,
        member_id: memberId,
      }));

      const { error: assignmentError } = await supabase
        .from('resource_assignments')
        .insert(assignments);

      if (assignmentError) {
        console.error('Error updating assignments:', assignmentError);
      }
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

    // Delete resource (assignments will cascade delete)
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

