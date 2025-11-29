import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * POST /api/admin/members/bulk-delete
 * Delete multiple members and all associated data
 * Admin-only endpoint
 * Body: { ids: string[] }
 */
export async function POST(req: NextRequest) {
  try {
    const { ids } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'ids array is required and must not be empty' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Delete related data first for all members
    
    // Delete coaching requests
    await supabase
      .from('coaching_requests')
      .delete()
      .in('user_id', ids);

    // Delete user skill content progress
    await supabase
      .from('user_skill_content_progress')
      .delete()
      .in('user_id', ids);

    // Delete member skills
    await supabase
      .from('member_skills')
      .delete()
      .in('member_id', ids);

    // Delete user_event mappings (if table exists)
    try {
      await supabase
        .from('user_events')
        .delete()
        .in('user_id', ids);
    } catch (err) {
      // Table might not exist, that's okay
    }

    // Finally, delete the members (only members, not admins)
    const { error } = await supabase
      .from('members')
      .delete()
      .in('id', ids)
      .eq('role', 'member'); // Safety check: only delete members, not admins

    if (error) {
      throw new Error(`Failed to delete members: ${error.message}`);
    }

    return NextResponse.json({ 
      success: true,
      deleted: ids.length,
      message: `Deleted ${ids.length} member${ids.length !== 1 ? 's' : ''} successfully`
    });
  } catch (err: any) {
    console.error('Bulk delete members error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete members' },
      { status: 500 }
    );
  }
}

