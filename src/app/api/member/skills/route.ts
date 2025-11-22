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
    const { data: skills, error: skillsError } = await supabase
      .from('skills')
      .select('*')
      .in('id', skillIds)
      .eq('is_active', true);

    if (skillsError) {
      throw new Error(`Failed to fetch skills: ${skillsError.message}`);
    }

    // Calculate progress for each skill and get admin status
    const skillsWithProgress = await Promise.all(
      (skills || []).map(async (skill) => {
        // Get total content count
        const { count: totalCount } = await supabase
          .from('skill_content')
          .select('*', { count: 'exact', head: true })
          .eq('skill_id', skill.id);

        // Get completed content count for this user
        const { data: contentItems } = await supabase
          .from('skill_content')
          .select('id')
          .eq('skill_id', skill.id);

        const contentIds = (contentItems || []).map((c: any) => c.id);

        let completedCount = 0;
        if (contentIds.length > 0) {
          const { count } = await supabase
            .from('user_skill_content_progress')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_completed', true)
            .in('content_id', contentIds);

          completedCount = count || 0;
        }

        const progress = totalCount && totalCount > 0
          ? Math.round((completedCount / totalCount) * 100)
          : 0;

        // Get member skill assignment details (for admin approval status and notes)
        const { data: memberSkillAssignment } = await supabase
          .from('member_skills')
          .select('admin_approved, admin_notes, status')
          .eq('member_id', userId)
          .eq('skill_id', skill.id)
          .single();

        return {
          ...skill,
          progress,
          completedCount,
          totalCount: totalCount || 0,
          adminApproved: memberSkillAssignment?.admin_approved,
          adminNotes: memberSkillAssignment?.admin_notes,
          status: memberSkillAssignment?.status || 'NOT_STARTED',
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

