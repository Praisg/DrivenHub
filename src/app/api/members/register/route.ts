import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { hashPassword } from '@/lib/password';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body || {};

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing name, email, or password' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Check if member already exists
    const { data: existing } = await supabase
      .from('members')
      .select('email')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'A member with this email already exists' }, { status: 409 });
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Create new member
    const { data, error } = await supabase
      .from('members')
      .insert({ 
        name, 
        email: email.toLowerCase(), 
        role: 'member',
        password_hash,
        assigned_skills: []
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Remove password hash from response
    const { password_hash: _, ...member } = data;

    return NextResponse.json({ member }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}


