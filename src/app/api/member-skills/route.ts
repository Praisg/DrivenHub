import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * GET /api/member-skills
 * Gets all member skills from the database
 * Optional query params: memberId (to filter by member)
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const memberId = searchParams.get('memberId');

    const supabase = getSupabase();

    let query = supabase
      .from('member_skills')
      .select(`
        *,
        members (
          id,
          name,
          email
        )
      `)
      .order('assigned_date', { ascending: false });

    if (memberId) {
      query = query.eq('member_id', memberId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch member skills: ${error.message}`);
    }

    // Group by member
    const memberSkillsMap = new Map<string, any>();

    (data || []).forEach((ms: any) => {
      const memberId = ms.member_id;
      if (!memberSkillsMap.has(memberId)) {
        memberSkillsMap.set(memberId, {
          memberId,
          memberName: ms.members?.name || 'Unknown',
          skills: [],
        });
      }

      const memberSkills = memberSkillsMap.get(memberId);
      memberSkills.skills.push({
        skillId: ms.skill_id,
        skillName: ms.skill_name,
        level: ms.level,
        assignedDate: ms.assigned_date,
        status: ms.status,
        progress: ms.progress,
        adminApproved: ms.admin_approved,
        adminNotes: ms.admin_notes,
        currentMilestone: ms.current_milestone || 'milestone-1',
        completedMilestones: ms.completed_milestones || [],
        milestoneProgress: ms.milestone_progress || {
          'milestone-1': { completed: false, progress: 0 },
          'milestone-2': { completed: false, progress: 0 },
          'milestone-3': { completed: false, progress: 0 },
          'milestone-4': { completed: false, progress: 0 },
        },
        nextTask: ms.next_task || 'Start learning this skill',
        achievements: ms.achievements || [],
        completionDate: ms.completion_date,
      });
    });

    const memberSkillsArray = Array.from(memberSkillsMap.values());

    return NextResponse.json({ memberSkills: memberSkillsArray });
  } catch (err: any) {
    console.error('Get member skills error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch member skills' },
      { status: 500 }
    );
  }
}

