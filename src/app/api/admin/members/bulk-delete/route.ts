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
    const { ids, adminUserId } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'ids array is required and must not be empty' },
        { status: 400 }
      );
    }

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

    // Delete related data first for all members
    // Order matters: delete child records before parent to avoid foreign key issues
    
    // Delete password reset tokens
    try {
      await supabase
        .from('password_reset_tokens')
        .delete()
        .in('user_id', ids);
    } catch (err) {
      console.warn('Error deleting password reset tokens (table may not exist):', err);
    }

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
      console.warn('Error deleting user_events (table may not exist):', err);
    }

    // Delete google_oauth_tokens (if exists and has user_id)
    try {
      await supabase
        .from('google_oauth_tokens')
        .delete()
        .in('user_id', ids);
    } catch (err) {
      // Table might not exist or column name might be different, that's okay
      console.warn('Error deleting google_oauth_tokens (table may not exist or have different schema):', err);
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

