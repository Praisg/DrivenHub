import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * GET /api/member/announcements
 * Get latest announcements for members (public, no auth required)
 * Returns latest 5 announcements sorted by published_at DESC
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('announcements')
      .select('id, title, body, published_at')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch announcements: ${error.message}`);
    }

    // Transform to match expected format
    const announcements = (data || []).map((announcement: any) => ({
      id: announcement.id,
      title: announcement.title,
      body: announcement.body,
      dateISO: announcement.published_at,
    }));

    return NextResponse.json({ announcements });
  } catch (err: any) {
    console.error('Get member announcements error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch announcements' },
      { status: 500 }
    );
  }
}

