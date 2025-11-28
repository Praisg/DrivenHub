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
      // Order by assigned_date ascending, then by id to preserve the order skills were added
      // This ensures skills stay in their original order regardless of status changes
      .order('assigned_date', { ascending: true })
      .order('id', { ascending: true });

    if (memberId) {
      query = query.eq('member_id', memberId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch member skills: ${error.message}`);
    }

    // Group by member and calculate actual progress from content items
    const memberSkillsMap = new Map<string, any>();

    // Calculate progress for each member skill based on content completion
    const memberSkillsWithProgress = await Promise.all(
      (data || []).map(async (ms: any) => {
        // Get all content items for this skill
        const { data: contentItems } = await supabase
          .from('skill_content')
          .select('id')
          .eq('skill_id', ms.skill_id);

        const contentIds = (contentItems || []).map((c: any) => c.id);
        const totalCount = contentIds.length;

        // Calculate completed count for this user+skill
        let completedCount = 0;
        if (totalCount > 0) {
          const { count } = await supabase
            .from('user_skill_content_progress')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', ms.member_id)
            .eq('is_completed', true)
            .in('content_id', contentIds);

          completedCount = count || 0;
        }

        // Calculate actual progress
        const calculatedProgress = totalCount > 0
          ? Math.round((completedCount / totalCount) * 100)
          : 0;

        // Determine status: Priority - Admin actions > User completion > Current status
        const isRejected = ms.admin_approved === false;
        const adminCompleted = ms.status === 'COMPLETED';
        
        let finalStatus = ms.status;
        let finalProgress = ms.progress;

        if (isRejected) {
          // Admin rejected - status stays as is (will be NOT_STARTED from reject endpoint)
          finalStatus = 'NOT_STARTED';
          finalProgress = 0;
        } else if (adminCompleted) {
          // Admin marked as complete
          finalStatus = 'COMPLETED';
          finalProgress = 100;
        } else if (calculatedProgress === 100 && totalCount > 0) {
          // User completed all content items
          finalStatus = 'COMPLETED';
          finalProgress = 100;
        } else if (calculatedProgress > 0) {
          // User has made progress
          finalStatus = 'IN_PROGRESS';
          finalProgress = calculatedProgress;
        } else {
          // No progress yet
          finalStatus = 'NOT_STARTED';
          finalProgress = 0;
        }

        return {
          ...ms,
          status: finalStatus,
          progress: finalProgress,
          completedCount,
          totalCount,
        };
      })
    );

    // Group by member while preserving the original order from the database query
    // The order is preserved because:
    // 1. We ordered by assigned_date, then id in the query
    // 2. Promise.all preserves order of results
    // 3. forEach iterates in order
    // 4. Map preserves insertion order
    memberSkillsWithProgress.forEach((ms: any) => {
      const memberId = ms.member_id;
      if (!memberSkillsMap.has(memberId)) {
        memberSkillsMap.set(memberId, {
          memberId,
          memberName: ms.members?.name || 'Unknown',
          skills: [],
        });
      }

      const memberSkills = memberSkillsMap.get(memberId);
      // Push skills in the order they were fetched (preserves original assignment order)
      memberSkills.skills.push({
        skillId: ms.skill_id,
        skillName: ms.skill_name,
        level: ms.level,
        assignedDate: ms.assigned_date,
        status: ms.status, // This is now the calculated status
        progress: ms.progress, // This is now the calculated progress
        completedCount: ms.completedCount,
        totalCount: ms.totalCount,
        adminApproved: ms.admin_approved,
        adminNotes: ms.admin_notes,
        // Include original id for stable ordering reference
        originalId: ms.id,
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

