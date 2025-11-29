import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * POST /api/admin/coaching-requests/[id]/status
 * Update the status of a coaching request
 * Admin-only endpoint
 * Body: { status: 'PENDING' | 'REVIEWED' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { status } = await req.json();

    if (!status) {
      return NextResponse.json(
        { error: 'status is required' },
        { status: 400 }
      );
    }

    const validStatuses = ['PENDING', 'REVIEWED', 'SCHEDULED', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { error } = await supabase
      .from('coaching_requests')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update status: ${error.message}`);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Status updated successfully'
    });
  } catch (err: any) {
    console.error('Update coaching request status error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to update status' },
      { status: 500 }
    );
  }
}

