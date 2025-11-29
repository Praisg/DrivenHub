import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * DELETE /api/admin/members/[id]
 * Delete a single member and all associated data
 * Admin-only endpoint
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = getSupabase();

    // Delete related data first (cascade should handle most, but we'll be explicit)
    
    // Delete coaching requests
    await supabase
      .from('coaching_requests')
      .delete()
      .eq('user_id', id);

    // Delete user skill content progress
    await supabase
      .from('user_skill_content_progress')
      .delete()
      .eq('user_id', id);

    // Delete member skills
    await supabase
      .from('member_skills')
      .delete()
      .eq('member_id', id);

    // Delete user_event mappings (if table exists)
    try {
      await supabase
        .from('user_events')
        .delete()
        .eq('user_id', id);
    } catch (err) {
      // Table might not exist, that's okay
    }

    // Finally, delete the member
    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', id)
      .eq('role', 'member'); // Safety check: only delete members, not admins

    if (error) {
      throw new Error(`Failed to delete member: ${error.message}`);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Member deleted successfully'
    });
  } catch (err: any) {
    console.error('Delete member error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete member' },
      { status: 500 }
    );
  }
}

