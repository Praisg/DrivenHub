import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * GET /api/member/skills/[skillId]
 * Gets detailed skill info with content and completion status
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { skillId: string } }
) {
  try {
    const { skillId } = params;
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Verify user has this skill assigned
    const { data: assignment } = await supabase
      .from('member_skills')
      .select('*')
      .eq('member_id', userId)
      .eq('skill_id', skillId)
      .single();

    if (!assignment) {
      return NextResponse.json(
        { error: 'Skill not assigned to user' },
        { status: 403 }
      );
    }

    // Get skill details
    const { data: skill, error: skillError } = await supabase
      .from('skills')
      .select('*')
      .eq('id', skillId)
      .single();

    if (skillError || !skill) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }

    // Get member skill assignment details (for admin approval status and notes)
    const { data: memberSkillAssignment } = await supabase
      .from('member_skills')
      .select('admin_approved, admin_notes, status')
      .eq('member_id', userId)
      .eq('skill_id', skillId)
      .single();

    // Get content items
    const { data: contentItems, error: contentError } = await supabase
      .from('skill_content')
      .select('*')
      .eq('skill_id', skillId)
      .order('display_order', { ascending: true });

    if (contentError) {
      throw new Error(`Failed to fetch content: ${contentError.message}`);
    }

    // Get completion status for each content item
    const contentIds = (contentItems || []).map((c: any) => c.id);
    const { data: progressData } = await supabase
      .from('user_skill_content_progress')
      .select('*')
      .eq('user_id', userId)
      .in('content_id', contentIds);

    const progressMap = new Map(
      (progressData || []).map((p: any) => [p.content_id, p.is_completed])
    );

    // Combine content with completion status
    const contentWithProgress = (contentItems || []).map((item: any) => ({
      ...item,
      isCompleted: progressMap.get(item.id) || false,
    }));

    // Calculate overall progress
    const totalCount = contentWithProgress.length;
    const completedCount = contentWithProgress.filter((c) => c.isCompleted).length;
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return NextResponse.json({
      skill: {
        ...skill,
        adminApproved: memberSkillAssignment?.admin_approved,
        adminNotes: memberSkillAssignment?.admin_notes,
        status: memberSkillAssignment?.status,
      },
      contentItems: contentWithProgress,
      progress,
      completedCount,
      totalCount,
    });
  } catch (err: any) {
    console.error('Get skill detail error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch skill details' },
      { status: 500 }
    );
  }
}

