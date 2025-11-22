import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * POST /api/member/skills/[skillId]/content/[contentId]/complete
 * Toggles completion status of a content item
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { skillId: string; contentId: string } }
) {
  try {
    const { skillId, contentId } = params;
    const body = await req.json();
    const { userId, isCompleted } = body;

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

    // Verify content belongs to this skill
    const { data: content } = await supabase
      .from('skill_content')
      .select('*')
      .eq('id', contentId)
      .eq('skill_id', skillId)
      .single();

    if (!content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    // Upsert progress record
    const { data: progress, error: progressError } = await supabase
      .from('user_skill_content_progress')
      .upsert({
        user_id: userId,
        content_id: contentId,
        is_completed: isCompleted !== undefined ? isCompleted : true,
        completed_at: isCompleted !== false ? new Date().toISOString() : null,
      }, {
        onConflict: 'user_id,content_id',
      })
      .select()
      .single();

    if (progressError) {
      throw new Error(`Failed to update progress: ${progressError.message}`);
    }

    // Calculate updated progress for the skill
    const { data: allContent } = await supabase
      .from('skill_content')
      .select('id')
      .eq('skill_id', skillId);

    const contentIds = (allContent || []).map((c: any) => c.id);

    const { count: completedCount } = await supabase
      .from('user_skill_content_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_completed', true)
      .in('content_id', contentIds);

    const totalCount = contentIds.length;
    const progressPercent = totalCount > 0
      ? Math.round(((completedCount || 0) / totalCount) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      isCompleted: progress.is_completed,
      progress: progressPercent,
      completedCount: completedCount || 0,
      totalCount,
    });
  } catch (err: any) {
    console.error('Toggle completion error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to update completion status' },
      { status: 500 }
    );
  }
}

