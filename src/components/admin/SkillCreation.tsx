'use client';

import { useState } from 'react';
import { Button } from '@/components';
import SkillForm from './SkillForm';
import { Skill, SkillContentItem } from '@/types';

interface SkillCreationProps {
  onSkillCreated?: () => void;
}

export default function SkillCreation({ onSkillCreated }: SkillCreationProps) {
  const [showForm, setShowForm] = useState(false);

  const handleSave = async (skillData: Partial<Skill>, contentItems: SkillContentItem[]) => {
    // Filter out empty items
    const validContentItems = contentItems.filter(item => item.title && item.title.trim() !== '');
    
    // Separate items with files (need upload after skill creation) from items without files
    const itemsWithFiles = validContentItems.filter(item => item.file);
    const itemsWithoutFiles = validContentItems.filter(item => !item.file);

    // Step 1: Create the skill first (with content items that don't have files)
    // This ensures we have a skillId before uploading files
    const createResponse = await fetch('/api/admin/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: skillData.name,
        description: skillData.description,
        level: skillData.level,
        contentItems: itemsWithoutFiles, // Save items without files first
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.json();
      throw new Error(error.error || 'Failed to create skill');
    }

    const { skill } = await createResponse.json();
    const skillId = skill.id;

    // Step 2: Upload files and create content items for items with files
    if (itemsWithFiles.length > 0) {
      const uploadedItems = await Promise.all(
        itemsWithFiles.map(async (item, index) => {
          if (!item.file) return null;

          // Upload file with the real skillId
          const formData = new FormData();
          formData.append('file', item.file);
          formData.append('skillId', skillId);
          formData.append('contentIndex', index.toString());

          try {
            const uploadResponse = await fetch('/api/admin/skills/upload-content', {
              method: 'POST',
              body: formData,
            });

            if (!uploadResponse.ok) {
              const errorData = await uploadResponse.json();
              
              // Provide helpful error message for bucket not found
              if (errorData.error?.includes('bucket') || errorData.error?.includes('Bucket')) {
                const instructions = errorData.instructions || [
                  '1. Go to Supabase Dashboard → Storage',
                  '2. Click "New bucket"',
                  '3. Name: skill-content',
                  '4. Check "Public bucket"',
                  '5. Click "Create bucket"'
                ];
                throw new Error(
                  `Storage bucket not found.\n\n${instructions.join('\n')}\n\nSee STORAGE_SETUP.md for details.`
                );
              }
              
              throw new Error(`Failed to upload file "${item.fileName}": ${errorData.error || errorData.details || 'Unknown error'}`);
            }

            const uploadData = await uploadResponse.json();
            
            // Return content item data with fileUrl
            return {
              title: item.title,
              type: item.type || 'OTHER',
              url: uploadData.url, // Use uploaded file URL
              notes: item.notes || null,
              order: item.order !== undefined ? item.order : (itemsWithoutFiles.length + index),
            };
            } catch (uploadError: any) {
              console.error('File upload error:', uploadError);
              
              // Provide helpful error message for bucket not found
              if (uploadError.message?.includes('bucket') || uploadError.message?.includes('Bucket')) {
                throw new Error(
                  `Storage bucket not found.\n\nPlease create the bucket:\n1. Go to Supabase Dashboard → Storage\n2. Click "New bucket"\n3. Name: skill-content\n4. Check "Public bucket"\n5. Click "Create bucket"\n\nSee STORAGE_SETUP.md for details.`
                );
              }
              
              throw new Error(`Failed to upload file "${item.fileName}": ${uploadError.message || 'Unknown error'}`);
            }
        })
      );

      // Filter out nulls and add content items with uploaded files
      const validUploadedItems = uploadedItems.filter(item => item !== null);
      
      if (validUploadedItems.length > 0) {
        // Get existing content items from the skill (itemsWithoutFiles that were just created)
        // We need to fetch them to get their IDs, then merge with new uploaded items
        const getSkillResponse = await fetch(`/api/admin/skills/${skillId}`);
        if (getSkillResponse.ok) {
          const skillData = await getSkillResponse.json();
          const existingContentItems = (skillData.contentItems || []).map((item: any) => ({
            id: item.id,
            title: item.title,
            type: item.type,
            url: item.url,
            notes: item.notes,
            order: item.display_order !== undefined ? item.display_order : item.order,
          }));

          // Merge existing items with new uploaded items
          const allContentItems = [...existingContentItems, ...validUploadedItems];

          // Update skill with all content items (existing + new)
          const addContentResponse = await fetch(`/api/admin/skills/${skillId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contentItems: allContentItems,
            }),
          });

          if (!addContentResponse.ok) {
            const error = await addContentResponse.json();
            console.error('Failed to add content items:', error);
            throw new Error(`Failed to add content items: ${error.error || 'Unknown error'}`);
          }
        }
      }
    }

    setShowForm(false);
    onSkillCreated?.();
  };

  if (!showForm) {
    return (
      <div>
        <Button onClick={() => setShowForm(true)}>
          Create New Skill
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Create New Skill</h3>
      <SkillForm
        onSave={handleSave}
        onCancel={() => setShowForm(false)}
      />
    </div>
  );
}
