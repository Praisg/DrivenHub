import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * GET /api/admin/resource-categories
 * Get all resource categories
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('resource_categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    return NextResponse.json({ categories: data || [] });
  } catch (err: any) {
    console.error('Get categories error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/resource-categories
 * Create a new category (admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, sortOrder, userId } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Verify user is admin
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (member.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { data: category, error: categoryError } = await supabase
      .from('resource_categories')
      .insert({
        name,
        sort_order: sortOrder || 0,
      })
      .select()
      .single();

    if (categoryError) {
      throw new Error(`Failed to create category: ${categoryError.message}`);
    }

    return NextResponse.json({ category }, { status: 201 });
  } catch (err: any) {
    console.error('Create category error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create category' },
      { status: 500 }
    );
  }
}

