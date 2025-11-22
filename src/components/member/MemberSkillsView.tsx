'use client';

import { useState, useEffect } from 'react';
import { Card, Button } from '@/components';
import { Skill, SkillContentItem } from '@/types';
import { getCurrentUser } from '@/lib/auth';
import { ChevronDownIcon, ChevronUpIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

interface MemberSkillsViewProps {
  userId: string;
}

export default function MemberSkillsView({ userId }: MemberSkillsViewProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [skillDetails, setSkillDetails] = useState<{
    skill: Skill;
    contentItems: SkillContentItem[];
    progress: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSkills();
  }, [userId]);

  const loadSkills = async () => {
    try {
      const response = await fetch(`/api/member/skills?userId=${userId}`);
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
      const response = await fetch(`/api/member/skills/${skillId}?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setSkillDetails({
          skill: data.skill,
          contentItems: data.contentItems || [],
          progress: data.progress || 0,
        });
      }
    } catch (error) {
      console.error('Error loading skill details:', error);
    }
  };

  const handleToggleSkill = async (skillId: string) => {
    if (expandedSkill === skillId) {
      setExpandedSkill(null);
      setSkillDetails(null);
    } else {
      setExpandedSkill(skillId);
      await loadSkillDetails(skillId);
    }
  };

  const handleToggleContent = async (skillId: string, contentId: string, isCompleted: boolean) => {
    try {
      const response = await fetch(`/api/member/skills/${skillId}/content/${contentId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          isCompleted: !isCompleted,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state
        if (skillDetails && skillDetails.skill.id === skillId) {
          const updatedContent = skillDetails.contentItems.map((item) =>
            item.id === contentId
              ? { ...item, isCompleted: data.isCompleted }
              : item
          );
          setSkillDetails({
            ...skillDetails,
            contentItems: updatedContent,
            progress: data.progress,
          });
        }
        // Refresh skills list to update progress
        await loadSkills();
      }
    } catch (error) {
      console.error('Error toggling content completion:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your skills...</p>
      </div>
    );
  }

  if (skills.length === 0) {
    return (
      <Card className="p-8 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Skills Assigned</h3>
        <p className="text-gray-600">You don't have any skills assigned yet. Contact your admin to get started.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {skills.map((skill) => {
        const isExpanded = expandedSkill === skill.id;
        const details = isExpanded && skillDetails?.skill.id === skill.id ? skillDetails : null;

        return (
          <Card key={skill.id} className="overflow-hidden">
            <div
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => handleToggleSkill(skill.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{skill.name}</h3>
                  {skill.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{skill.description}</p>
                  )}
                  <div className="mt-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${skill.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {skill.progress || 0}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {skill.completedCount || 0} of {skill.totalCount || 0} content items completed
                    </p>
                  </div>
                </div>
                <div className="ml-4">
                  {isExpanded ? (
                    <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {isExpanded && details && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className="mb-4">
                  <h4 className="font-semibold mb-2">Full Description</h4>
                  <p className="text-sm text-gray-700">{details.skill.description || 'No description provided.'}</p>
                  
                  {/* Admin Comment */}
                  {details.skill.adminNotes && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs font-medium text-gray-700 mb-1">Comment:</p>
                      <p className="text-sm text-gray-700 italic">{details.skill.adminNotes}</p>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Progress</h4>
                    <span className="text-sm font-medium text-gray-700">
                      {details.progress}% Complete
                    </span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all"
                      style={{ width: `${details.progress}%` }}
                    />
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Learning Content</h4>
                  {details.contentItems.length === 0 ? (
                    <p className="text-sm text-gray-500">No content items available for this skill.</p>
                  ) : (
                    <div className="space-y-3">
                      {details.contentItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-gray-200"
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleContent(details.skill.id, item.id!, item.isCompleted || false);
                            }}
                            className="mt-0.5"
                          >
                            {item.isCompleted ? (
                              <CheckCircleIconSolid className="w-6 h-6 text-green-600" />
                            ) : (
                              <CheckCircleIcon className="w-6 h-6 text-gray-400 hover:text-green-600" />
                            )}
                          </button>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h5 className="font-medium text-gray-900">{item.title}</h5>
                                <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                  {item.type}
                                </span>
                              </div>
                            </div>
                            {(item.url || item.fileUrl) && (
                              <a
                                href={item.url || item.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {item.type === 'BOOK' || item.fileName ? `Open ${item.fileName || 'File'}` : 'Open Link'} →
                              </a>
                            )}
                            {item.notes && (
                              <p className="text-sm text-gray-600 mt-2">{item.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

