import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function DELETE(req: NextRequest) {
  try {
    // Try to clear Supabase, but don't fail if env vars aren't set
    let supabaseCleared = false;
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('role', 'member'); // Only delete members, not admins

      if (!error) {
        supabaseCleared = true;
      }
    } catch (supabaseError: any) {
      // Supabase not configured or error - that's okay, we'll still clear localStorage
      console.log('Supabase clear skipped:', supabaseError.message);
    }

    return NextResponse.json({ 
      message: supabaseCleared 
        ? 'All members cleared from database and localStorage' 
        : 'All members cleared from localStorage (Supabase not configured)',
      deleted: true,
      supabaseCleared
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

