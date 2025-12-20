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
    const categoryId = searchParams.get('categoryId');

    const supabase = getSupabase();

    // Build query for accessible resources
    let query = supabase
      .from('resources')
      .select(`
        *,
        category:resource_categories (
          id,
          name,
          sort_order
        )
      `);

    // Filter by category if provided
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    // Get all resources with visibility = 'all'
    const { data: allResources, error: allError } = await query
      .eq('visibility', 'all')
      .order('created_at', { ascending: false });

    if (allError) {
      throw new Error(`Failed to fetch resources: ${allError.message}`);
    }

    // If user is logged in, also get resources assigned to them
    let assignedResources: any[] = [];
    if (userId) {
      const { data: assignments, error: assignmentsError } = await supabase
        .from('resource_assignments')
        .select(`
          resource:resources!resource_assignments_resource_id_fkey (
            *,
            category:resource_categories (
              id,
              name,
              sort_order
            )
          )
        `)
        .eq('member_id', userId);

      if (!assignmentsError && assignments) {
        assignedResources = assignments
          .map((a: any) => a.resource)
          .filter(Boolean);
      }
    }

    // Combine and deduplicate resources
    const resourceMap = new Map();
    
    (allResources || []).forEach((r: any) => {
      resourceMap.set(r.id, r);
    });

    assignedResources.forEach((r: any) => {
      if (r) {
        resourceMap.set(r.id, r);
      }
    });

    const resources = Array.from(resourceMap.values());

    return NextResponse.json({ resources });
  } catch (err: any) {
    console.error('Get member resources error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}

