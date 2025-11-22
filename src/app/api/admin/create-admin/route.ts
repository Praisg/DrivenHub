import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * POST /api/admin/create-admin
 * Creates or updates a user to admin role
 * Note: In production, this should be protected or removed
 */
export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Upsert member with admin role
    const { data, error } = await supabase
      .from('members')
      .upsert(
        {
          email: email.toLowerCase(),
          name: name || email.split('@')[0],
          role: 'admin',
          assigned_skills: [],
        },
        { onConflict: 'email' }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Admin access granted to ${email}`,
      member: data,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

