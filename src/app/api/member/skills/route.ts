import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * GET /api/member/skills
 * Gets all skills assigned to the logged-in member with progress
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Get member's assigned skills from member_skills table
    const { data: memberSkills, error: memberSkillsError } = await supabase
      .from('member_skills')
      .select('skill_id')
      .eq('member_id', userId);

    if (memberSkillsError) {
      throw new Error(`Failed to fetch member skills: ${memberSkillsError.message}`);
    }

    const skillIds = (memberSkills || []).map((ms: any) => ms.skill_id);

    if (skillIds.length === 0) {
      return NextResponse.json({ skills: [] });
    }

    // Get skill details (only active skills)
    // Note: We still show skills even if admin rejected them (they'll show 0% progress)
    const { data: skills, error: skillsError } = await supabase
      .from('skills')
      .select('*')
      .in('id', skillIds)
      .eq('is_active', true);

    if (skillsError) {
      throw new Error(`Failed to fetch skills: ${skillsError.message}`);
    }

    // Calculate progress for each skill and get admin status
    // Time complexity: O(n*m) where n = skills, m = content items per skill
    // Space complexity: O(1) per skill (only storing counts)
    const skillsWithProgress = await Promise.all(
      (skills || []).map(async (skill) => {
        // Get all content items for this skill
        // Time: O(m) where m = content items, Space: O(m) for the array
        const { data: contentItems } = await supabase
          .from('skill_content')
          .select('id')
          .eq('skill_id', skill.id);

        const contentIds = (contentItems || []).map((c: any) => c.id);
        const totalCount = contentIds.length;

        // Calculate completed count for this user
        // Time: O(m) - single query with IN clause, Space: O(1) - only count
        let completedCount = 0;
        if (totalCount > 0) {
          const { count } = await supabase
            .from('user_skill_content_progress')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_completed', true)
            .in('content_id', contentIds);

          completedCount = count || 0;
        }

        // Calculate progress percentage
        // Time: O(1), Space: O(1)
        const progress = totalCount > 0
          ? Math.round((completedCount / totalCount) * 100)
          : 0;

        // Get member skill assignment details (for admin approval status, notes, and status)
        const { data: memberSkillAssignment, error: assignmentError } = await supabase
          .from('member_skills')
          .select('admin_approved, admin_notes, status')
          .eq('member_id', userId)
          .eq('skill_id', skill.id)
          .maybeSingle(); // Use maybeSingle() instead of single() to handle null gracefully

        if (assignmentError) {
          console.error(`Error fetching member skill assignment for skill ${skill.id}:`, assignmentError);
        }

        const assignmentStatus = (memberSkillAssignment?.status || 'NOT_STARTED').toUpperCase();
        // Explicitly check for false (not null or undefined) - rejected skills have admin_approved = false
        const isRejected = memberSkillAssignment?.admin_approved === false;
        
        // Debug logging (can remove later)
        console.log(`Skill "${skill.name}" (${skill.id}): status="${assignmentStatus}", isRejected=${isRejected}, adminApproved=${memberSkillAssignment?.admin_approved}, calculatedProgress=${progress}, totalCount=${totalCount}, completedCount=${completedCount}`);
        
        // Determine if skill is completed by admin
        const isCompleted = assignmentStatus === 'COMPLETED' && !isRejected;
        
        // Priority: Rejection overrides completion
        // If admin rejected, force progress to 0% regardless of status
        // If admin marked as COMPLETED (and not rejected), force progress to 100%
        // Otherwise use calculated progress
        let finalProgress: number;
        let effectiveCompletedCount: number;
        
        if (isRejected) {
          // Rejection takes priority - always show 0%
          finalProgress = 0;
          effectiveCompletedCount = 0;
        } else if (isCompleted) {
          // Admin-completed override: treat everything as done
          finalProgress = 100;
          effectiveCompletedCount = totalCount; // All items considered completed
        } else {
          // Use calculated progress based on content completion
          finalProgress = totalCount > 0
            ? Math.round((completedCount / totalCount) * 100)
            : 0;
          effectiveCompletedCount = completedCount;
        }

        return {
          ...skill,
          progress: finalProgress,
          completedCount: effectiveCompletedCount,
          totalCount: totalCount || 0,
          adminApproved: memberSkillAssignment?.admin_approved,
          adminNotes: memberSkillAssignment?.admin_notes,
          status: assignmentStatus,
          isCompleted: isCompleted, // Add explicit flag for UI
        };
      })
    );

    return NextResponse.json({ skills: skillsWithProgress });
  } catch (err: any) {
    console.error('Get member skills error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}

