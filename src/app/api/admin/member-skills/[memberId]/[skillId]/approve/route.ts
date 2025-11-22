import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * POST /api/admin/member-skills/[memberId]/[skillId]/approve
 * Approves a member's skill assignment
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
        admin_approved: true,
        status: 'IN_PROGRESS'
      })
      .eq('member_id', memberId)
      .eq('skill_id', skillId);

    if (error) {
      throw new Error(`Failed to approve member skill: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Approve member skill error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to approve member skill' },
      { status: 500 }
    );
  }
}

