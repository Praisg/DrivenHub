import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * POST /api/admin/skills/[skillId]/reject
 * Rejects a skill (marks as inactive)
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
      .update({ is_active: false })
      .eq('id', skillId);

    if (error) {
      throw new Error(`Failed to reject skill: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Reject skill error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to reject skill' },
      { status: 500 }
    );
  }
}

