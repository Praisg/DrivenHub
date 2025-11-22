import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * POST /api/admin/skills/[skillId]/approve
 * Approves a skill (marks as active/approved)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { skillId: string } }
) {
  try {
    const { skillId } = params;
    const supabase = getSupabase();

    const { error } = await supabase
      .from('skills')
      .update({ is_active: true })
      .eq('id', skillId);

    if (error) {
      throw new Error(`Failed to approve skill: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Approve skill error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to approve skill' },
      { status: 500 }
    );
  }
}

