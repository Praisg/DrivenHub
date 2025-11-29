'use client';

import { useState, useEffect } from 'react';
import { getSkills, getRegisteredMembers, updateMemberSkills, getMemberSkills } from '@/lib/data';
import { Card, Button } from '@/components';
import { Skill } from '@/types';

interface MemberDashboardProps {
  memberId: string;
}

export default function MemberDashboard({ memberId }: MemberDashboardProps) {
  const [member, setMember] = useState<any>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const loadMemberData = async () => {
      try {
        // Get current user from localStorage
        const storedUser = localStorage.getItem('driven-current-user');
        if (!storedUser) {
          return;
        }

        const user = JSON.parse(storedUser);
        let memberData: any = null;

        // Try to get member from Supabase if we have email
        if (user.email) {
          try {
            // Note: We can't verify password here, so we'll use the stored user data
            // In production, you'd want to fetch from Supabase with proper auth
            memberData = {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              registrationDate: new Date().toISOString().split('T')[0],
              assignedSkills: []
            };
          } catch (err) {
            // Fallback to local storage
          }
        }

        // Fallback to local storage
        if (!memberData) {
          const members = getRegisteredMembers();
          memberData = members.find(m => m.id === memberId || m.email === user.email);
        }

        // If still no member found, use the stored user data
        if (!memberData && user) {
          memberData = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            registrationDate: new Date().toISOString().split('T')[0],
            assignedSkills: []
          };
        }

        if (!memberData) {
          console.warn('Member not found');
          return;
        }

        const skillsData = getSkills();
        const memberSkillsData = getMemberSkills();
        
        // Find this member's assigned skills (match by ID or email)
        const memberSkillsEntry = memberSkillsData.find(
          ms => ms.memberId === memberId || 
                 ms.memberId === memberData.id ||
                 (ms.memberName && ms.memberName.toLowerCase() === memberData.name?.toLowerCase())
        );
        
        if (memberSkillsEntry) {
          memberData.assignedSkills = memberSkillsEntry.skills || [];
        } else {
          memberData.assignedSkills = memberData.assignedSkills || [];
        }
        
        setMember(memberData);
        setSkills(skillsData);
      } catch (error) {
        console.error('Error loading member data:', error);
      }
    };

    loadMemberData();
    
    // Refresh data every 2 seconds to catch new assignments
    const interval = setInterval(loadMemberData, 2000);
    
    return () => clearInterval(interval);
  }, [memberId]);

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

  const updateProgress = async (skillId: string, newProgress: number) => {
    if (!member) return;

    setIsLoading(true);
    setStatus('Updating progress...');

    try {
      const updatedSkills = member.assignedSkills.map((skill: any) => {
        if (skill.skillId === skillId) {
          let newStatus = skill.status;
          if (newProgress >= 100) {
            newStatus = 'completed';
          } else if (newProgress > 0 && skill.status === 'assigned') {
            newStatus = 'learning';
          }

          return {
            ...skill,
            progress: Math.min(100, Math.max(0, newProgress)),
            status: newStatus
          };
        }
        return skill;
      });

      const success = updateMemberSkills(memberId, updatedSkills);
      
      if (success) {
        setMember({ ...member, assignedSkills: updatedSkills });
        setStatus('Progress updated successfully!');
      } else {
        setStatus('Failed to update progress. Please try again.');
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      setStatus('An error occurred while updating progress.');
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatus(''), 3000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-gray-100 text-gray-800';
      case 'learning': return 'bg-blue-100 text-blue-800';
      case 'completed': return '';
      case 'mastered': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusStyle = (status: string) => {
    if (status === 'completed') {
      return { backgroundColor: '#e1ebd9', color: '#455933' };
    }
    return undefined;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return '';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getProgressStyle = (progress: number) => {
    if (progress >= 100) {
      return { backgroundColor: '#7EA25A' };
    }
    return undefined;
  };

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {member.name}!</h1>
        <p className="text-gray-600">Track your learning progress and manage your skills</p>
      </div>

      {/* Status Message */}
      {status && (
        <div 
          className={`mb-6 p-4 rounded-lg ${
            status.includes('successfully') 
              ? ''
              : status.includes('Failed') || status.includes('error')
              ? 'bg-red-50 border border-red-200 text-red-800'
              : 'bg-blue-50 border border-blue-200 text-blue-800'
          }`}
          style={status.includes('successfully') ? { backgroundColor: '#e1ebd9', borderColor: '#c3d7b3', borderWidth: '1px', borderStyle: 'solid', color: '#455933' } : undefined}
        >
          {status}
        </div>
      )}

      {/* Member Info */}
      <Card className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{member.name}</h2>
            <p className="text-gray-600">{member.email}</p>
            <p className="text-sm text-gray-500">Member since: {member.registrationDate}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{member.assignedSkills.length}</div>
            <div className="text-sm text-gray-500">Assigned Skills</div>
          </div>
        </div>
      </Card>

      {/* Assigned Skills */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Your Assigned Skills</h2>
        
        {member.assignedSkills.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Skills Assigned Yet</h3>
              <p className="text-gray-600">
                An admin will assign skills to you soon. Check back later to start learning!
              </p>
            </div>
          </Card>
        ) : (
          member.assignedSkills.map((skill: any) => {
            const skillData = findSkillById(skill.skillId);
            return (
              <Card key={skill.skillId}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl">{skillData?.icon || '📚'}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{skill.skillName}</h3>
                      <p className="text-sm text-gray-600">{skillData?.category || 'Skill'}</p>
                      <p className="text-xs text-gray-500">Assigned: {skill.assignedDate}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(skill.status)}`} style={getStatusStyle(skill.status)}>
                      {skill.status}
                    </span>
                  </div>
                </div>

                {/* Progress Section */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm font-bold text-gray-900">{skill.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(skill.progress)}`}
                      style={{ width: `${skill.progress}%`, ...getProgressStyle(skill.progress) }}
                    />
                  </div>
                </div>

                {/* Progress Controls */}
                {skill.status !== 'completed' && skill.status !== 'mastered' && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Update Your Progress</h4>
                    <div className="flex items-center space-x-4">
                      <Button
                        onClick={() => updateProgress(skill.skillId, skill.progress + 10)}
                        disabled={isLoading || skill.progress >= 100}
                        size="sm"
                      >
                        +10%
                      </Button>
                      <Button
                        onClick={() => updateProgress(skill.skillId, skill.progress + 25)}
                        disabled={isLoading || skill.progress >= 100}
                        size="sm"
                      >
                        +25%
                      </Button>
                      <Button
                        onClick={() => updateProgress(skill.skillId, 100)}
                        disabled={isLoading || skill.progress >= 100}
                        size="sm"
                        style={{ backgroundColor: '#7EA25A' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6b8a4d'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7EA25A'}
                      >
                        Mark Complete
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Click buttons to update your learning progress
                    </p>
                  </div>
                )}

                {/* Skill Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Next Task</h4>
                    <p className="text-gray-600">{skill.nextTask}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Achievements</h4>
                    <p className="text-gray-600">
                      {skill.achievements.length > 0 
                        ? `${skill.achievements.length} achievement(s)` 
                        : 'No achievements yet'
                      }
                    </p>
                  </div>
                </div>

                {/* Achievements List */}
                {skill.achievements.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2">Your Achievements</h4>
                    <ul className="space-y-1">
                      {skill.achievements.map((achievement: string, index: number) => (
                        <li key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                          <span className="text-green-500">✓</span>
                          <span>{achievement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

    </div>
  );
}
