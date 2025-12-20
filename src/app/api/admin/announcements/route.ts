import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * GET /api/admin/announcements
 * Get all announcements (admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase();

    // Get current user from session/header (simplified - adjust based on your auth)
    const authHeader = req.headers.get('authorization');
    // For now, we'll check admin role via query param or header
    // In production, use proper session/auth middleware

    const { data, error } = await supabase
      .from('announcements')
      .select(`
        *,
        created_by:members!announcements_created_by_id_fkey (
          id,
          name,
          email
        )
      `)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch announcements: ${error.message}`);
    }

    return NextResponse.json({ announcements: data || [] });
  } catch (err: any) {
    console.error('Get announcements error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch announcements' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/announcements
 * Create a new announcement (admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, body: bodyText, createdById } = body;

    if (!title || !bodyText) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('announcements')
      .insert({
        title,
        body: bodyText,
        created_by_id: createdById || null,
        published_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create announcement: ${error.message}`);
    }

    return NextResponse.json({ announcement: data }, { status: 201 });
  } catch (err: any) {
    console.error('Create announcement error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create announcement' },
      { status: 500 }
    );
  }
}

