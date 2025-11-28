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
    
    const isRejected = memberSkillAssignment?.admin_approved === false;

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
    // Also extract external URL from notes if it exists
    const contentWithProgress = (contentItems || []).map((item: any) => {
      const contentItem: any = {
        ...item,
        isCompleted: progressMap.get(item.id) || false,
      };
      
      // Extract external URL from notes if it exists
      // Format: "External URL: https://..."
      if (item.notes && item.notes.includes('External URL:')) {
        const urlMatch = item.notes.match(/External URL:\s*(https?:\/\/[^\s\n]+)/);
        if (urlMatch && urlMatch[1]) {
          contentItem.externalUrl = urlMatch[1];
          // Remove the external URL line from notes for cleaner display
          contentItem.notes = item.notes.replace(/External URL:\s*https?:\/\/[^\s\n]+/g, '').trim();
        }
      }
      
      return contentItem;
    });

    // Calculate overall progress
    // Time complexity: O(n) where n = content items (single pass filter)
    // Space complexity: O(1) - only storing counts
    const totalCount = contentWithProgress.length;
    const assignmentStatus = (memberSkillAssignment?.status || 'NOT_STARTED').toUpperCase();
    
    // Priority: Rejection overrides completion
    // If admin rejected, force all content items to show as incomplete and progress to 0%
    // If admin marked as COMPLETED (and not rejected), force all content items to show as completed and progress to 100%
    let completedCount = contentWithProgress.filter((c) => c.isCompleted).length;
    let finalContentItems = contentWithProgress;
    
    // Debug logging (can remove later)
    if (assignmentStatus === 'COMPLETED' || isRejected) {
      console.log(`Skill ${skillId}: status=${assignmentStatus}, isRejected=${isRejected}, calculatedCount=${completedCount}, totalCount=${totalCount}`);
    }
    
    if (isRejected) {
      // Mark all content items as incomplete (rejected - progress reset to 0%)
      finalContentItems = contentWithProgress.map((item) => ({
        ...item,
        isCompleted: false,
      }));
      completedCount = 0;
    } else if (assignmentStatus === 'COMPLETED') {
      // Mark all content items as completed
      finalContentItems = contentWithProgress.map((item) => ({
        ...item,
        isCompleted: true,
      }));
      completedCount = totalCount;
    }
    
    // Calculate progress: Priority - Rejection (0%) > Completion (100%) > Calculated
    const progress = isRejected
      ? 0
      : assignmentStatus === 'COMPLETED' 
      ? 100 
      : (totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0);

    return NextResponse.json({
      skill: {
        ...skill,
        adminApproved: memberSkillAssignment?.admin_approved,
        adminNotes: memberSkillAssignment?.admin_notes,
        status: assignmentStatus,
      },
      contentItems: finalContentItems,
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

