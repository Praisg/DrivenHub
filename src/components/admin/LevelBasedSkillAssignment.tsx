'use client';

import { useState, useEffect } from 'react';
import { getMembers, saveMemberSkills, getRegisteredMembers } from '@/lib/data';
import { getSkillsFromDB, getMemberSkillsFromDB } from '@/lib/db-data';
import { Card, Button } from '@/components';
import { Member, Skill, MemberSkills } from '@/types';

interface LevelBasedSkillAssignmentProps {
  onAssignmentComplete?: () => void;
}

export default function LevelBasedSkillAssignment({ onAssignmentComplete }: LevelBasedSkillAssignmentProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [memberSkills, setMemberSkills] = useState<MemberSkills[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Fetch members from database
        const membersResponse = await fetch('/api/admin/members');
        if (membersResponse.ok) {
          const membersResult = await membersResponse.json();
          setMembers(membersResult.members || []);
        } else {
          console.error('Failed to fetch members from database, falling back to local data');
          const membersData = getRegisteredMembers();
          setMembers(membersData);
        }
        
        // Fetch skills from database (only active skills)
        const skillsData = await getSkillsFromDB();
        // Filter to only show active skills
        setSkills(skillsData.filter((s: any) => s.isActive !== false));
        
        // Fetch member skills from database
        const memberSkillsData = await getMemberSkillsFromDB();
        setMemberSkills(memberSkillsData);
      } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to local data only if database fails completely
        const membersData = getRegisteredMembers();
        setMembers(membersData);
        setSkills([]);
        setMemberSkills([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
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

  const selectAllMembers = () => {
    setSelectedMembers(members.map(m => m.id));
  };

  const clearMemberSelection = () => {
    setSelectedMembers([]);
  };

  const selectAllSkillsInLevel = (level: 'Awareness' | 'Practice' | 'Embodiment' | 'Mastery' | 'Mentorship') => {
    const skillsInLevel = getAllSkillsByLevel(level);
    const skillIds = skillsInLevel.map(skill => skill.id);
    
    setSelectedSkills(prev => {
      const newSelection = [...prev];
      skillIds.forEach(id => {
        if (!newSelection.includes(id)) {
          newSelection.push(id);
        }
      });
      return newSelection;
    });
  };

  const clearSkillSelection = () => {
    setSelectedSkills([]);
  };

  const getAllSkillsByLevel = (level: 'Awareness' | 'Practice' | 'Embodiment' | 'Mastery' | 'Mentorship'): Skill[] => {
    // Filter skills by level - new system uses flat structure
    return skills.filter(skill => skill.level === level);
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
          // Don't set adminApproved - leave it undefined/null so it's not marked as rejected
          memberSkillEntry.skills.push({
            skillId,
            skillName: skill.name,
            level: skill.level,
            assignedDate: today,
            status: 'NOT_STARTED',
            progress: 0,
            // Don't set adminApproved - new assignments should have no admin status
          });
        });
      });

      // Save to database via API
      let allSuccess = true;
      for (const memberId of selectedMembers) {
        const memberSkillsEntry = updatedMemberSkills.find(ms => ms.memberId === memberId);
        if (memberSkillsEntry) {
          try {
            const response = await fetch('/api/admin/assign-skills', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                memberId,
                skills: memberSkillsEntry.skills,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              console.error(`Failed to assign skills to member ${memberId}:`, errorData);
              allSuccess = false;
            }
          } catch (error) {
            console.error(`Error assigning skills to member ${memberId}:`, error);
            allSuccess = false;
          }
        }
      }

      // Also save to localStorage for backward compatibility
      saveMemberSkills(updatedMemberSkills);
      
      if (allSuccess) {
        setMemberSkills(updatedMemberSkills);
        setStatus(`Successfully assigned ${selectedSkills.length} skill(s) to ${selectedMembers.length} member(s)!`);
        setSelectedMembers([]);
        setSelectedSkills([]);
        
        // Refresh members list to get updated skill counts
        try {
          const membersResponse = await fetch('/api/admin/members');
          if (membersResponse.ok) {
            const membersResult = await membersResponse.json();
            setMembers(membersResult.members || []);
          }
        } catch (error) {
          console.error('Error refreshing members:', error);
        }
        
        onAssignmentComplete?.();
      } else {
        setStatus('Some skill assignments failed. Please check and try again.');
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
    // Simple lookup - new system uses flat structure
    return skills.find(skill => skill.id === skillId) || null;
  };

  const getMemberSkillCount = (memberId: string) => {
    // First check the member's assigned_skills from database
    const member = members.find(m => m.id === memberId);
    if (member && member.assignedSkills && Array.isArray(member.assignedSkills)) {
      return member.assignedSkills.length;
    }
    // Fallback to memberSkills state
    const memberSkill = memberSkills.find(ms => ms.memberId === memberId);
    return memberSkill?.skills.length || 0;
  };

  const renderSkillLevel = (level: 'Awareness' | 'Practice' | 'Embodiment' | 'Mastery' | 'Mentorship', title: string) => {
    const skillsInLevel = getAllSkillsByLevel(level);
    
    return (
      <Card key={level}>
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <div className="flex space-x-2">
              <Button 
                onClick={() => selectAllSkillsInLevel(level)}
                variant="outline"
                size="sm"
              >
                Select All {title}
              </Button>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            {skillsInLevel.length} {title.toLowerCase()} skill(s) available
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {skillsInLevel.map(skill => (
            <div
              key={skill.id}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedSkills.includes(skill.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleSkillSelect(skill.id)}
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">{skill.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm truncate">{skill.name}</div>
                  <div className="text-xs text-gray-500 truncate">{skill.description}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
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

        {/* Skill Selection Summary */}
        <Card>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-gray-900">Selected Skills</h3>
              <Button 
                onClick={clearSkillSelection}
                variant="outline"
                size="sm"
              >
                Clear All
              </Button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {selectedSkills.length} skill(s) selected
            </p>
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {selectedSkills.map(skillId => {
              const skill = findSkillById(skillId);
              return (
                <div key={skillId} className="p-2 border border-gray-200 rounded bg-gray-50">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{skill?.icon}</span>
                    <div className="text-sm font-medium text-gray-900">{skill?.name}</div>
                    <span className="text-xs text-gray-500">({skill?.category})</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Skill Levels */}
      <div className="space-y-6">
        {renderSkillLevel('Awareness', 'Awareness Skills')}
        {renderSkillLevel('Practice', 'Practice Skills')}
        {renderSkillLevel('Embodiment', 'Embodiment Skills')}
        {renderSkillLevel('Mastery', 'Mastery Skills')}
        {renderSkillLevel('Mentorship', 'Mentorship Skills')}
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