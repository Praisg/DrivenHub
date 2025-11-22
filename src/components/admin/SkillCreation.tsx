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
    const response = await fetch('/api/admin/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: skillData.name,
        description: skillData.description,
        level: skillData.level,
        contentItems: contentItems.filter(item => item.title.trim() !== ''),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create skill');
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
