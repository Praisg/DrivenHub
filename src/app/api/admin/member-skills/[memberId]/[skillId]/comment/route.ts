import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * POST /api/admin/member-skills/[memberId]/[skillId]/comment
 * Adds a comment/note to a member's skill assignment
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { memberId: string; skillId: string } }
) {
  try {
    const { memberId, skillId } = params;
    const body = await req.json();
    const { comment } = body;

    if (!comment || !comment.trim()) {
      return NextResponse.json(
        { error: 'Comment is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { error } = await supabase
      .from('member_skills')
      .update({ admin_notes: comment.trim() })
      .eq('member_id', memberId)
      .eq('skill_id', skillId);

    if (error) {
      throw new Error(`Failed to add comment: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Add comment error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to add comment' },
      { status: 500 }
    );
  }
}

