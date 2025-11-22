import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { verifyPassword } from '@/lib/password';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();
    
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing name, email, or password' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Find member by email
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ error: 'No member found with this email address' }, { status: 404 });
    }

    // Verify name matches
    if (data.name.toLowerCase() !== name.toLowerCase()) {
      return NextResponse.json({ error: 'Invalid credentials. Please check your name, email, and password.' }, { status: 401 });
    }

    // Verify password
    if (!data.password_hash) {
      return NextResponse.json({ error: 'Password not set. Please contact an administrator.' }, { status: 401 });
    }

    const isValidPassword = await verifyPassword(password, data.password_hash);
    
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials. Please check your name, email, and password.' }, { status: 401 });
    }

    // Remove password hash from response
    const { password_hash, ...member } = data;

    return NextResponse.json({ member }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}


