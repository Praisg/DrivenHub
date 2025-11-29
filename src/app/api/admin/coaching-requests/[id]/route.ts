import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * DELETE /api/admin/coaching-requests/[id]
 * Delete a coaching request
 * Admin-only endpoint
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = getSupabase();

    const { error } = await supabase
      .from('coaching_requests')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete coaching request: ${error.message}`);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Coaching request deleted successfully'
    });
  } catch (err: any) {
    console.error('Delete coaching request error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete coaching request' },
      { status: 500 }
    );
  }
}

