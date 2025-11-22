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
  const [level, setLevel] = useState<'Awareness' | 'Embodiment' | 'Mastery'>(skill?.level || 'Awareness');
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
      // Handle file uploads first if any
      const processedContentItems = await Promise.all(
        contentItems.map(async (item, index) => {
          const processedItem: any = {
            ...item,
            order: item.order !== undefined ? item.order : index,
          };

          // If file is present, upload it (in production, use proper file storage)
          if (item.file) {
            const formData = new FormData();
            formData.append('file', item.file);
            formData.append('skillId', skill?.id || 'new');
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
              }
            } catch (uploadError) {
              console.error('File upload error:', uploadError);
              // Continue without file URL - admin can add URL manually
            }
          }

          // Remove file object before sending (not serializable)
          delete processedItem.file;
          return processedItem;
        })
      );

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
              onChange={(e) => setLevel(e.target.value as 'Awareness' | 'Embodiment' | 'Mastery')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="Awareness">Awareness</option>
              <option value="Embodiment">Embodiment</option>
              <option value="Mastery">Mastery</option>
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
                    URL or Upload File
                  </label>
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={item.url || ''}
                      onChange={(e) => updateContentItem(index, { url: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://... or upload file below"
                    />
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Store file reference - in production, upload to storage service
                          updateContentItem(index, { 
                            file: file,
                            fileName: file.name,
                            fileSize: file.size,
                            fileType: file.type
                          });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      accept=".pdf,.doc,.docx,.txt,.epub,.mobi"
                    />
                    {item.fileName && (
                      <p className="text-sm text-gray-600">
                        Selected: {item.fileName} ({(item.fileSize || 0) / 1024} KB)
                      </p>
                    )}
                  </div>
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

