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

    // Build the query based on access rules
    // Lab Member: (visibility_lab = true AND is_cohort_specific = false) OR (visibility_lab = true AND is_cohort_specific = true AND cohort = ANY(cohorts))
    // Alumni: (visibility_alumni = true AND is_cohort_specific = true AND cohort = ANY(cohorts))
    
    // Using PostgreSQL OR logic via Supabase .or()
    let filterParts = [];
    
    if (member.is_lab_member) {
      // Lab-wide resources
      filterParts.push('and(visibility_lab.eq.true,is_cohort_specific.eq.false)');
      
      // Cohort-specific lab resources
      if (member.cohort) {
        filterParts.push(`and(visibility_lab.eq.true,is_cohort_specific.eq.true,cohorts.cs.{${member.cohort}})`);
      }
    }
    
    if (member.is_alumni && member.cohort) {
      // Alumni cohort-specific resources
      filterParts.push(`and(visibility_alumni.eq.true,is_cohort_specific.eq.true,cohorts.cs.{${member.cohort}})`);
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
