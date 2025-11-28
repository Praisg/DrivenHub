import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * POST /api/admin/member-skills/[memberId]/[skillId]/complete
 * Marks a member's skill as complete
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

    // Mark ALL content items as completed for this user (100% progress)
    // Time complexity: O(n) where n = content items
    // Space complexity: O(1) - batch upsert
    if (contentIds.length > 0) {
      const now = new Date().toISOString();
      const progressRecords = contentIds.map((contentId: string) => ({
        user_id: memberId,
        content_id: contentId,
        is_completed: true,
        completed_at: now,
      }));

      // Upsert all progress records (mark all as completed)
      const { error: progressError } = await supabase
        .from('user_skill_content_progress')
        .upsert(progressRecords, {
          onConflict: 'user_id,content_id',
        });

      if (progressError) {
        console.error('Error updating user progress:', progressError);
        // Continue anyway - main operation is updating member_skills
      }
    }

    // Update member_skills status to COMPLETED
    // Also set admin_approved to true to override any previous rejection
    const { error } = await supabase
      .from('member_skills')
      .update({ 
        status: 'COMPLETED',
        progress: 100,
        admin_approved: true  // Override rejection if skill was previously rejected
      })
      .eq('member_id', memberId)
      .eq('skill_id', skillId);

    if (error) {
      throw new Error(`Failed to mark skill as complete: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Mark complete error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to mark skill as complete' },
      { status: 500 }
    );
  }
}

