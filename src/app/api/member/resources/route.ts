import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/member/resources
 * Returns ONLY resources that have been explicitly assigned to the member.
 * Roles and cohorts are NOT used for access – only for filtering in the admin UI.
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // 1. Look up assignments for this member
    const { data: assignments, error: assignmentError } = await supabase
      .from('resource_assignments')
      .select('resource_id')
      .eq('member_id', userId);

    if (assignmentError) {
      console.error('Assignment lookup error:', assignmentError);
      throw new Error(`Failed to fetch assignments: ${assignmentError.message}`);
    }

    const resourceIds = (assignments || []).map((a) => a.resource_id);

    if (resourceIds.length === 0) {
      return NextResponse.json({ resources: [] });
    }

    // 2. Fetch the actual resource rows
    const { data: resources, error: resourceError } = await supabase
      .from('resources')
      .select('*')
      .in('id', resourceIds)
      .order('created_at', { ascending: false });

    if (resourceError) {
      console.error('Resource fetch error:', resourceError);
      throw new Error(`Failed to fetch resources: ${resourceError.message}`);
    }

    return NextResponse.json({ resources: resources || [] });
  } catch (err: any) {
    console.error('Get member resources error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}
