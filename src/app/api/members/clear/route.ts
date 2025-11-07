import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function DELETE(req: NextRequest) {
  try {
    const supabase = getSupabase();

    // Delete all members (but keep admins) from Supabase
    const { error } = await supabase
      .from('members')
      .delete()
      .eq('role', 'member'); // Only delete members, not admins

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'All members cleared successfully',
      deleted: true 
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

