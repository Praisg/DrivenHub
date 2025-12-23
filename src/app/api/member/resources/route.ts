import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/member/resources
 * Get resources accessible to the current member based on role and cohort
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

    // 1. Get user's role and cohort information
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, cohort, is_lab_member, is_alumni')
      .eq('id', userId)
      .single();

    if (memberError || !member) {
      console.error('Member lookup error:', memberError);
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // 2. Build the query based on the specified access rules
    // Lab Members see: Lab-wide (all) OR Cohort-specific (assigned to their cohort)
    // Alumni see: Cohort-specific (assigned to their cohort) only
    
    let filterParts = [];

    // Lab Member Rules
    if (member.is_lab_member) {
      // Lab-wide resources for lab members
      filterParts.push('and(visibility_lab.eq.true,is_cohort_specific.eq.false)');
      
      // Cohort-specific resources for lab members
      if (member.cohort) {
        filterParts.push(`and(visibility_lab.eq.true,is_cohort_specific.eq.true,cohorts.cs.{${member.cohort}})`);
      }
    }

    // Alumni Rules
    if (member.is_alumni && member.cohort) {
      // Alumni only see cohort-specific resources assigned to their cohort
      filterParts.push(`and(visibility_alumni.eq.true,is_cohort_specific.eq.true,cohorts.cs.{${member.cohort}})`);
    }

    if (filterParts.length === 0) {
      return NextResponse.json({ resources: [] });
    }

    // Combine filters with OR
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
