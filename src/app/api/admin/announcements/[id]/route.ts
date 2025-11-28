import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * GET /api/admin/announcements/[id]
 * Get a single announcement
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('announcements')
      .select(`
        *,
        created_by:members!announcements_created_by_id_fkey (
          id,
          name,
          email
        )
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch announcement: ${error.message}`);
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ announcement: data });
  } catch (err: any) {
    console.error('Get announcement error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch announcement' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/announcements/[id]
 * Update an announcement (admin only)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { title, body: bodyText } = body;

    if (!title || !bodyText) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('announcements')
      .update({
        title,
        body: bodyText,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update announcement: ${error.message}`);
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ announcement: data });
  } catch (err: any) {
    console.error('Update announcement error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to update announcement' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/announcements/[id]
 * Delete an announcement (admin only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabase();

    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', params.id);

    if (error) {
      throw new Error(`Failed to delete announcement: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Delete announcement error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete announcement' },
      { status: 500 }
    );
  }
}

