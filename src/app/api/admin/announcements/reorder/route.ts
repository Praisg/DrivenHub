import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * PUT /api/admin/announcements/reorder
 * Reorder announcements by updating their order_index values
 * Admin only - verifies admin status before allowing reorder
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { announcementIds, userId } = body;

    if (!announcementIds || !Array.isArray(announcementIds) || announcementIds.length === 0) {
      return NextResponse.json(
        { error: 'announcementIds array is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required. Please ensure you are logged in.' },
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

    // Update order_index for each announcement
    // announcementIds array is in the new order (first item = order_index 0, etc.)
    const updates = announcementIds.map((id: string, index: number) => {
      return supabase
        .from('announcements')
        .update({ order_index: index })
        .eq('id', id);
    });

    // Execute all updates
    const results = await Promise.all(updates);

    // Check for errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('Errors updating announcement order:', errors);
      return NextResponse.json(
        { error: 'Failed to update some announcements' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Announcements reordered successfully'
    });
  } catch (err: any) {
    console.error('Reorder announcements error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to reorder announcements' },
      { status: 500 }
    );
  }
}

