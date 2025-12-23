import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { parseResourceUrl } from '@/lib/resources';

/**
 * GET /api/admin/resources
 * Get all resources for admin management
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get resources error details:', error);
      throw new Error(`Failed to fetch resources: ${error.message}`);
    }

    return NextResponse.json({ resources: data || [] });
  } catch (err: any) {
    console.error('Get resources error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/resources
 * Create a new resource with role and cohort based access
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      title, 
      description, 
      url, 
      thumbnailUrl: bodyThumbnailUrl,
      visibility_lab,
      visibility_alumni,
      is_cohort_specific,
      cohorts,
      userId 
    } = body;

    if (!title || !url) {
      return NextResponse.json(
        { error: 'Title and URL are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Verify admin status
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (memberError || !member || member.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const parsed = parseResourceUrl(url);
    const thumbnailUrl = bodyThumbnailUrl || parsed.thumbnailUrl || null;

    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .insert({
        title,
        description: description || null,
        url,
        thumbnail_url: thumbnailUrl,
        provider: parsed.provider,
        visibility_lab: visibility_lab ?? true,
        visibility_alumni: visibility_alumni ?? false,
        is_cohort_specific: is_cohort_specific ?? false,
        cohorts: cohorts || [],
        created_by: userId,
      })
      .select()
      .single();

    if (resourceError) {
      console.error('Create resource error details:', resourceError);
      throw new Error(`Failed to create resource: ${resourceError.message}`);
    }

    return NextResponse.json({ resource }, { status: 201 });
  } catch (err: any) {
    console.error('Create resource error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create resource' },
      { status: 500 }
    );
  }
}
