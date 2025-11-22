import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * POST /api/admin/member-skills/[memberId]/[skillId]/complete
 * Marks a member's skill as complete
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { memberId: string; skillId: string } }
) {
  try {
    const { memberId, skillId } = params;
    const supabase = getSupabase();

    const { error } = await supabase
      .from('member_skills')
      .update({ 
        status: 'COMPLETED',
        progress: 100
      })
      .eq('member_id', memberId)
      .eq('skill_id', skillId);

    if (error) {
      throw new Error(`Failed to mark skill as complete: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Mark complete error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to mark skill as complete' },
      { status: 500 }
    );
  }
}

