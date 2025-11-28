import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * POST /api/admin/assign-skills
 * Assigns skills to members in the database
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { memberId, skills } = body;

    if (!memberId || !skills || !Array.isArray(skills)) {
      return NextResponse.json(
        { error: 'Missing memberId or skills array' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Update member's assigned_skills JSONB field
    const { error: updateError } = await supabase
      .from('members')
      .update({ assigned_skills: skills })
      .eq('id', memberId);

    if (updateError) {
      throw new Error(`Failed to update member skills: ${updateError.message}`);
    }

    // Also insert/update in member_skills table for better querying
    // First, delete existing assignments for this member
    await supabase
      .from('member_skills')
      .delete()
      .eq('member_id', memberId);

    // Insert new skill assignments
    if (skills.length > 0) {
      const memberSkillsInserts = skills.map((skill: any) => ({
        member_id: memberId,
        skill_id: skill.skillId,
        skill_name: skill.skillName,
        level: skill.level,
        progress: skill.progress || 0,
        status: skill.status || 'NOT_STARTED',
        assigned_date: skill.assignedDate || new Date().toISOString(),
        // Don't set admin_approved to false by default - leave it as null for new assignments
        // Only set to false if explicitly rejected, true if explicitly approved
        admin_approved: skill.adminApproved !== undefined ? skill.adminApproved : null,
        current_milestone: skill.currentMilestone || 'milestone-1',
        completed_milestones: skill.completedMilestones || [],
        milestone_progress: skill.milestoneProgress || {},
        next_task: skill.nextTask || 'Start learning this skill',
        achievements: skill.achievements || [],
        completion_date: skill.completionDate || null,
        admin_notes: skill.adminNotes || null,
      }));

      const { error: insertError } = await supabase
        .from('member_skills')
        .insert(memberSkillsInserts);

      if (insertError) {
        console.error('Error inserting member_skills:', insertError);
        // Don't fail the whole operation if member_skills insert fails
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Assign skills error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to assign skills' },
      { status: 500 }
    );
  }
}

