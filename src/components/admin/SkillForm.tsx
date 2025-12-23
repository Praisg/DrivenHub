'use client';

import { useState, useEffect } from 'react';
import { Button, Card } from '@/components';
import { Skill, SkillContentItem } from '@/types';

interface SkillFormProps {
  skill?: Skill;
  onSave: (skill: Partial<Skill>, contentItems: SkillContentItem[]) => Promise<void>;
  onCancel: () => void;
}

export default function SkillForm({ skill, onSave, onCancel }: SkillFormProps) {
  const [name, setName] = useState(skill?.name || '');
  const [description, setDescription] = useState(skill?.description || '');
  const [level, setLevel] = useState<'Awareness' | 'Practice' | 'Embodiment' | 'Mastery' | 'Mentorship'>(skill?.level || 'Awareness');
  const [contentItems, setContentItems] = useState<SkillContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Load content items if editing existing skill
  useEffect(() => {
    if (skill?.id) {
      loadContentItems();
    } else {
      // Reset form for new skill
      setName('');
      setDescription('');
      setLevel('Awareness');
      setContentItems([]);
    }
  }, [skill?.id]);

  const loadContentItems = async () => {
    if (!skill?.id) return;
    try {
      const response = await fetch(`/api/admin/skills/${skill.id}`);
      if (response.ok) {
        const data = await response.json();
        const items = (data.contentItems || []).map((item: any) => ({
          ...item,
          id: item.id,
          skillId: skill.id,
          order: item.display_order !== undefined ? item.display_order : item.order,
        }));
        setContentItems(items);
        // Also update form fields from skill data
        setName(skill.name || '');
        setDescription(skill.description || '');
        setLevel(skill.level || 'Awareness');
      }
    } catch (error) {
      console.error('Error loading content items:', error);
    }
  };

  const addContentItem = () => {
    setContentItems([
      ...contentItems,
      {
        skillId: skill?.id || '',
        title: '',
        type: 'BOOK',
        url: '',
        notes: '',
        order: contentItems.length,
      },
    ]);
  };

  const updateContentItem = (index: number, updates: Partial<SkillContentItem>) => {
    const updated = [...contentItems];
    updated[index] = { ...updated[index], ...updates };
    setContentItems(updated);
  };

  const removeContentItem = (index: number) => {
    setContentItems(contentItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Skill name is required');
      return;
    }

    setIsLoading(true);
    try {
      // For editing existing skills, upload files immediately with the skillId
      // For new skills, we'll upload files after skill creation (handled in onSave callback)
      let processedContentItems: any[] = [];
      
      if (skill?.id) {
        // Editing: upload files now with existing skillId
        processedContentItems = await Promise.all(
          contentItems.map(async (item, index) => {
            const processedItem: any = {
              ...item,
              order: item.order !== undefined ? item.order : index,
            };

            // If file is present, upload it
            if (item.file) {
              const formData = new FormData();
              formData.append('file', item.file);
              formData.append('skillId', skill.id);
              formData.append('contentIndex', index.toString());

              try {
                const uploadResponse = await fetch('/api/admin/skills/upload-content', {
                  method: 'POST',
                  body: formData,
                });

                if (uploadResponse.ok) {
                  const uploadData = await uploadResponse.json();
                  processedItem.fileUrl = uploadData.url;
                  processedItem.fileName = item.fileName;
                } else {
                  const errorData = await uploadResponse.json();
                  console.error('File upload error response:', errorData);
                  
                  // Check for permission/policy errors first (most common when bucket exists)
                  if (
                    errorData.error?.toLowerCase().includes('permission') || 
                    errorData.error?.toLowerCase().includes('policy') ||
                    errorData.error?.toLowerCase().includes('row-level security')
                  ) {
                    const instructions = errorData.instructions || [
                      '1. Go to Supabase Dashboard → SQL Editor',
                      '2. Run the SQL from setup-storage-policies.sql',
                      '3. Click "Run" to execute',
                      '4. Try uploading again'
                    ];
                    throw new Error(
                      `Storage permissions not configured.\n\n${instructions.join('\n')}\n\nSee STORAGE_SETUP.md for details.`
                    );
                  }
                  
                  // Check for bucket not found errors
                  if (errorData.error?.toLowerCase().includes('bucket')) {
                    const instructions = errorData.instructions || [
                      '1. Go to Supabase Dashboard → Storage',
                      '2. Verify "skill-content" bucket exists',
                      '3. Make sure it\'s marked as "Public"',
                      '4. Run setup-storage-policies.sql in SQL Editor',
                      '5. Try uploading again'
                    ];
                    throw new Error(
                      `${errorData.error}\n\n${instructions.join('\n')}\n\nSee STORAGE_SETUP.md for details.`
                    );
                  }
                  
                  // Generic error
                  throw new Error(
                    `Failed to upload file: ${errorData.error || errorData.details || 'Unknown error'}\n\nTechnical: ${errorData.technicalDetails || ''}`
                  );
                }
              } catch (uploadError: any) {
                console.error('File upload error:', uploadError);
                throw new Error(`Failed to upload file "${item.fileName}": ${uploadError.message || 'Unknown error'}`);
              }
            }

            // Remove file object before sending (not serializable)
            delete processedItem.file;
            return processedItem;
          })
        );
      } else {
        // Creating new skill: prepare items but don't upload files yet
        // Files will be uploaded after skill creation in the onSave callback
        processedContentItems = contentItems.map((item, index) => {
          const processedItem: any = {
            ...item,
            order: item.order !== undefined ? item.order : index,
          };
          // Keep file reference for later upload after skill creation
          return processedItem;
        });
      }

      await onSave(
        { name, description, level },
        processedContentItems
      );
    } catch (err: any) {
      setError(err.message || 'Failed to save skill');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Skill Information</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Skill Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Level *
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="Awareness">Awareness</option>
              <option value="Practice">Practice</option>
              <option value="Embodiment">Embodiment</option>
              <option value="Mastery">Mastery</option>
              <option value="Mentorship">Mentorship</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Content Items</h3>
          <Button type="button" onClick={addContentItem} variant="outline" size="sm">
            + Add Content
          </Button>
        </div>

        {contentItems.length === 0 ? (
          <p className="text-gray-500 text-sm">No content items yet. Click "Add Content" to add learning materials.</p>
        ) : (
          <div className="space-y-4">
            {contentItems.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => updateContentItem(index, { title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type *
                    </label>
                    <select
                      value={item.type}
                      onChange={(e) => updateContentItem(index, { type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="BOOK">Book</option>
                      <option value="VIDEO">Video</option>
                      <option value="ARTICLE">Article</option>
                      <option value="LINK">Link</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL (Optional - for external links)
                  </label>
                  <input
                    type="url"
                    value={item.url || ''}
                    onChange={(e) => updateContentItem(index, { url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://... (optional, for external links)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    You can provide a URL for external resources, or upload a file below, or both.
                  </p>
                </div>

                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload File (Optional - for PDFs, documents, etc.)
                  </label>
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Store file reference
                        updateContentItem(index, { 
                          file: file,
                          fileName: file.name,
                          fileSize: file.size,
                          fileType: file.type
                        });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    accept=".pdf,.doc,.docx,.txt,.epub,.mobi,.jpg,.jpeg,.png,.gif,.mp4,.mp3"
                  />
                  {item.fileName && (
                    <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                      <p className="text-sm text-blue-800">
                        ✓ Selected: <strong>{item.fileName}</strong> ({(item.fileSize || 0) / 1024} KB)
                      </p>
                      <button
                        type="button"
                        onClick={() => updateContentItem(index, { file: undefined, fileName: undefined, fileSize: undefined, fileType: undefined })}
                        className="text-xs text-blue-600 hover:text-blue-800 mt-1 underline"
                      >
                        Remove file
                      </button>
                    </div>
                  )}
                  {!item.url && !item.fileName && (
                    <p className="text-xs text-gray-500 mt-1">
                      Provide either a URL or upload a file (or both).
                    </p>
                  )}
                </div>

                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={item.notes || ''}
                    onChange={(e) => updateContentItem(index, { notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <Button
                  type="button"
                  onClick={() => removeContentItem(index)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="flex justify-end space-x-3">
        <Button type="button" onClick={onCancel} variant="outline">
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : skill ? 'Update Skill' : 'Create Skill'}
        </Button>
      </div>
    </form>
  );
}

