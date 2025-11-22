import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * POST /api/admin/skills/[skillId]/complete
 * Marks a skill as complete (admin action)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { skillId: string } }
) {
  try {
    const { skillId } = params;
    const supabase = getSupabase();

    // Update skill status or add completion marker
    // For now, we'll just mark it as active and add a note
    const { error } = await supabase
      .from('skills')
      .update({ is_active: true })
      .eq('id', skillId);

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

