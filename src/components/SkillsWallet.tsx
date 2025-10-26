"use client";

import { useState } from 'react';
import { Skill, MemberSkills, Member } from '@/types';
import { Button } from '@/components';

interface SkillsWalletProps {
  skills: Skill[];
  memberSkills: MemberSkills[];
  members?: Member[];
  isAdmin?: boolean;
  currentUserId?: string; // Add current user ID for member view
  onRefresh?: () => void; // Add refresh callback
}

export default function SkillsWallet({ skills, memberSkills, members = [], isAdmin = false, currentUserId, onRefresh }: SkillsWalletProps) {

  // For member view, get skills from their own profile data
  const getMemberSkillsForDisplay = () => {
    if (!isAdmin && currentUserId) {
      // Find the member's own data
      const member = members.find(m => m.id === currentUserId);
      if (member && member.assignedSkills) {
        return [{
          memberId: currentUserId,
          memberName: member.name,
          skills: member.assignedSkills
        }];
      }
    }
    return memberSkills;
  };

  const displayMemberSkills = getMemberSkillsForDisplay();

  // Flatten all skills from the hierarchical structure
  const getAllSkills = (): Skill[] => {
    const allSkills: Skill[] = [];
    
    skills.forEach(primarySkill => {
      allSkills.push(primarySkill);
      
      if (primarySkill.secondarySkills) {
        primarySkill.secondarySkills.forEach(secondarySkill => {
          allSkills.push(secondarySkill);
          
          if (secondarySkill.tertiarySkills) {
            secondarySkill.tertiarySkills.forEach(tertiarySkill => {
              allSkills.push(tertiarySkill);
            });
          }
        });
      }
    });
    
    return allSkills;
  };

  const handleRemoveSkill = (memberId: string, skillId: string) => {
    // In a real app, this would make an API call
    console.log(`Removing skill ${skillId} from member ${memberId}`);
  };

  const getSkillById = (skillId: string) => {
    // Search through all skill levels (primary, secondary, tertiary)
    for (const primarySkill of skills) {
      if (primarySkill.id === skillId) return primarySkill;
      
      if (primarySkill.secondarySkills) {
        for (const secondarySkill of primarySkill.secondarySkills) {
          if (secondarySkill.id === skillId) return secondarySkill;
          
          if (secondarySkill.tertiarySkills) {
            for (const tertiarySkill of secondarySkill.tertiarySkills) {
              if (tertiarySkill.id === skillId) return tertiarySkill;
            }
          }
        }
      }
    }
    return undefined;
  };

  const getMemberById = (memberId: string) => {
    return memberSkills.find(member => member.memberId === memberId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'learning': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'mastered': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="driven-card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-white">💼</span>
          </div>
          <h3 className="text-xl font-semibold driven-heading">Skills Wallet</h3>
        </div>
      </div>

      {/* Refresh Button */}
      {onRefresh && (
        <div className="mb-4 flex justify-end">
          <Button onClick={onRefresh} size="sm" variant="outline">
            Refresh Data
          </Button>
        </div>
      )}

      {/* Skills Overview */}
      <div className="space-y-4">
        {displayMemberSkills.map((member) => (
          <div key={member.memberId} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold driven-heading">{member.memberName}</h4>
              <span className="text-sm driven-text-muted">
                {member.skills.length} skill{member.skills.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            {member.skills.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {member.skills.map((skill) => {
                  const skillData = getSkillById(skill.skillId);
                  return (
                    <div key={skill.skillId} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{skillData?.icon || '📚'}</span>
                        <div>
                          <p className="font-medium driven-heading text-sm">{skill.skillName}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(skill.status)}`}>
                              {skill.status}
                            </span>
                            <div className="flex items-center space-x-2">
                              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${getProgressColor(skill.progress)}`}
                                  style={{ width: `${skill.progress}%` }}
                                />
                              </div>
                              <span className="text-xs driven-text-muted">{skill.progress}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => handleRemoveSkill(member.memberId, skill.skillId)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <span className="text-2xl mb-2 block">📚</span>
                <p className="text-sm driven-text-muted">No skills assigned yet</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Available Skills Summary - Only show for admins */}
      {isAdmin && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="font-semibold driven-heading mb-3">Available Skills ({getAllSkills().length})</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {getAllSkills().map((skill) => (
              <div key={skill.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                <span className="text-sm">{skill.icon}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-xs driven-text-muted block truncate">{skill.name}</span>
                  <span className="text-xs text-gray-400">{skill.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

