import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/admin/members
 * Gets all registered members from the database (admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('members')
      .select('id, name, email, role, cohort, is_lab_member, is_alumni, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch members: ${error.message}`);
    }

    // Transform to match Member interface
    const transformedMembers = (data || []).map((member: any) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      cohort: member.cohort,
      is_lab_member: member.is_lab_member,
      is_alumni: member.is_alumni,
      registrationDate: member.created_at ? new Date(member.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    }));

    return NextResponse.json({ members: transformedMembers });
  } catch (err: any) {
    console.error('Get members error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch members' },
      { status: 500 }
    );
  }
}

