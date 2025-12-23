import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { parseResourceUrl } from '@/lib/resources';

/**
 * GET /api/admin/resources/[id]
 * Get a single resource detail, including assigned member IDs.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('resources')
      .select('*')
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

    const { data: assignments } = await supabase
      .from('resource_assignments')
      .select('member_id')
      .eq('resource_id', params.id);

    const assigned_member_ids = (assignments || []).map(
      (a: any) => a.member_id
    );

    return NextResponse.json({
      resource: {
        ...data,
        assigned_member_ids,
      },
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
 * Update resource metadata and member assignments.
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
      assigned_member_ids,
      userId,
    } = body;

    const supabase = getSupabaseAdmin();

    // Verify admin status
    const { data: adminMember, error: memberError } = await supabase
      .from('members')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (memberError || !adminMember || adminMember.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const parsed = parseResourceUrl(url);
    const thumbnailUrl = customThumbnailUrl || parsed.thumbnailUrl || null;

    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .update({
        title,
        description: description || null,
        url,
        thumbnail_url: thumbnailUrl,
        provider: parsed.provider,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (resourceError) {
      throw new Error(`Failed to update resource: ${resourceError.message}`);
    }

    // Replace assignments
    await supabase
      .from('resource_assignments')
      .delete()
      .eq('resource_id', params.id);

    if (
      assigned_member_ids &&
      Array.isArray(assigned_member_ids) &&
      assigned_member_ids.length > 0
    ) {
      const assignments = assigned_member_ids.map((memberId: string) => ({
        resource_id: params.id,
        member_id: memberId,
      }));

      await supabase.from('resource_assignments').insert(assignments);
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
 * Remove a resource (assignments cascade via FK).
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    const supabase = getSupabaseAdmin();

    // Verify admin status
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (memberError || !member || member.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

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
