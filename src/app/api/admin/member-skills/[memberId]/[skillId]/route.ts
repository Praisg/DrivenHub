import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * DELETE /api/admin/member-skills/[memberId]/[skillId]
 * Removes a skill assignment from a member
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { memberId: string; skillId: string } }
) {
  try {
    const { memberId, skillId } = params;
    const supabase = getSupabase();

    // Get all content items for this skill before deleting
    const { data: contentItems } = await supabase
      .from('skill_content')
      .select('id')
      .eq('skill_id', skillId);

    const contentIds = (contentItems || []).map((c: any) => c.id);

    // Delete all user progress for this skill (remove all progress records)
    // This ensures no orphaned progress data remains
    if (contentIds.length > 0) {
      const { error: progressError } = await supabase
        .from('user_skill_content_progress')
        .delete()
        .eq('user_id', memberId)
        .in('content_id', contentIds);

      if (progressError) {
        console.error('Error deleting user progress:', progressError);
        // Continue anyway - main operation is deleting member_skills
      }
    }

    // Delete from member_skills table
    const { error: deleteError } = await supabase
      .from('member_skills')
      .delete()
      .eq('member_id', memberId)
      .eq('skill_id', skillId);

    if (deleteError) {
      throw new Error(`Failed to delete member skill: ${deleteError.message}`);
    }

    // Also remove from member's assigned_skills JSONB field
    const { data: member } = await supabase
      .from('members')
      .select('assigned_skills')
      .eq('id', memberId)
      .single();

    if (member && member.assigned_skills) {
      const updatedSkills = (member.assigned_skills as any[]).filter(
        (s: any) => s.skillId !== skillId
      );

      await supabase
        .from('members')
        .update({ assigned_skills: updatedSkills })
        .eq('id', memberId);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Delete member skill error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete member skill' },
      { status: 500 }
    );
  }
}

