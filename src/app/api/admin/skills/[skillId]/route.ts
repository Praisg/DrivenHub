import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * GET /api/admin/skills/[skillId]
 * Gets a single skill with all its content items
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { skillId: string } }
) {
  try {
    const { skillId } = params;
    const supabase = getSupabase();

    // Get skill
    const { data: skill, error: skillError } = await supabase
      .from('skills')
      .select('*')
      .eq('id', skillId)
      .single();

    if (skillError || !skill) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }

    // Get content items
    const { data: contentItems, error: contentError } = await supabase
      .from('skill_content')
      .select('*')
      .eq('skill_id', skillId)
      .order('display_order', { ascending: true });

    if (contentError) {
      console.error('Error fetching content items:', contentError);
    }

    return NextResponse.json({
      skill,
      contentItems: contentItems || [],
    });
  } catch (err: any) {
    console.error('Get skill error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch skill' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/skills/[skillId]
 * Updates a skill and manages its content items
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { skillId: string } }
) {
  try {
    const { skillId } = params;
    const body = await req.json();
    const { name, description, level, contentItems } = body;

    const supabase = getSupabase();

    // Update skill
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (level !== undefined) {
      if (!['Awareness', 'Practice', 'Embodiment', 'Mastery', 'Mentorship'].includes(level)) {
        return NextResponse.json(
          { error: 'Level must be Awareness, Practice, Embodiment, Mastery, or Mentorship' },
          { status: 400 }
        );
      }
      updateData.level = level;
      updateData.category = level;
    }

    const { error: updateError } = await supabase
      .from('skills')
      .update(updateData)
      .eq('id', skillId);

    if (updateError) {
      throw new Error(`Failed to update skill: ${updateError.message}`);
    }

    // Manage content items if provided
    // If contentItems is explicitly provided (even if empty array), manage them
    // If contentItems is undefined, don't touch existing content
    if (contentItems !== undefined) {
      // Filter out empty items (items without titles)
      const validContentItems = Array.isArray(contentItems) 
        ? contentItems.filter((item: any) => item.title && item.title.trim() !== '')
        : [];
      
      // Get existing content IDs
      const { data: existingContent } = await supabase
        .from('skill_content')
        .select('id')
        .eq('skill_id', skillId);

      const existingIds = new Set((existingContent || []).map((c: any) => c.id));
      const providedIds = new Set(
        validContentItems
          .filter((item: any) => item.id)
          .map((item: any) => item.id)
      );

      // Delete removed items (items that exist in DB but not in the provided list)
      const toDelete = Array.from(existingIds).filter((id) => !providedIds.has(id));
      if (toDelete.length > 0) {
        await supabase
          .from('skill_content')
          .delete()
          .in('id', toDelete);
      }

      // Update or insert items
      const upsertResults = [];
      for (const item of validContentItems) {
        // Prioritize fileUrl from upload, but also allow manual URL
        // If both exist, fileUrl takes precedence (uploaded file)
        const finalUrl = item.fileUrl || item.url || null;
        
        // If both fileUrl and url exist, store the manual URL in notes for reference
        let notes = item.notes || null;
        if (item.fileUrl && item.url && item.url !== item.fileUrl) {
          notes = notes 
            ? `${notes}\n\nExternal URL: ${item.url}`
            : `External URL: ${item.url}`;
        }
        
        const itemData = {
          skill_id: skillId,
          title: item.title.trim(),
          type: item.type || 'OTHER',
          url: finalUrl, // Primary URL (uploaded file takes precedence)
          notes: notes,
          display_order: item.order !== undefined ? item.order : (item.display_order !== undefined ? item.display_order : 0),
        };

        if (item.id && existingIds.has(item.id)) {
          // Update existing
          const { error: updateError, data: updatedData } = await supabase
            .from('skill_content')
            .update(itemData)
            .eq('id', item.id)
            .select();
          
          if (updateError) {
            console.error('Error updating content item:', updateError);
            throw new Error(`Failed to update content item "${item.title}": ${updateError.message}`);
          }
          upsertResults.push(updatedData);
        } else {
          // Insert new
          const { error: insertError, data: insertedData } = await supabase
            .from('skill_content')
            .insert(itemData)
            .select();
          
          if (insertError) {
            console.error('Error inserting content item:', insertError);
            throw new Error(`Failed to insert content item "${item.title}": ${insertError.message}`);
          }
          upsertResults.push(insertedData);
        }
      }
      
      // Log success for debugging
      console.log(`Successfully upserted ${upsertResults.length} content items for skill ${skillId}`);
    }

    // Return updated skill with content count for UI refresh
    const { data: updatedSkill } = await supabase
      .from('skills')
      .select('*')
      .eq('id', skillId)
      .single();

    const { count: contentCount } = await supabase
      .from('skill_content')
      .select('*', { count: 'exact', head: true })
      .eq('skill_id', skillId);

    return NextResponse.json({ 
      success: true,
      skill: updatedSkill,
      contentCount: contentCount || 0,
    });
  } catch (err: any) {
    console.error('Update skill error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to update skill' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/skills/[skillId]
 * Hard deletes a skill and all its content (cascade delete)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { skillId: string } }
) {
  try {
    const { skillId } = params;
    const supabase = getSupabase();

    // Delete skill content first (will cascade automatically, but being explicit)
    await supabase
      .from('skill_content')
      .delete()
      .eq('skill_id', skillId);

    // Delete member skill assignments
    await supabase
      .from('member_skills')
      .delete()
      .eq('skill_id', skillId);

    // Delete the skill itself
    const { error } = await supabase
      .from('skills')
      .delete()
      .eq('id', skillId);

    if (error) {
      throw new Error(`Failed to delete skill: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Delete skill error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete skill' },
      { status: 500 }
    );
  }
}

