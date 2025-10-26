'use client';

import { useState, useEffect } from 'react';
import { getMembers, getSkills, getMemberSkills, saveMemberSkills } from '@/lib/data';
import { Card, Button } from '@/components';
import { Member, Skill, MemberSkills } from '@/types';

interface HierarchicalSkillAssignmentProps {
  onAssignmentComplete?: () => void;
}

export default function HierarchicalSkillAssignment({ onAssignmentComplete }: HierarchicalSkillAssignmentProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [memberSkills, setMemberSkills] = useState<MemberSkills[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMembers(getMembers());
    setSkills(getSkills());
    setMemberSkills(getMemberSkills());
  }, []);

  const handleMemberSelect = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSkillSelect = (skillId: string) => {
    setSelectedSkills(prev => 
      prev.includes(skillId) 
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  const toggleSkillExpansion = (skillId: string) => {
    setExpandedSkills(prev => {
      const newSet = new Set(prev);
      if (newSet.has(skillId)) {
        newSet.delete(skillId);
      } else {
        newSet.add(skillId);
      }
      return newSet;
    });
  };

  const selectAllMembers = () => {
    setSelectedMembers(members.map(m => m.id));
  };

  const clearMemberSelection = () => {
    setSelectedMembers([]);
  };

  const selectAllSkills = () => {
    const allSkillIds: string[] = [];
    skills.forEach(primarySkill => {
      allSkillIds.push(primarySkill.id);
      if (primarySkill.secondarySkills) {
        primarySkill.secondarySkills.forEach(secondarySkill => {
          allSkillIds.push(secondarySkill.id);
          if (secondarySkill.tertiarySkills) {
            secondarySkill.tertiarySkills.forEach(tertiarySkill => {
              allSkillIds.push(tertiarySkill.id);
            });
          }
        });
      }
    });
    setSelectedSkills(allSkillIds);
  };

  const clearSkillSelection = () => {
    setSelectedSkills([]);
  };

  const assignSkills = async () => {
    if (selectedMembers.length === 0 || selectedSkills.length === 0) {
      setStatus('Please select at least one member and one skill.');
      setTimeout(() => setStatus(''), 3000);
      return;
    }

    setIsLoading(true);
    setStatus('Assigning skills...');

    try {
      const updatedMemberSkills = [...memberSkills];
      const today = new Date().toISOString().split('T')[0];

      selectedMembers.forEach(memberId => {
        const member = members.find(m => m.id === memberId);
        if (!member) return;

        let memberSkillEntry = updatedMemberSkills.find(ms => ms.memberId === memberId);
        if (!memberSkillEntry) {
          memberSkillEntry = {
            memberId,
            memberName: member.name,
            skills: []
          };
          updatedMemberSkills.push(memberSkillEntry);
        }

        selectedSkills.forEach(skillId => {
          const skill = findSkillById(skillId);
          if (!skill) return;

          // Check if skill is already assigned
          const existingSkill = memberSkillEntry.skills.find(s => s.skillId === skillId);
          if (existingSkill) {
            return; // Skip if already assigned
          }

          // Add new skill assignment
          memberSkillEntry.skills.push({
            skillId,
            skillName: skill.name,
            level: skill.level,
            assignedDate: today,
            status: 'assigned',
            progress: 0,
            currentMilestone: 'milestone-1',
            completedMilestones: [],
            milestoneProgress: {
              'milestone-1': { completed: false, progress: 0 },
              'milestone-2': { completed: false, progress: 0 },
              'milestone-3': { completed: false, progress: 0 },
              'milestone-4': { completed: false, progress: 0 }
            },
            nextTask: 'Start learning this skill',
            achievements: [],
            adminApproved: false
          });
        });
      });

      const success = saveMemberSkills(updatedMemberSkills);
      
      if (success) {
        setMemberSkills(updatedMemberSkills);
        setStatus(`Successfully assigned ${selectedSkills.length} skill(s) to ${selectedMembers.length} member(s)!`);
        setSelectedMembers([]);
        setSelectedSkills([]);
        onAssignmentComplete?.();
      } else {
        setStatus('Failed to save skill assignments. Please try again.');
      }
    } catch (error) {
      console.error('Error assigning skills:', error);
      setStatus('An error occurred while assigning skills.');
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatus(''), 5000);
    }
  };

  const findSkillById = (skillId: string): Skill | null => {
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
    return null;
  };

  const getMemberSkillCount = (memberId: string) => {
    const memberSkill = memberSkills.find(ms => ms.memberId === memberId);
    return memberSkill?.skills.length || 0;
  };

  const isSkillAssignedToMember = (memberId: string, skillId: string) => {
    const memberSkill = memberSkills.find(ms => ms.memberId === memberId);
    return memberSkill?.skills.some(s => s.skillId === skillId) || false;
  };

  const renderSkillTree = (skill: Skill, level: number = 0) => {
    const isExpanded = expandedSkills.has(skill.id);
    const hasChildren = (skill.secondarySkills && skill.secondarySkills.length > 0) || 
                       (skill.tertiarySkills && skill.tertiarySkills.length > 0);

    return (
      <div key={skill.id} className={`${level > 0 ? 'ml-6' : ''}`}>
        <div
          className={`p-3 border rounded-lg cursor-pointer transition-colors mb-2 ${
            selectedSkills.includes(skill.id)
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => handleSkillSelect(skill.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{skill.icon}</span>
              <div>
                <div className="font-medium text-gray-900">{skill.name}</div>
                <div className="text-sm text-gray-600">{skill.category}</div>
                <div className="text-xs text-gray-500 mt-1">{skill.description}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {hasChildren && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSkillExpansion(skill.id);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {isExpanded ? '▼' : '▶'}
                </button>
              )}
            </div>
          </div>
        </div>

        {isExpanded && skill.secondarySkills && (
          <div className="space-y-2">
            {skill.secondarySkills.map(secondarySkill => (
              <div key={secondarySkill.id}>
                {renderSkillTree(secondarySkill, level + 1)}
                {isExpanded && secondarySkill.tertiarySkills && (
                  <div className="ml-6 space-y-2">
                    {secondarySkill.tertiarySkills.map(tertiarySkill => 
                      renderSkillTree(tertiarySkill, level + 2)
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Status Message */}
      {status && (
        <div className={`p-4 rounded-lg ${
          status.includes('Successfully') 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : status.includes('Please select') || status.includes('Failed') || status.includes('error')
            ? 'bg-red-50 border border-red-200 text-red-800'
            : 'bg-blue-50 border border-blue-200 text-blue-800'
        }`}>
          {status}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Member Selection */}
        <Card>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-gray-900">Select Members</h3>
              <div className="flex space-x-2">
                <Button 
                  onClick={selectAllMembers}
                  variant="outline"
                  size="sm"
                >
                  Select All
                </Button>
                <Button 
                  onClick={clearMemberSelection}
                  variant="outline"
                  size="sm"
                >
                  Clear
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {selectedMembers.length} member(s) selected
            </p>
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {members.map(member => (
              <div
                key={member.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedMembers.includes(member.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleMemberSelect(member.id)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-900">{member.name}</div>
                    <div className="text-sm text-gray-600">{member.role}</div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {getMemberSkillCount(member.id)} skills
                  </div>
                </div>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    member.status === 'online' ? 'bg-green-100 text-green-800' :
                    member.status === 'away' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {member.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Hierarchical Skill Selection */}
        <Card>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-gray-900">Select Skills</h3>
              <div className="flex space-x-2">
                <Button 
                  onClick={selectAllSkills}
                  variant="outline"
                  size="sm"
                >
                  Select All
                </Button>
                <Button 
                  onClick={clearSkillSelection}
                  variant="outline"
                  size="sm"
                >
                  Clear
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {selectedSkills.length} skill(s) selected
            </p>
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {skills.map(primarySkill => renderSkillTree(primarySkill))}
          </div>
        </Card>
      </div>

      {/* Assignment Preview */}
      {selectedMembers.length > 0 && selectedSkills.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment Preview</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Members ({selectedMembers.length})</h4>
                <div className="space-y-1">
                  {selectedMembers.map(memberId => {
                    const member = members.find(m => m.id === memberId);
                    return (
                      <div key={memberId} className="text-sm text-gray-600">
                        • {member?.name}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Skills ({selectedSkills.length})</h4>
                <div className="space-y-1">
                  {selectedSkills.map(skillId => {
                    const skill = findSkillById(skillId);
                    return (
                      <div key={skillId} className="text-sm text-gray-600">
                        • {skill?.name} ({skill?.category})
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Assignment Button */}
      <div className="flex justify-center">
        <Button
          onClick={assignSkills}
          disabled={selectedMembers.length === 0 || selectedSkills.length === 0 || isLoading}
          className="px-8 py-3"
        >
          {isLoading ? 'Assigning...' : `Assign ${selectedSkills.length} Skill(s) to ${selectedMembers.length} Member(s)`}
        </Button>
      </div>
    </div>
  );
}
