"use client";

import { useState, useEffect } from 'react';
import { Skill, MemberSkills, MemberSkill } from '@/types';
import { Button } from '@/components';
import { CheckCircleIcon, ClockIcon, AcademicCapIcon, TrophyIcon, StarIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface PersonalSkillsWalletProps {
  skills: Skill[];
  memberSkills: MemberSkills[];
  currentUserId: string;
}

export default function PersonalSkillsWallet({ skills, memberSkills, currentUserId }: PersonalSkillsWalletProps) {
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [userSkills, setUserSkills] = useState<MemberSkill[]>([]);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [showLeadershipDropdown, setShowLeadershipDropdown] = useState(false);

  useEffect(() => {
    // Find current user's skills
    const userData = memberSkills.find(member => member.memberId === currentUserId);
    const userSkillsData = userData?.skills || [];
    setUserSkills(userSkillsData);

    // Find skills not yet assigned to user
    const assignedSkillIds = userSkillsData.map(skill => skill.skillId);
    const availableSkillsData = skills.filter(skill => !assignedSkillIds.includes(skill.id));
    setAvailableSkills(availableSkillsData);
  }, [skills, memberSkills, currentUserId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showLeadershipDropdown) {
        setShowLeadershipDropdown(false);
      }
    };

    if (showLeadershipDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLeadershipDropdown]);

  const handleCompleteMilestone = (skillId: string, milestoneId: string) => {
    // In a real app, this would make an API call
    console.log(`Completing milestone ${milestoneId} for skill ${skillId}`);
    
    // Update local state for demo
    setUserSkills(prevSkills => 
      prevSkills.map(skill => {
        if (skill.skillId === skillId) {
          const updatedMilestones = [...(skill.completedMilestones || [])];
          if (!updatedMilestones.includes(milestoneId)) {
            updatedMilestones.push(milestoneId);
          }
          
          const newProgress = Math.min(100, skill.progress + 25);
          const newStatus = newProgress === 100 ? 'completed' : 'learning';
          
          // Add achievement for completed milestone
          const skillData = getSkillById(skillId);
          const milestoneData = skillData?.learningPath?.find(m => m.id === milestoneId);
          const newAchievements = [...(skill.achievements || [])];
          if (milestoneData && !newAchievements.includes(`Completed: ${milestoneData.title}`)) {
            newAchievements.push(`Completed: ${milestoneData.title}`);
          }
          
          return {
            ...skill,
            progress: newProgress,
            status: newStatus,
            completedMilestones: updatedMilestones,
            achievements: newAchievements,
            completionDate: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : undefined
          };
        }
        return skill;
      })
    );
  };

  const handleQuickProgress = (skillId: string) => {
    // Simple progress: 0% → 25% → 50% → 75% → 100%
    const skill = userSkills.find(s => s.skillId === skillId);
    if (skill && skill.status === 'learning') {
      let newProgress = skill.progress + 25;
      if (newProgress > 100) newProgress = 100;
      
      const newStatus = newProgress === 100 ? 'completed' : 'learning';
      
      setUserSkills(prevSkills => 
        prevSkills.map(s => {
          if (s.skillId === skillId) {
            return {
              ...s,
              progress: newProgress,
              status: newStatus,
              completionDate: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : undefined
            };
          }
          return s;
        })
      );
    }
  };

  const handlePointSelection = (skillId: string, pointIndex: number) => {
    // Each point represents 25% progress (0, 25, 50, 75, 100)
    const newProgress = pointIndex * 25;
    const newStatus = newProgress === 100 ? 'completed' : 'learning';
    
    console.log(`Updating skill ${skillId} to ${newProgress}% progress`);
    
    setUserSkills(prevSkills => 
      prevSkills.map(s => {
        if (s.skillId === skillId) {
          console.log(`Progress updated: ${s.progress}% → ${newProgress}%`);
          return {
            ...s,
            progress: newProgress,
            status: newStatus,
            completionDate: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : undefined
          };
        }
        return s;
      })
    );
  };

  const handleAssignSkill = (skillId: string) => {
    // In a real app, this would make an API call
    console.log(`Assigning skill ${skillId} to user ${currentUserId}`);
    
    const skill = skills.find(s => s.id === skillId);
    if (skill) {
      const newUserSkill: MemberSkill = {
        skillId: skill.id,
        skillName: skill.name,
        level: skill.level,
        assignedDate: new Date().toISOString().split('T')[0],
        status: 'learning',
        progress: 0,
        currentMilestone: 'milestone-1',
        completedMilestones: [],
        milestoneProgress: {
          'milestone-1': { completed: false, progress: 0 },
          'milestone-2': { completed: false, progress: 0 },
          'milestone-3': { completed: false, progress: 0 },
          'milestone-4': { completed: false, progress: 0 }
        },
        nextTask: skill.learningPath?.[0]?.tasks?.[0] || 'Start learning this skill',
        achievements: [],
        adminApproved: false
      };
      
      setUserSkills(prev => [...prev, newUserSkill]);
      setAvailableSkills(prev => prev.filter(s => s.id !== skillId));
    }
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

  const getSkillById = (skillId: string) => {
    return skills.find(skill => skill.id === skillId);
  };

  const totalSkills = skills.length;
  const completedSkills = userSkills.filter(skill => skill.status === 'completed' || skill.status === 'mastered').length;
  const inProgressSkills = userSkills.filter(skill => skill.status === 'learning').length;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="driven-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold driven-header">My Skills Wallet</h1>
              <p className="text-lg mt-2 driven-header">Track your professional development journey</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="driven-card text-center">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold driven-heading">{completedSkills}</h3>
            <p className="driven-text-muted">Completed Skills</p>
          </div>
          <div className="driven-card text-center">
            <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClockIcon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold driven-heading">{inProgressSkills}</h3>
            <p className="driven-text-muted">In Progress</p>
          </div>
          <div className="driven-card text-center">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrophyIcon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold driven-heading">{totalSkills}</h3>
            <p className="driven-text-muted">Available Skills</p>
          </div>
        </div>

        {/* My Skills */}
        {userSkills.length > 0 && (
          <div className="driven-card mb-8">
            <h2 className="text-2xl font-semibold driven-heading mb-6">My Skills</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userSkills.map((userSkill) => {
                const skillData = getSkillById(userSkill.skillId);
                if (!skillData) return null;

                return (
                  <div key={userSkill.skillId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="text-2xl">{skillData.icon}</span>
                      <div>
                        <h3 className="font-semibold driven-heading">{userSkill.skillName}</h3>
                        <p className="text-xs driven-text-muted">{skillData.category}</p>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold driven-heading">Progress</span>
                        <span className="text-xs driven-text-muted">{userSkill.progress}%</span>
                      </div>
                      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${getProgressColor(userSkill.progress)}`}
                          style={{ width: `${userSkill.progress}%` }}
                        />
                      </div>
                      {userSkill.skillName === 'Leadership' && (
                        <div className="text-xs driven-text-muted mt-1">
                          Current: {userSkill.progress}% | Status: {userSkill.status}
                        </div>
                      )}
                    </div>

                    {/* Status and Action */}
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(userSkill.status)}`}>
                        {userSkill.status}
                      </span>
                      {userSkill.status === 'learning' && (
                        <div className="flex space-x-1">
                          <Button
                            onClick={() => handleQuickProgress(userSkill.skillId)}
                            className="driven-btn-primary text-xs"
                          >
                            Progress
                          </Button>
                          {userSkill.skillName === 'Leadership' && (
                            <div className="relative">
                              <Button
                                onClick={() => setShowLeadershipDropdown(!showLeadershipDropdown)}
                                className="driven-btn-secondary text-xs flex items-center"
                              >
                                Points
                                {showLeadershipDropdown ? (
                                  <ChevronUpIcon className="h-3 w-3 ml-1" />
                                ) : (
                                  <ChevronDownIcon className="h-3 w-3 ml-1" />
                                )}
                              </Button>
                              
                              {showLeadershipDropdown && (
                                <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                  <div className="p-2">
                                    <div className="text-xs font-semibold driven-heading mb-2">Leadership Points</div>
                                    <div className="space-y-1">
                                      <button
                                        onClick={() => {
                                          console.log('Clicking Point 1 - Setting progress to 0%');
                                          handlePointSelection(userSkill.skillId, 0);
                                          setShowLeadershipDropdown(false);
                                        }}
                                        className={`w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-50 ${
                                          userSkill.progress === 0 ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                        }`}
                                      >
                                        Point 1: Self-Awareness (0%)
                                      </button>
                                      <button
                                        onClick={() => {
                                          console.log('Clicking Point 2 - Setting progress to 25%');
                                          handlePointSelection(userSkill.skillId, 1);
                                          setShowLeadershipDropdown(false);
                                        }}
                                        className={`w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-50 ${
                                          userSkill.progress === 25 ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                        }`}
                                      >
                                        Point 2: Communication (25%)
                                      </button>
                                      <button
                                        onClick={() => {
                                          handlePointSelection(userSkill.skillId, 2);
                                          setShowLeadershipDropdown(false);
                                        }}
                                        className={`w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-50 ${
                                          userSkill.progress === 50 ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                        }`}
                                      >
                                        Point 3: Team Building (50%)
                                      </button>
                                      <button
                                        onClick={() => {
                                          handlePointSelection(userSkill.skillId, 3);
                                          setShowLeadershipDropdown(false);
                                        }}
                                        className={`w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-50 ${
                                          userSkill.progress === 75 ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                        }`}
                                      >
                                        Point 4: Decision Making (75%)
                                      </button>
                                      <button
                                        onClick={() => {
                                          handlePointSelection(userSkill.skillId, 4);
                                          setShowLeadershipDropdown(false);
                                        }}
                                        className={`w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-50 ${
                                          userSkill.progress === 100 ? 'bg-green-50 text-green-700' : 'text-gray-700'
                                        }`}
                                      >
                                        Complete: Leadership Mastery (100%)
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Available Skills */}
        <div className="driven-card">
          <h2 className="text-2xl font-semibold driven-heading mb-6">Available Skills</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableSkills.map((skill) => (
              <div key={skill.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-2xl">{skill.icon}</span>
                  <div>
                    <h3 className="font-semibold driven-heading">{skill.name}</h3>
                    <p className="text-xs driven-text-muted">{skill.category}</p>
                  </div>
                </div>
                
                {/* Simple Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold driven-heading">Progress</span>
                    <span className="text-xs driven-text-muted">0%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-300 rounded-full transition-all duration-500" style={{ width: '0%' }} />
                  </div>
                </div>

                <div className="text-center">
                  <Button
                    onClick={() => handleAssignSkill(skill.id)}
                    className="driven-btn-primary text-sm w-full"
                  >
                    <AcademicCapIcon className="h-4 w-4 mr-2" />
                    Start Learning
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {availableSkills.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrophyIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold driven-heading mb-2">All Skills Assigned!</h3>
              <p className="driven-text-muted">You've started learning all available skills. Keep up the great work!</p>
            </div>
          )}
        </div>

        {/* Empty State */}
        {userSkills.length === 0 && (
          <div className="driven-card text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AcademicCapIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold driven-heading mb-2">No Skills Assigned Yet</h3>
            <p className="driven-text-muted mb-6">
              Start your learning journey by selecting skills from the available options below.
            </p>
            {availableSkills.length > 0 && (
              <Button
                onClick={() => document.getElementById('available-skills')?.scrollIntoView({ behavior: 'smooth' })}
                className="driven-btn-primary"
              >
                Browse Available Skills
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
