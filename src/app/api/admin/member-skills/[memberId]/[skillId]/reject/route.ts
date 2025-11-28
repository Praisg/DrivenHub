import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * POST /api/admin/member-skills/[memberId]/[skillId]/reject
 * Rejects a member's skill assignment
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { memberId: string; skillId: string } }
) {
  try {
    const { memberId, skillId } = params;
    const supabase = getSupabase();

    // Get all content items for this skill
    const { data: contentItems } = await supabase
      .from('skill_content')
      .select('id')
      .eq('skill_id', skillId);

    const contentIds = (contentItems || []).map((c: any) => c.id);

    // Delete all user progress for this skill (reset to 0%)
    // This ensures progress goes back to 0% when admin rejects
    if (contentIds.length > 0) {
      const { error: progressError } = await supabase
        .from('user_skill_content_progress')
        .delete()
        .eq('user_id', memberId)
        .in('content_id', contentIds);

      if (progressError) {
        console.error('Error deleting user progress:', progressError);
        // Continue anyway - main operation is updating member_skills
      }
    }

    // Update member_skills status
    const { error } = await supabase
      .from('member_skills')
      .update({ 
        admin_approved: false,
        status: 'NOT_STARTED'
      })
      .eq('member_id', memberId)
      .eq('skill_id', skillId);

    if (error) {
      throw new Error(`Failed to reject member skill: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Reject member skill error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to reject member skill' },
      { status: 500 }
    );
  }
}

