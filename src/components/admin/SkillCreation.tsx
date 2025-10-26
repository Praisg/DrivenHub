'use client';

import { useState, useEffect } from 'react';
import { Button, Card } from '@/components';
import { Skill, SkillContent } from '@/types';
import { getSkills, saveSkills } from '@/lib/data';

interface SkillCreationProps {
  onSkillCreated?: () => void;
}

export default function SkillCreation({ onSkillCreated }: SkillCreationProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [currentLevel, setCurrentLevel] = useState<'primary' | 'secondary' | 'tertiary'>('primary');
  const [skillName, setSkillName] = useState('');
  const [skillDescription, setSkillDescription] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Content management
  const [contentTitle, setContentTitle] = useState('');
  const [contentType, setContentType] = useState<'book' | 'video' | 'article' | 'course' | 'document'>('book');
  const [contentUrl, setContentUrl] = useState('');
  const [contentDescription, setContentDescription] = useState('');
  const [selectedSkillForContent, setSelectedSkillForContent] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = () => {
    const skillsData = getSkills();
    setSkills(skillsData);
  };

  const generateId = () => {
    return 'skill-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  };

  const handleCreateSkill = async () => {
    if (!skillName.trim()) {
      setStatus('Please enter a skill name');
      return;
    }

    setIsLoading(true);
    setStatus('Creating skill...');

    try {
      const newSkill: Skill = {
        id: generateId(),
        name: skillName.trim(),
        description: skillDescription.trim(),
        category: currentLevel,
        icon: '📚', // Default icon
        color: '#3B82F6', // Default color
        level: currentLevel,
        subtopics: [],
        content: [],
        createdAt: new Date().toISOString(),
        createdBy: 'admin'
      };

      const updatedSkills = [...skills, newSkill];
      const success = saveSkills(updatedSkills);

      if (success) {
        setSkills(updatedSkills);
        setStatus('Skill created successfully!');
        setSkillName('');
        setSkillDescription('');
        onSkillCreated?.();
      } else {
        setStatus('Failed to create skill. Please try again.');
      }
    } catch (error) {
      console.error('Error creating skill:', error);
      setStatus('An error occurred while creating the skill.');
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatus(''), 3000);
    }
  };

  const handleAddContent = async () => {
    if (!contentTitle.trim() || !selectedSkillForContent) {
      setStatus('Please fill in all content fields and select a skill');
      return;
    }

    setIsLoading(true);
    setStatus('Adding content...');

    try {
      // Handle file upload
      let fileUrl = contentUrl.trim();
      if (uploadedFile) {
        // In a real app, you would upload the file to a server
        // For now, we'll create a local URL
        fileUrl = URL.createObjectURL(uploadedFile);
      }

      const newContent: SkillContent = {
        id: generateId(),
        title: contentTitle.trim(),
        type: contentType,
        url: fileUrl,
        description: contentDescription.trim(),
        uploadedAt: new Date().toISOString()
      };

      const updatedSkills = skills.map(skill => {
        if (skill.id === selectedSkillForContent) {
          return {
            ...skill,
            content: [...(skill.content || []), newContent]
          };
        }
        return skill;
      });

      const success = saveSkills(updatedSkills);

      if (success) {
        setSkills(updatedSkills);
        setStatus('Content added successfully!');
        setContentTitle('');
        setContentUrl('');
        setContentDescription('');
        setSelectedSkillForContent('');
        setUploadedFile(null);
        onSkillCreated?.();
      } else {
        setStatus('Failed to add content. Please try again.');
      }
    } catch (error) {
      console.error('Error adding content:', error);
      setStatus('An error occurred while adding content.');
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatus(''), 3000);
    }
  };

  const getSkillsByLevel = (level: 'primary' | 'secondary' | 'tertiary') => {
    return skills.filter(skill => skill.level === level);
  };

  const getSubtopics = (parentId: string) => {
    return skills.filter(skill => skill.parentId === parentId);
  };

  const getAllSkills = () => {
    return skills;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Create Skills</h2>
        <Button onClick={loadSkills} variant="outline" disabled={isLoading}>
          Refresh Skills
        </Button>
      </div>

      {status && (
        <div className={`p-4 rounded-lg ${
          status.includes('successfully') 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : status.includes('Please') || status.includes('Failed') || status.includes('error')
            ? 'bg-red-50 border border-red-200 text-red-800'
            : 'bg-blue-50 border border-blue-200 text-blue-800'
        }`}>
          {status}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skill Creation */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Skill</h3>
            
            <div className="space-y-4">
              {/* Level Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Skill Level</label>
                <div className="flex space-x-2">
                  {(['primary', 'secondary', 'tertiary'] as const).map(level => (
                    <button
                      key={level}
                      onClick={() => setCurrentLevel(level)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                        currentLevel === level
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Skill Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Skill Name</label>
                <input
                  type="text"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  placeholder="e.g., Emotional Intelligence"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Skill Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={skillDescription}
                  onChange={(e) => setSkillDescription(e.target.value)}
                  placeholder="Describe what this skill involves..."
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <Button
                onClick={handleCreateSkill}
                disabled={isLoading || !skillName.trim()}
                className="w-full"
              >
                {isLoading ? 'Creating...' : 'Create Skill'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Content Management */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Learning Content</h3>
            
            <div className="space-y-4">
              {/* Skill Selection for Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Skill</label>
                <select
                  value={selectedSkillForContent}
                  onChange={(e) => setSelectedSkillForContent(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a skill to add content</option>
                  {getAllSkills().map(skill => (
                    <option key={skill.id} value={skill.id}>
                      {skill.icon} {skill.name} ({skill.level})
                    </option>
                  ))}
                </select>
              </div>

              {/* Content Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content Title</label>
                <input
                  type="text"
                  value={contentTitle}
                  onChange={(e) => setContentTitle(e.target.value)}
                  placeholder="e.g., Emotional Intelligence Book"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Content Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as 'book' | 'video' | 'article' | 'course' | 'document')}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="book">📚 Book</option>
                  <option value="video">🎥 Video</option>
                  <option value="article">📄 Article</option>
                  <option value="course">🎓 Course</option>
                  <option value="document">📋 Document</option>
                </select>
              </div>

              {/* Content URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">URL (Optional)</label>
                <input
                  type="url"
                  value={contentUrl}
                  onChange={(e) => setContentUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload File (Optional)</label>
                <input
                  type="file"
                  onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                  accept=".pdf,.doc,.docx,.txt,.mp4,.avi,.mov,.jpg,.jpeg,.png,.gif"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {uploadedFile && (
                  <p className="text-sm text-gray-600 mt-1">
                    Selected: {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {/* Content Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={contentDescription}
                  onChange={(e) => setContentDescription(e.target.value)}
                  placeholder="Describe this learning material..."
                  rows={2}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <Button
                onClick={handleAddContent}
                disabled={isLoading || !contentTitle.trim() || !selectedSkillForContent}
                className="w-full"
              >
                {isLoading ? 'Adding...' : 'Add Content'}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Skills Overview */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Created Skills Overview</h3>
          
          {skills.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No skills created yet. Create your first skill above!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {skills.map(skill => (
                <div key={skill.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">{skill.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{skill.name}</h4>
                      <p className="text-sm text-gray-600">{skill.description}</p>
                      <span className={`text-xs px-2 py-1 rounded capitalize ${
                        skill.level === 'primary' ? 'bg-blue-100 text-blue-800' :
                        skill.level === 'secondary' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {skill.level}
                      </span>
                    </div>
                  </div>
                  
                  {skill.content && skill.content.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-1">Content ({skill.content.length}):</p>
                      <div className="space-y-1">
                        {skill.content.map(content => (
                          <div key={content.id} className="text-xs text-gray-600">
                            • {content.title} ({content.type})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
