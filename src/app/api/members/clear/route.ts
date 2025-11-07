import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function DELETE(req: NextRequest) {
  try {
    const supabase = getSupabase();

    // First, get all member IDs to delete
    const { data: members, error: fetchError } = await supabase
      .from('members')
      .select('id')
      .eq('role', 'member');

    if (fetchError) {
      return NextResponse.json({ error: `Failed to fetch members: ${fetchError.message}` }, { status: 500 });
    }

    if (!members || members.length === 0) {
      return NextResponse.json({ 
        message: 'No members to delete',
        deleted: true 
      }, { status: 200 });
    }

    // Delete each member (this works better with RLS)
    const memberIds = members.map(m => m.id);
    const { error: deleteError } = await supabase
      .from('members')
      .delete()
      .in('id', memberIds);

    if (deleteError) {
      return NextResponse.json({ error: `Failed to delete members: ${deleteError.message}` }, { status: 500 });
    }

    return NextResponse.json({ 
      message: `Successfully deleted ${memberIds.length} member(s)`,
      deleted: true,
      count: memberIds.length
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

