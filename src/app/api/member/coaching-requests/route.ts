import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * POST /api/member/coaching-requests
 * Create a new coaching request (member only)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic, details, preferredDates } = body;

    if (!topic || !topic.trim()) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    // Get userId from request body (sent from frontend)
    const userId = body.userId;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required. Please ensure you are logged in.' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Verify user exists and is a member
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

    if (member.role !== 'member') {
      return NextResponse.json(
        { error: 'Only members can create coaching requests' },
        { status: 403 }
      );
    }

    // Create coaching request
    const { data: request, error: insertError } = await supabase
      .from('coaching_requests')
      .insert({
        user_id: userId,
        topic: topic.trim(),
        details: details?.trim() || null,
        preferred_dates: preferredDates?.trim() || null,
        status: 'PENDING',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating coaching request:', insertError);
      return NextResponse.json(
        { error: 'Failed to create coaching request' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true,
        request: {
          id: request.id,
          topic: request.topic,
          status: request.status,
          createdAt: request.created_at,
        }
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Create coaching request error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create coaching request' },
      { status: 500 }
    );
  }
}

