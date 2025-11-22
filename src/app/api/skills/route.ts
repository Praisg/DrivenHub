import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * GET /api/skills
 * Gets all skills from the database
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .eq('is_active', true) // Only show active skills
      .order('level', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch skills: ${error.message}`);
    }

    // Transform to match Skill interface
    const transformedSkills = (data || []).map((skill: any) => ({
      id: skill.id,
      name: skill.name,
      level: skill.level,
      description: skill.description || '',
      category: skill.category || '',
      icon: skill.icon || '📚',
      color: skill.color || 'blue',
      secondarySkills: skill.secondary_skills || [],
      tertiarySkills: skill.tertiary_skills || [],
      learningPath: skill.learning_path || [],
      prerequisites: skill.prerequisites || [],
      createdAt: skill.created_at || new Date().toISOString(),
      createdBy: skill.created_by || 'system',
      // For compatibility with hierarchical structure
      subtopics: skill.secondary_skills || [],
    }));

    return NextResponse.json({ skills: transformedSkills });
  } catch (err: any) {
    console.error('Get skills error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/skills
 * Creates a new skill in the database
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, level, description, category, icon, color, secondarySkills, tertiarySkills, learningPath, prerequisites, createdBy } = body;

    if (!id || !name || !level) {
      return NextResponse.json(
        { error: 'Missing required fields: id, name, level' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('skills')
      .insert({
        id,
        name,
        level,
        description: description || null,
        category: category || null,
        icon: icon || null,
        color: color || null,
        secondary_skills: secondarySkills || [],
        tertiary_skills: tertiarySkills || [],
        learning_path: learningPath || [],
        prerequisites: prerequisites || [],
        created_by: createdBy || 'system',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create skill: ${error.message}`);
    }

    return NextResponse.json({ skill: data }, { status: 201 });
  } catch (err: any) {
    console.error('Create skill error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create skill' },
      { status: 500 }
    );
  }
}

