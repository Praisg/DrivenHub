import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * GET /api/member/resources
 * Get resources accessible to the current member
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

    const supabase = getSupabase();

    // The logic is now simple: A member sees a resource ONLY if it is 
    // individually assigned to them in the resource_assignments table.
    // This works exactly like how skill assignments work.
    
    const { data: assignments, error: assignmentError } = await supabase
      .from('resource_assignments')
      .select('resource_id')
      .eq('member_id', userId);

    if (assignmentError) {
      console.error('Assignment fetch error:', assignmentError);
      throw new Error(`Failed to fetch assignments: ${assignmentError.message}`);
    }

    const resourceIds = (assignments || []).map(a => a.resource_id);

    if (resourceIds.length === 0) {
      return NextResponse.json({ resources: [] });
    }

    // Fetch the actual resource details for these IDs
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
