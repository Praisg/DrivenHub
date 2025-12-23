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

    // Get user's role and cohort
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('cohort, is_lab_member, is_alumni')
      .eq('id', userId)
      .single();

    if (memberError || !member) {
      console.error('Member lookup error:', memberError);
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Build the query based on access rules:
    // A resource is visible if:
    // 1. (Member is Lab Member AND resource is Lab-wide)
    // 2. OR (Resource is assigned to Member's cohort)
    // 3. OR (Member is Alumni AND Resource is marked for Alumni AND assigned to Member's cohort)
    // 4. OR (Resource is individually assigned to Member)
    
    // First, get IDs of resources individually assigned to this user
    const { data: individualAssignments } = await supabase
      .from('resource_assignments')
      .select('resource_id')
      .eq('member_id', userId);
    
    const individuallyAssignedIds = (individualAssignments || []).map(a => a.resource_id);

    let filterParts = [];
    
    // Add individual assignments if they exist
    if (individuallyAssignedIds.length > 0) {
      filterParts.push(`id.in.(${individuallyAssignedIds.join(',')})`);
    }

    if (member.is_lab_member) {
      // Lab Members see it if it's lab-wide
      filterParts.push('is_lab_wide.eq.true');
      
      // OR if they are in the assigned cohorts
      if (member.cohort) {
        filterParts.push(`cohorts.cs.{${member.cohort}}`);
      }
    }
    
    if (member.is_alumni && member.cohort) {
      // Alumni see it ONLY if they are in the assigned cohorts AND visibility_alumni is true
      filterParts.push(`and(visibility_alumni.eq.true,cohorts.cs.{${member.cohort}})`);
    }

    if (filterParts.length === 0) {
      return NextResponse.json({ resources: [] });
    }

    const { data: resources, error: resourceError } = await supabase
      .from('resources')
      .select('*')
      .or(filterParts.join(','))
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
