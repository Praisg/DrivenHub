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

    // Simplified query - just get resources without category join for now
    let query = supabase
      .from('resources')
      .select('*');

    // Filter by category if provided
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    // Get all resources with visibility = 'all'
    const { data: allResources, error: allError } = await query
      .eq('visibility', 'all')
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('Get member resources error details:', {
        message: allError.message,
        code: allError.code,
        details: allError.details,
        hint: allError.hint,
      });
      throw new Error(`Failed to fetch resources: ${allError.message} (Code: ${allError.code || 'unknown'})`);
    }

    // If user is logged in, also get resources assigned to them
    // Skip for now - keep it simple until basic create/read works
    let assignedResources: any[] = [];
    // TODO: Add selected member assignments later

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

