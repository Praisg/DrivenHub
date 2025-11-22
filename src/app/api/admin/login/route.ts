import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { verifyPassword } from '@/lib/password';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Find admin by email
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('role', 'admin')
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ error: 'Invalid admin credentials. Please check your email and password.' }, { status: 401 });
    }

    // Verify password
    if (!data.password_hash) {
      return NextResponse.json({ error: 'Password not set. Please contact a system administrator.' }, { status: 401 });
    }

    const isValidPassword = await verifyPassword(password, data.password_hash);
    
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid admin credentials. Please check your email and password.' }, { status: 401 });
    }

    // Remove password hash from response
    const { password_hash, ...admin } = data;

    return NextResponse.json({ admin }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

