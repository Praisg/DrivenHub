import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * GET /api/admin/coaching-requests
 * Get all coaching requests (admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required. Please ensure you are logged in.' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Verify user is admin
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (member.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get all coaching requests
    const { data: requests, error: requestsError } = await supabase
      .from('coaching_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (requestsError) {
      console.error('Error fetching coaching requests:', requestsError);
      return NextResponse.json(
        { error: 'Failed to fetch coaching requests' },
        { status: 500 }
      );
    }

    // Get member info for each request
    const formattedRequests = await Promise.all(
      (requests || []).map(async (req: any) => {
        const { data: member } = await supabase
          .from('members')
          .select('id, name, email')
          .eq('id', req.user_id)
          .single();

        return {
          id: req.id,
          topic: req.topic,
          details: req.details,
          preferredDates: req.preferred_dates,
          status: req.status,
          createdAt: req.created_at,
          updatedAt: req.updated_at,
          member: member ? {
            id: member.id,
            name: member.name,
            email: member.email,
          } : null,
        };
      })
    );

    return NextResponse.json({ requests: formattedRequests });
  } catch (err: any) {
    console.error('Get coaching requests error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch coaching requests' },
      { status: 500 }
    );
  }
}

