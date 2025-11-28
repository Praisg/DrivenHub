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
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }
    
    // Note: We toggle based on current state in the database, not from request body
    // This ensures consistent behavior regardless of client state

    const supabase = getSupabase();

    // Verify user has this skill assigned and get admin status
    const { data: assignment } = await supabase
      .from('member_skills')
      .select('admin_approved, status')
      .eq('member_id', userId)
      .eq('skill_id', skillId)
      .single();

    if (!assignment) {
      return NextResponse.json(
        { error: 'Skill not assigned to user' },
        { status: 403 }
      );
    }

    const assignmentStatus = assignment.status || 'NOT_STARTED';
    const isRejected = assignment.admin_approved === false;
    
    // If admin marked as COMPLETED, don't allow user to toggle - always return 100%
    if (assignmentStatus === 'COMPLETED') {
      const { data: allContent } = await supabase
        .from('skill_content')
        .select('id')
        .eq('skill_id', skillId);
      
      const totalCount = (allContent || []).length;
      
      return NextResponse.json({
        success: true,
        isCompleted: true, // All items are completed when admin marks skill as complete
        progress: 100,
        completedCount: totalCount,
        totalCount,
        message: 'Skill marked as complete by admin',
      });
    }
    
    // If admin rejected, don't allow user to toggle - always return 0%
    if (isRejected) {
      return NextResponse.json({
        success: true,
        isCompleted: false,
        progress: 0,
        completedCount: 0,
        totalCount: 0,
        message: 'Skill rejected by admin',
      });
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

    // Get current progress state (if exists)
    const { data: existingProgress } = await supabase
      .from('user_skill_content_progress')
      .select('is_completed')
      .eq('user_id', userId)
      .eq('content_id', contentId)
      .single();

    // Determine new state: toggle if exists, otherwise set to true
    // Time: O(1) - single lookup, Space: O(1)
    const currentState = existingProgress?.is_completed || false;
    const newState = !currentState; // Toggle the state
    const completedAt = newState ? new Date().toISOString() : null;

    // Upsert progress record with toggled state
    const { data: progress, error: progressError } = await supabase
      .from('user_skill_content_progress')
      .upsert({
        user_id: userId,
        content_id: contentId,
        is_completed: newState,
        completed_at: completedAt,
      }, {
        onConflict: 'user_id,content_id',
      })
      .select()
      .single();

    if (progressError) {
      throw new Error(`Failed to update progress: ${progressError.message}`);
    }

    // Calculate updated progress for the skill
    // Time complexity: O(n) where n is number of content items
    // Space complexity: O(1) - only storing counts
    const { data: allContent } = await supabase
      .from('skill_content')
      .select('id')
      .eq('skill_id', skillId);

    const contentIds = (allContent || []).map((c: any) => c.id);
    const totalCount = contentIds.length;

    // If no content items, progress is 0
    if (totalCount === 0) {
      return NextResponse.json({
        success: true,
        isCompleted: progress.is_completed,
        progress: 0,
        completedCount: 0,
        totalCount: 0,
      });
    }

    // Count completed items for this user+skill
    // Single query: O(n) time, O(1) space
    const { count: completedCount } = await supabase
      .from('user_skill_content_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_completed', true)
      .in('content_id', contentIds);

    // Re-check admin status after toggle (in case it changed)
    // This ensures we return the correct progress even if admin status changed
    const { data: updatedAssignment } = await supabase
      .from('member_skills')
      .select('admin_approved, status')
      .eq('member_id', userId)
      .eq('skill_id', skillId)
      .single();
    
    const updatedStatus = updatedAssignment?.status || 'NOT_STARTED';
    const updatedIsRejected = updatedAssignment?.admin_approved === false;
    
    // Calculate progress percentage: O(1) time, O(1) space
    // Priority: Rejection (0%) > Admin Completion (100%) > User Completion (100%) > Calculated progress
    const calculatedProgress = Math.round(((completedCount || 0) / totalCount) * 100);
    const progressPercent = updatedIsRejected
      ? 0
      : updatedStatus === 'COMPLETED'
      ? 100
      : calculatedProgress;
    
    // If admin marked as completed, all items are done
    // If admin rejected, no items are done
    // If user completed all items (100%), update status to COMPLETED
    // Otherwise use calculated count
    const finalCompletedCount = updatedIsRejected
      ? 0
      : updatedStatus === 'COMPLETED'
      ? totalCount
      : completedCount || 0;

    // Auto-update member_skills status based on user progress
    // If user completed all content items (100%), set status to COMPLETED
    // But don't override if admin already set a status (unless it's NOT_STARTED)
    if (!updatedIsRejected && updatedStatus !== 'COMPLETED') {
      if (calculatedProgress === 100 && totalCount > 0) {
        // User completed all content items - update status to COMPLETED
        await supabase
          .from('member_skills')
          .update({ 
            status: 'COMPLETED',
            progress: 100
          })
          .eq('member_id', userId)
          .eq('skill_id', skillId);
      } else if (calculatedProgress > 0 && updatedStatus === 'NOT_STARTED') {
        // User started making progress - update status to IN_PROGRESS
        await supabase
          .from('member_skills')
          .update({ 
            status: 'IN_PROGRESS',
            progress: calculatedProgress
          })
          .eq('member_id', userId)
          .eq('skill_id', skillId);
      } else if (calculatedProgress < 100 && updatedStatus !== 'NOT_STARTED') {
        // Update progress even if status is already IN_PROGRESS
        await supabase
          .from('member_skills')
          .update({ 
            progress: calculatedProgress
          })
          .eq('member_id', userId)
          .eq('skill_id', skillId);
      }
    }

    return NextResponse.json({
      success: true,
      isCompleted: progress.is_completed,
      progress: progressPercent,
      completedCount: finalCompletedCount,
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

