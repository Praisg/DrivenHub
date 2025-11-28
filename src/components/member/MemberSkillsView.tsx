'use client';

import { useState, useEffect } from 'react';
import { Card, Button } from '@/components';
import { Skill, SkillContentItem } from '@/types';
import { getCurrentUser } from '@/lib/auth';
import { ChevronDownIcon, ChevronUpIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
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
    completedCount?: number;
    totalCount?: number;
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
          completedCount: data.completedCount || 0,
          totalCount: data.totalCount || 0,
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

  const handleToggleContent = async (skillId: string, contentId: string, currentIsCompleted: boolean) => {
    try {
      // Toggle completion - endpoint will check current state and toggle it
      const response = await fetch(`/api/member/skills/${skillId}/content/${contentId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          // Don't send isCompleted - let the endpoint toggle based on current state
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update local state immediately for responsive UI
        if (skillDetails && skillDetails.skill.id === skillId) {
          const updatedContent = skillDetails.contentItems.map((item) =>
            item.id === contentId
              ? { ...item, isCompleted: data.isCompleted }
              : item
          );
          
          // Update skill details with new progress
          setSkillDetails({
            ...skillDetails,
            contentItems: updatedContent,
            progress: data.progress,
            completedCount: data.completedCount,
            totalCount: data.totalCount,
          });
        }
        
        // Refresh skills list to update progress bar in the collapsed view
        await loadSkills();
      } else {
        const errorData = await response.json();
        console.error('Error toggling content:', errorData);
        alert(`Failed to update progress: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error toggling content completion:', error);
      alert('Failed to update progress. Please try again.');
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
          <Card key={skill.id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200">
            <div
              className="p-5 cursor-pointer hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all duration-200"
              onClick={() => handleToggleSkill(skill.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-bold text-xl text-gray-900">{skill.name}</h3>
                    {/* Show badges only for explicit admin actions: Completed or Rejected */}
                    {/* New assignments (adminApproved is null/undefined) show no badge */}
                    {skill.status === 'COMPLETED' ? (
                      <span className="px-3 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full shadow-sm flex items-center">
                        <CheckCircleIconSolid className="w-4 h-4 mr-1" />
                        Completed
                      </span>
                    ) : skill.adminApproved === false ? (
                      <span className="px-3 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full shadow-sm flex items-center">
                        <XCircleIcon className="w-4 h-4 mr-1" />
                        Rejected
                      </span>
                    ) : null}
                  </div>
                  {skill.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2 leading-relaxed">{skill.description}</p>
                  )}
                </div>
                <div className="ml-6 flex-shrink-0">
                  {isExpanded ? (
                    <ChevronUpIcon className="w-6 h-6 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <ChevronDownIcon className="w-6 h-6 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </div>
              </div>
            </div>

            {/* Progress Bar - Always visible, outside expanded section */}
            <div className="border-t border-gray-200 bg-white px-5 py-4">
              {isExpanded && details ? (
                // Show detailed progress when expanded (uses details data)
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">Progress</h4>
                    <div className="flex items-center space-x-3">
                      {/* Show only the latest admin decision: Completed takes precedence over Rejected */}
                      {details.skill.status === 'COMPLETED' ? (
                        <span className="px-3 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full shadow-sm flex items-center">
                          <CheckCircleIconSolid className="w-4 h-4 mr-1" />
                          Completed
                        </span>
                      ) : details.skill.adminApproved === false ? (
                        <span className="px-3 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full shadow-sm flex items-center">
                          <XCircleIcon className="w-4 h-4 mr-1" />
                          Rejected
                        </span>
                      ) : null}
                      <span className={`text-base font-bold ${
                        details.skill.status === 'COMPLETED' 
                          ? 'text-green-700' 
                          : details.skill.adminApproved === false
                          ? 'text-red-700'
                          : 'text-gray-900'
                      }`}>
                        {details.progress}%
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-200 rounded-full h-4 shadow-inner overflow-hidden">
                    <div
                      className={`h-4 rounded-full transition-all duration-500 ease-out shadow-sm ${
                        details.skill.status === 'COMPLETED' 
                          ? 'bg-gradient-to-r from-green-500 to-green-600' 
                          : details.skill.adminApproved === false
                          ? 'bg-gradient-to-r from-red-500 to-red-600'
                          : 'bg-gradient-to-r from-blue-500 to-blue-600'
                      }`}
                      style={{ width: `${details.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {details.completedCount || 0} of {details.totalCount || 0} content items completed
                  </p>
                </div>
              ) : (
                // Show collapsed progress when not expanded (uses skill data)
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">Progress</h4>
                    <div className="flex items-center space-x-3">
                      {skill.status === 'COMPLETED' ? (
                        <span className="px-3 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full shadow-sm flex items-center">
                          <CheckCircleIconSolid className="w-4 h-4 mr-1" />
                          Completed
                        </span>
                      ) : skill.adminApproved === false ? (
                        <span className="px-3 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full shadow-sm flex items-center">
                          <XCircleIcon className="w-4 h-4 mr-1" />
                          Rejected
                        </span>
                      ) : null}
                      <span className={`text-base font-bold ${
                        skill.status === 'COMPLETED' 
                          ? 'text-green-700' 
                          : skill.adminApproved === false
                          ? 'text-red-700'
                          : 'text-gray-900'
                      }`}>
                        {skill.progress || 0}%
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-200 rounded-full h-4 shadow-inner overflow-hidden">
                    <div
                      className={`h-4 rounded-full transition-all duration-500 ease-out shadow-sm ${
                        skill.status === 'COMPLETED' 
                          ? 'bg-gradient-to-r from-green-500 to-green-600' 
                          : skill.adminApproved === false
                          ? 'bg-gradient-to-r from-red-500 to-red-600'
                          : 'bg-gradient-to-r from-blue-500 to-blue-600'
                      }`}
                      style={{ width: `${skill.progress || 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {skill.completedCount || 0} of {skill.totalCount || 0} content items completed
                  </p>
                </div>
              )}
            </div>

            {isExpanded && details && (
              <div className="border-t border-gray-200 bg-gradient-to-br from-gray-50 to-white">
                <div className="p-6 space-y-6">
                  {/* Full Description Section */}
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <span className="w-1 h-5 bg-blue-600 rounded-full mr-2"></span>
                      Full Description
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {details.skill.description || 'No description provided.'}
                    </p>
                    
                    {/* Admin Comment */}
                    {details.skill.adminNotes && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm">
                        <p className="text-xs font-semibold text-blue-900 mb-2 uppercase tracking-wide">Admin Comment</p>
                        <p className="text-sm text-gray-800 italic leading-relaxed">{details.skill.adminNotes}</p>
                      </div>
                    )}
                  </div>

                  {/* Learning Content Section */}
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="w-1 h-5 bg-blue-600 rounded-full mr-2"></span>
                      Learning Content
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                        {details.contentItems.length}
                      </span>
                    </h4>
                    {details.contentItems.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-sm">No content items available for this skill.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {details.contentItems.map((item, index) => (
                          <div
                            key={item.id}
                            className={`group flex items-start space-x-4 p-4 rounded-lg border-2 transition-all duration-200 ${
                              item.isCompleted
                                ? 'bg-green-50 border-green-200 shadow-sm'
                                : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
                            }`}
                          >
                            {/* Checkbox */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (details.skill.status === 'COMPLETED') {
                                  return;
                                }
                                handleToggleContent(details.skill.id, item.id!, item.isCompleted || false);
                              }}
                              className={`mt-0.5 transition-transform ${
                                details.skill.status === 'COMPLETED' 
                                  ? 'cursor-not-allowed opacity-50' 
                                  : 'cursor-pointer hover:scale-110 active:scale-95'
                              }`}
                              disabled={details.skill.status === 'COMPLETED'}
                              title={details.skill.status === 'COMPLETED' ? 'Skill marked as complete by admin' : item.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                            >
                              {item.isCompleted ? (
                                <CheckCircleIconSolid className="w-7 h-7 text-green-600 drop-shadow-sm" />
                              ) : (
                                <CheckCircleIcon className={`w-7 h-7 transition-colors ${
                                  details.skill.status === 'COMPLETED' 
                                    ? 'text-gray-300' 
                                    : 'text-gray-400 group-hover:text-green-500'
                                }`} />
                              )}
                            </button>
                            
                            {/* Content Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <h5 className="font-semibold text-gray-900 mb-1 text-base">
                                    {item.title}
                                  </h5>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-md shadow-sm">
                                      {item.type}
                                    </span>
                                    {item.isCompleted && (
                                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-md">
                                        ✓ Completed
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Links */}
                              {(item.url || item.fileUrl || item.externalUrl) && (
                                <div className="mt-3 flex flex-wrap gap-3">
                                  {item.url && (
                                    <a
                                      href={item.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors shadow-sm hover:shadow"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {item.fileName 
                                        ? `📄 ${item.fileName}` 
                                        : item.type === 'BOOK' 
                                          ? `📚 Open Book` 
                                          : '🔗 Open Link'}
                                      <span className="ml-1">→</span>
                                    </a>
                                  )}
                                  {item.externalUrl && item.externalUrl !== item.url && (
                                    <a
                                      href={item.externalUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors shadow-sm hover:shadow"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      🔗 External Link
                                      <span className="ml-1">→</span>
                                    </a>
                                  )}
                                </div>
                              )}
                              
                              {/* Notes */}
                              {item.notes && (
                                <p className="text-sm text-gray-600 mt-3 leading-relaxed bg-gray-50 p-2 rounded border-l-2 border-gray-300">
                                  {item.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

