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
    const searchParams = req.nextUrl.searchParams;
    const adminUserId = searchParams.get('adminUserId');

    if (!adminUserId) {
      return NextResponse.json(
        { error: 'Admin user ID is required. Please ensure you are logged in.' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Verify admin user is actually an admin
    const { data: admin, error: adminError } = await supabase
      .from('members')
      .select('id, role')
      .eq('id', adminUserId)
      .single();

    if (adminError || !admin) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      );
    }

    if (admin.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Delete related data first (cascade should handle most, but we'll be explicit)
    // Order matters: delete child records before parent to avoid foreign key issues
    
    // Delete password reset tokens
    try {
      await supabase
        .from('password_reset_tokens')
        .delete()
        .eq('user_id', id);
    } catch (err) {
      console.warn('Error deleting password reset tokens (table may not exist):', err);
    }

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
      console.warn('Error deleting user_events (table may not exist):', err);
    }

    // Delete google_oauth_tokens (if exists and has user_id)
    try {
      await supabase
        .from('google_oauth_tokens')
        .delete()
        .eq('user_id', id);
    } catch (err) {
      // Table might not exist or column name might be different, that's okay
      console.warn('Error deleting google_oauth_tokens (table may not exist or have different schema):', err);
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

