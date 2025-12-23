'use client';

import { useState, useEffect } from 'react';
import { Button, Card } from '@/components';
import SkillForm from './SkillForm';
import { Skill, SkillContentItem } from '@/types';

interface SkillManagementProps {
  onUpdate?: () => void;
}

export default function SkillManagement({ onUpdate }: SkillManagementProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [contentItems, setContentItems] = useState<SkillContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadSkills();
  }, []);

  useEffect(() => {
    if (selectedSkill) {
      loadSkillDetails(selectedSkill.id);
    }
  }, [selectedSkill]);

  const loadSkills = async () => {
    try {
      const response = await fetch('/api/admin/skills');
      if (response.ok) {
        const data = await response.json();
        setSkills(data.skills || []);
      }
    } catch (error) {
      console.error('Error loading skills:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSkillDetails = async (skillId: string) => {
    try {
      const response = await fetch(`/api/admin/skills/${skillId}`);
      if (response.ok) {
        const data = await response.json();
        setContentItems(data.contentItems || []);
        // Update the skill form will load content items via useEffect
      }
    } catch (error) {
      console.error('Error loading skill details:', error);
    }
  };

  const handleEdit = (skill: Skill) => {
    setSelectedSkill(skill);
    setIsEditing(true);
  };

  const handleSave = async (skillData: Partial<Skill>, contentItemsData: SkillContentItem[]) => {
    if (!selectedSkill) return;

    // Filter out empty items but preserve all items with titles (even if empty string from form)
    const validContentItems = contentItemsData.filter(item => item.title && item.title.trim() !== '');

    const response = await fetch(`/api/admin/skills/${selectedSkill.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: skillData.name,
        description: skillData.description,
        what_it_develops: skillData.what_it_develops,
        why_it_matters: skillData.why_it_matters,
        how_it_works: skillData.how_it_works,
        level: skillData.level,
        contentItems: validContentItems,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update skill');
    }

    setIsEditing(false);
    setSelectedSkill(null);
    setContentItems([]);
    await loadSkills();
    onUpdate?.();
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading skills...</div>;
  }

  if (isEditing && selectedSkill) {
    return (
      <div>
        <div className="mb-4">
          <Button onClick={() => { setIsEditing(false); setSelectedSkill(null); }} variant="outline">
            ← Back to List
          </Button>
        </div>
        <h3 className="text-xl font-bold mb-4">Edit Skill: {selectedSkill.name}</h3>
        <SkillForm
          skill={selectedSkill}
          onSave={handleSave}
          onCancel={() => { setIsEditing(false); setSelectedSkill(null); }}
        />
      </div>
    );
  }

  const handleDelete = async (skillId: string) => {
    if (!confirm('Are you sure you want to delete this skill? This will permanently delete the skill and all its content. This action cannot be undone.')) {
      return;
    }
    try {
      const response = await fetch(`/api/admin/skills/${skillId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await loadSkills();
        onUpdate?.();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete skill');
      }
    } catch (error) {
      console.error('Error deleting skill:', error);
      alert('Failed to delete skill. Please try again.');
    }
  };

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Manage Skills</h3>
      
      {skills.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500">No skills created yet. Create your first skill to get started.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {skills.map((skill) => (
            <Card key={skill.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-semibold text-lg">{skill.name}</h4>
                    {skill.isActive === false && (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">Inactive</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{skill.description || 'No description'}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span>Level: <span className="font-medium">{skill.level}</span></span>
                    <span>Content Items: <span className="font-medium">{skill.contentCount || 0}</span></span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button onClick={() => handleEdit(skill)} variant="outline" size="sm">
                    Edit
                  </Button>
                  <Button onClick={() => handleDelete(skill.id)} variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
