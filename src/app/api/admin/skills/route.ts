import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * GET /api/admin/skills
 * Gets all skills with their content counts
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase();

    const { data: skills, error: skillsError } = await supabase
      .from('skills')
      .select('*')
      .eq('is_active', true) // Only show active skills
      .order('created_at', { ascending: false });

    if (skillsError) {
      throw new Error(`Failed to fetch skills: ${skillsError.message}`);
    }

    // Get content counts for each skill
    const skillsWithCounts = await Promise.all(
      (skills || []).map(async (skill) => {
        const { count } = await supabase
          .from('skill_content')
          .select('*', { count: 'exact', head: true })
          .eq('skill_id', skill.id);

        return {
          ...skill,
          contentCount: count || 0,
        };
      })
    );

    return NextResponse.json({ skills: skillsWithCounts });
  } catch (err: any) {
    console.error('Get admin skills error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/skills
 * Creates a new skill with content items
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, level, contentItems } = body;

    if (!name || !level) {
      return NextResponse.json(
        { error: 'Missing required fields: name, level' },
        { status: 400 }
      );
    }

    if (!['Awareness', 'Embodiment', 'Mastery'].includes(level)) {
      return NextResponse.json(
        { error: 'Level must be Awareness, Embodiment, or Mastery' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Generate skill ID
    const skillId = `skill-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create skill
    const { data: skill, error: skillError } = await supabase
      .from('skills')
      .insert({
        id: skillId,
        name,
        description: description || null,
        level,
        category: level, // Use level as category for now
        icon: '📚',
        color: 'blue',
        is_active: true,
      })
      .select()
      .single();

    if (skillError) {
      throw new Error(`Failed to create skill: ${skillError.message}`);
    }

    // Create content items if provided
    if (contentItems && Array.isArray(contentItems) && contentItems.length > 0) {
      const contentInserts = contentItems.map((item: any, index: number) => {
        // Prioritize fileUrl from upload, then manual URL, then null
        const finalUrl = item.fileUrl || item.url || null;
        return {
          skill_id: skillId,
          title: item.title,
          type: item.type || 'OTHER',
          url: finalUrl,
          notes: item.notes || null,
          display_order: item.order !== undefined ? item.order : index,
        };
      });

      const { error: contentError } = await supabase
        .from('skill_content')
        .insert(contentInserts);

      if (contentError) {
        console.error('Error creating content items:', contentError);
        // Don't fail the whole operation, but log the error
      }
    }

    return NextResponse.json({ skill }, { status: 201 });
  } catch (err: any) {
    console.error('Create skill error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create skill' },
      { status: 500 }
    );
  }
}

