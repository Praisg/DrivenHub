'use client';

import { useState, useEffect } from 'react';
import { Button, Card } from '@/components';
import { Member, Skill, MemberSkill } from '@/types';
import { CheckCircleIcon, XCircleIcon, ChatBubbleLeftIcon, TrashIcon } from '@heroicons/react/24/outline';

interface MemberSkillsManagementProps {
  onUpdate?: () => void;
}

export default function MemberSkillsManagement({ onUpdate }: MemberSkillsManagementProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [memberSkills, setMemberSkills] = useState<any[]>([]);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  // Pre-populate comment textareas with existing comments
  useEffect(() => {
    if (memberSkills.length === 0) return;
    
    const initialComments: { [key: string]: string } = {};
    memberSkills.forEach((ms: any) => {
      ms.skills?.forEach((memberSkill: any) => {
        const key = `${ms.memberId}-${memberSkill.skillId}`;
        if (memberSkill.adminNotes) {
          initialComments[key] = memberSkill.adminNotes;
        }
      });
    });
    if (Object.keys(initialComments).length > 0) {
      setCommentText((prev) => ({ ...prev, ...initialComments }));
    }
  }, [memberSkills]);

  const loadData = async () => {
    try {
      const [membersRes, skillsRes, memberSkillsRes] = await Promise.all([
        fetch('/api/admin/members'),
        fetch('/api/admin/skills'),
        fetch('/api/member-skills'),
      ]);

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData.members || []);
      }

      if (skillsRes.ok) {
        const skillsData = await skillsRes.json();
        setSkills(skillsData.skills || []);
      }

      if (memberSkillsRes.ok) {
        const memberSkillsData = await memberSkillsRes.json();
        setMemberSkills(memberSkillsData.memberSkills || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMemberSkills = (memberId: string) => {
    return memberSkills.find(ms => ms.memberId === memberId)?.skills || [];
  };

  const getSkillDetails = (skillId: string) => {
    return skills.find(s => s.id === skillId);
  };

  const handleReject = async (memberId: string, skillId: string) => {
    try {
      const response = await fetch(`/api/admin/member-skills/${memberId}/${skillId}/reject`, {
        method: 'POST',
      });
      if (response.ok) {
        await loadData();
        onUpdate?.();
      }
    } catch (error) {
      console.error('Error rejecting member skill:', error);
    }
  };

  const handleDelete = async (memberId: string, skillId: string) => {
    if (!confirm('Are you sure you want to remove this skill assignment from this member?')) {
      return;
    }
    try {
      const response = await fetch(`/api/admin/member-skills/${memberId}/${skillId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await loadData();
        onUpdate?.();
      }
    } catch (error) {
      console.error('Error deleting member skill:', error);
    }
  };

  const handleMarkComplete = async (memberId: string, skillId: string) => {
    try {
      const response = await fetch(`/api/admin/member-skills/${memberId}/${skillId}/complete`, {
        method: 'POST',
      });
      if (response.ok) {
        await loadData();
        onUpdate?.();
      }
    } catch (error) {
      console.error('Error marking skill as complete:', error);
    }
  };

  const handleAddComment = async (memberId: string, skillId: string) => {
    const comment = commentText[`${memberId}-${skillId}`] || '';
    if (!comment.trim()) {
      alert('Please enter a comment');
      return;
    }

    try {
      const response = await fetch(`/api/admin/member-skills/${memberId}/${skillId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment }),
      });
      if (response.ok) {
        await loadData();
        onUpdate?.();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to save comment. Please try again.');
    }
  };

  const handleUpdateComment = async (memberId: string, skillId: string) => {
    const comment = commentText[`${memberId}-${skillId}`] || '';
    if (!comment.trim()) {
      alert('Please enter a comment');
      return;
    }

    try {
      const response = await fetch(`/api/admin/member-skills/${memberId}/${skillId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment }),
      });
      if (response.ok) {
        await loadData();
        onUpdate?.();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update comment');
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('Failed to update comment. Please try again.');
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading member skills...</div>;
  }

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Member Skills Management</h3>
      <p className="text-gray-600 mb-6">View and manage skills assigned to members, track progress, and provide feedback</p>
      
      {members.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500">No members found.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {members.map((member) => {
            const assignedSkills = getMemberSkills(member.id);
            const isExpanded = expandedMember === member.id;

            return (
              <Card key={member.id} className="overflow-hidden">
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedMember(isExpanded ? null : member.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-lg">{member.name}</h4>
                      <p className="text-sm text-gray-600">{member.email}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {assignedSkills.length} skill{assignedSkills.length !== 1 ? 's' : ''} assigned
                      </p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {isExpanded ? '▼' : '▶'}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    {assignedSkills.length === 0 ? (
                      <p className="text-sm text-gray-500">No skills assigned to this member.</p>
                    ) : (
                      <div className="space-y-4">
                        {assignedSkills.map((memberSkill: any) => {
                          const skill = getSkillDetails(memberSkill.skillId);
                          const commentKey = `${member.id}-${memberSkill.skillId}`;

                          return (
                            <div key={memberSkill.skillId} className="bg-white rounded-lg p-4 border border-gray-200">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <h5 className="font-semibold text-gray-900">{skill?.name || memberSkill.skillName}</h5>
                                  <p className="text-sm text-gray-600 mt-1">{skill?.description || 'No description'}</p>
                                  <div className="mt-2">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                                        <div
                                          className={`h-2 rounded-full transition-all ${
                                            memberSkill.status === 'COMPLETED'
                                              ? 'bg-green-600'
                                              : memberSkill.adminApproved === false
                                              ? 'bg-red-600'
                                              : 'bg-blue-600'
                                          }`}
                                          style={{ width: `${memberSkill.progress || 0}%` }}
                                        />
                                      </div>
                                      <span className={`text-sm font-medium ${
                                        memberSkill.status === 'COMPLETED'
                                          ? 'text-green-700'
                                          : memberSkill.adminApproved === false
                                          ? 'text-red-700'
                                          : 'text-gray-700'
                                      }`}>
                                        {memberSkill.progress || 0}%
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                      Status: <span className={`font-medium capitalize ${
                                        memberSkill.status === 'COMPLETED' 
                                          ? 'text-green-700' 
                                          : memberSkill.adminApproved === false
                                          ? 'text-red-700'
                                          : 'text-gray-700'
                                      }`}>
                                        {memberSkill.status === 'COMPLETED' 
                                          ? '✓ Completed' 
                                          : memberSkill.adminApproved === false
                                          ? '✗ Rejected'
                                          : memberSkill.status === 'IN_PROGRESS'
                                          ? 'In Progress'
                                          : 'Not Started'}
                                      </span>
                                    </p>
                                    {memberSkill.adminNotes && (
                                      <p className="text-xs text-gray-600 mt-1 italic">
                                        Comment: {memberSkill.adminNotes}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col space-y-1 ml-4">
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReject(member.id, memberSkill.skillId);
                                    }}
                                    variant="outline"
                                    size="sm"
                                    className="text-yellow-600 hover:text-yellow-700 text-xs"
                                  >
                                    <XCircleIcon className="w-4 h-4 mr-1" />
                                    Reject
                                  </Button>
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarkComplete(member.id, memberSkill.skillId);
                                    }}
                                    variant="outline"
                                    size="sm"
                                    className="text-blue-600 hover:text-blue-700 text-xs"
                                  >
                                    <CheckCircleIcon className="w-4 h-4 mr-1" />
                                    Complete
                                  </Button>
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(member.id, memberSkill.skillId);
                                    }}
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 text-xs"
                                  >
                                    <TrashIcon className="w-4 h-4 mr-1" />
                                    Remove
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Comment Section */}
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="flex items-start space-x-2">
                                  <ChatBubbleLeftIcon className="w-5 h-5 text-gray-400 mt-1" />
                                  <div className="flex-1">
                                    {memberSkill.adminNotes && (
                                      <p className="text-xs text-gray-600 mb-2 italic">Current comment: {memberSkill.adminNotes}</p>
                                    )}
                                    <textarea
                                      value={commentText[commentKey] || memberSkill.adminNotes || ''}
                                      onChange={(e) => setCommentText({ ...commentText, [commentKey]: e.target.value })}
                                      placeholder={memberSkill.adminNotes ? "Edit comment..." : "Add a comment or feedback..."}
                                      rows={2}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (memberSkill.adminNotes) {
                                          handleUpdateComment(member.id, memberSkill.skillId);
                                        } else {
                                          handleAddComment(member.id, memberSkill.skillId);
                                        }
                                      }}
                                      variant="outline"
                                      size="sm"
                                      className="mt-2 text-xs"
                                    >
                                      {memberSkill.adminNotes ? 'Update Comment' : 'Add Comment'}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

