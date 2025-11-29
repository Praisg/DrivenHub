import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, getSupabaseAdmin } from '@/lib/supabase';

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
    const supabaseAdmin = getSupabaseAdmin();

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

    // Use admin client for deletions to bypass RLS
    const adminSupabase = supabaseAdmin;

    // Delete related data first for all members
    // Order matters: delete child records before parent to avoid foreign key issues
    
    // Delete password reset tokens
    try {
      const { error: tokenError } = await adminSupabase
        .from('password_reset_tokens')
        .delete()
        .in('user_id', ids);
      if (tokenError && !tokenError.message.includes('does not exist')) {
        console.warn('Error deleting password reset tokens:', tokenError);
      }
    } catch (err) {
      console.warn('Error deleting password reset tokens (table may not exist):', err);
    }

    // Delete coaching requests
    const { error: coachingError } = await adminSupabase
      .from('coaching_requests')
      .delete()
      .in('user_id', ids);
    if (coachingError) {
      console.error('Error deleting coaching requests:', coachingError);
      throw new Error(`Failed to delete coaching requests: ${coachingError.message}`);
    }

    // Delete user skill content progress
    const { error: progressError } = await adminSupabase
      .from('user_skill_content_progress')
      .delete()
      .in('user_id', ids);
    if (progressError) {
      console.error('Error deleting user skill content progress:', progressError);
      throw new Error(`Failed to delete user skill content progress: ${progressError.message}`);
    }

    // Delete member skills
    const { error: memberSkillsError } = await adminSupabase
      .from('member_skills')
      .delete()
      .in('member_id', ids);
    if (memberSkillsError) {
      console.error('Error deleting member skills:', memberSkillsError);
      throw new Error(`Failed to delete member skills: ${memberSkillsError.message}`);
    }

    // Delete user_event mappings (if table exists)
    try {
      const { error: eventsError } = await adminSupabase
        .from('user_events')
        .delete()
        .in('user_id', ids);
      if (eventsError && !eventsError.message.includes('does not exist')) {
        console.warn('Error deleting user_events:', eventsError);
      }
    } catch (err) {
      console.warn('Error deleting user_events (table may not exist):', err);
    }

    // Delete google_oauth_tokens (if exists and has user_id)
    try {
      const { error: oauthError } = await adminSupabase
        .from('google_oauth_tokens')
        .delete()
        .in('user_id', ids);
      if (oauthError && !oauthError.message.includes('does not exist')) {
        console.warn('Error deleting google_oauth_tokens:', oauthError);
      }
    } catch (err) {
      // Table might not exist or column name might be different, that's okay
      console.warn('Error deleting google_oauth_tokens (table may not exist or have different schema):', err);
    }

    // Finally, delete the members (only members, not admins)
    const { data: deletedMembers, error: deleteError } = await adminSupabase
      .from('members')
      .delete()
      .in('id', ids)
      .eq('role', 'member') // Safety check: only delete members, not admins
      .select('id');

    if (deleteError) {
      console.error('Error deleting members:', deleteError);
      throw new Error(`Failed to delete members: ${deleteError.message}`);
    }

    const deletedCount = deletedMembers?.length || 0;

    if (deletedCount === 0) {
      return NextResponse.json(
        { error: 'No members were deleted. They may not exist or may be admins.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      deleted: deletedCount,
      requested: ids.length,
      message: `Deleted ${deletedCount} of ${ids.length} member${ids.length !== 1 ? 's' : ''} successfully`
    });
  } catch (err: any) {
    console.error('Bulk delete members error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete members' },
      { status: 500 }
    );
  }
}

