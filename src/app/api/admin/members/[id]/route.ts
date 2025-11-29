import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, getSupabaseAdmin } from '@/lib/supabase';

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

    // Delete related data first (cascade should handle most, but we'll be explicit)
    // Order matters: delete child records before parent to avoid foreign key issues
    
    // Delete password reset tokens
    try {
      const { error: tokenError } = await adminSupabase
        .from('password_reset_tokens')
        .delete()
        .eq('user_id', id);
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
      .eq('user_id', id);
    if (coachingError) {
      console.error('Error deleting coaching requests:', coachingError);
      throw new Error(`Failed to delete coaching requests: ${coachingError.message}`);
    }

    // Delete user skill content progress
    const { error: progressError } = await adminSupabase
      .from('user_skill_content_progress')
      .delete()
      .eq('user_id', id);
    if (progressError) {
      console.error('Error deleting user skill content progress:', progressError);
      throw new Error(`Failed to delete user skill content progress: ${progressError.message}`);
    }

    // Delete member skills
    const { error: memberSkillsError } = await adminSupabase
      .from('member_skills')
      .delete()
      .eq('member_id', id);
    if (memberSkillsError) {
      console.error('Error deleting member skills:', memberSkillsError);
      throw new Error(`Failed to delete member skills: ${memberSkillsError.message}`);
    }

    // Delete user_event mappings (if table exists)
    try {
      const { error: eventsError } = await adminSupabase
        .from('user_events')
        .delete()
        .eq('user_id', id);
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
        .eq('user_id', id);
      if (oauthError && !oauthError.message.includes('does not exist')) {
        console.warn('Error deleting google_oauth_tokens:', oauthError);
      }
    } catch (err) {
      // Table might not exist or column name might be different, that's okay
      console.warn('Error deleting google_oauth_tokens (table may not exist or have different schema):', err);
    }

    // Finally, delete the member
    const { data: deletedMember, error: deleteError } = await adminSupabase
      .from('members')
      .delete()
      .eq('id', id)
      .eq('role', 'member') // Safety check: only delete members, not admins
      .select('id');

    if (deleteError) {
      console.error('Error deleting member:', deleteError);
      throw new Error(`Failed to delete member: ${deleteError.message}`);
    }

    // Verify that a member was actually deleted
    if (!deletedMember || deletedMember.length === 0) {
      console.warn(`No member found with id ${id} or member is not a regular member (might be admin)`);
      return NextResponse.json(
        { error: 'Member not found or cannot be deleted (may be an admin)' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      deleted: deletedMember.length,
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

