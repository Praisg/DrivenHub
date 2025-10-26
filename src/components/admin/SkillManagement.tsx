import { useState, useEffect } from 'react';
import { Button } from '@/components';
import { getMemberSkills, updateMemberSkills, getRegisteredMembers } from '@/lib/data';
import { MemberSkills, Member } from '@/types';

interface SkillManagementProps {
  onUpdate?: () => void;
}

export default function SkillManagement({ onUpdate }: SkillManagementProps) {
  const [memberSkills, setMemberSkills] = useState<MemberSkills[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const skillsData = getMemberSkills();
    const membersData = getRegisteredMembers();
    setMemberSkills(skillsData);
    setMembers(membersData);
  };

  const handleApproveSkill = async (memberId: string, skillId: string) => {
    setIsLoading(true);
    setStatus('Approving skill...');

    try {
      const updatedSkills = memberSkills.map(memberSkill => {
        if (memberSkill.memberId === memberId) {
          return {
            ...memberSkill,
            skills: memberSkill.skills.map(skill => 
              skill.skillId === skillId 
                ? { ...skill, adminApproved: true, status: 'approved' as const }
                : skill
            )
          };
        }
        return memberSkill;
      });

      const success = updateMemberSkills(memberId, updatedSkills.find(ms => ms.memberId === memberId)?.skills || []);
      
      if (success) {
        setMemberSkills(updatedSkills);
        setStatus('Skill approved successfully!');
        onUpdate?.();
      } else {
        setStatus('Failed to approve skill. Please try again.');
      }
    } catch (error) {
      console.error('Error approving skill:', error);
      setStatus('An error occurred while approving the skill.');
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatus(''), 3000);
    }
  };

  const handleRejectSkill = async (memberId: string, skillId: string) => {
    setIsLoading(true);
    setStatus('Rejecting skill...');

    try {
      const updatedSkills = memberSkills.map(memberSkill => {
        if (memberSkill.memberId === memberId) {
          return {
            ...memberSkill,
            skills: memberSkill.skills.map(skill => 
              skill.skillId === skillId 
                ? { ...skill, adminApproved: false, status: 'rejected' as const }
                : skill
            )
          };
        }
        return memberSkill;
      });

      const success = updateMemberSkills(memberId, updatedSkills.find(ms => ms.memberId === memberId)?.skills || []);
      
      if (success) {
        setMemberSkills(updatedSkills);
        setStatus('Skill rejected successfully!');
        onUpdate?.();
      } else {
        setStatus('Failed to reject skill. Please try again.');
      }
    } catch (error) {
      console.error('Error rejecting skill:', error);
      setStatus('An error occurred while rejecting the skill.');
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatus(''), 3000);
    }
  };

  const handleRemoveSkill = async (memberId: string, skillId: string) => {
    if (!confirm('Are you sure you want to remove this skill assignment?')) {
      return;
    }

    setIsLoading(true);
    setStatus('Removing skill...');

    try {
      const updatedSkills = memberSkills.map(memberSkill => {
        if (memberSkill.memberId === memberId) {
          return {
            ...memberSkill,
            skills: memberSkill.skills.filter(skill => skill.skillId !== skillId)
          };
        }
        return memberSkill;
      });

      const success = updateMemberSkills(memberId, updatedSkills.find(ms => ms.memberId === memberId)?.skills || []);
      
      if (success) {
        setMemberSkills(updatedSkills);
        setStatus('Skill removed successfully!');
        onUpdate?.();
      } else {
        setStatus('Failed to remove skill. Please try again.');
      }
    } catch (error) {
      console.error('Error removing skill:', error);
      setStatus('An error occurred while removing the skill.');
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatus(''), 3000);
    }
  };

  const handlePutOnHold = async (memberId: string, skillId: string) => {
    setIsLoading(true);
    setStatus('Putting skill on hold...');

    try {
      const updatedSkills = memberSkills.map(memberSkill => {
        if (memberSkill.memberId === memberId) {
          return {
            ...memberSkill,
            skills: memberSkill.skills.map(skill => 
              skill.skillId === skillId 
                ? { ...skill, status: 'on-hold' as const }
                : skill
            )
          };
        }
        return memberSkill;
      });

      const success = updateMemberSkills(memberId, updatedSkills.find(ms => ms.memberId === memberId)?.skills || []);
      
      if (success) {
        setMemberSkills(updatedSkills);
        setStatus('Skill put on hold successfully!');
        onUpdate?.();
      } else {
        setStatus('Failed to put skill on hold. Please try again.');
      }
    } catch (error) {
      console.error('Error putting skill on hold:', error);
      setStatus('An error occurred while putting the skill on hold.');
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatus(''), 3000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-gray-100 text-gray-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredMemberSkills = searchQuery 
    ? memberSkills.filter(ms => 
        ms.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ms.memberId.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : memberSkills;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Skill Management</h2>
        <Button onClick={loadData} variant="outline" disabled={isLoading}>
          Refresh Data
        </Button>
      </div>

      {status && (
        <div className={`p-4 rounded-lg ${status.includes('successfully') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {status}
        </div>
      )}

      {/* Member Search */}
      <div className="bg-white p-4 rounded-lg border">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Members
        </label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Type member name to search..."
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {searchQuery && (
          <p className="text-sm text-gray-500 mt-2">
            Showing {filteredMemberSkills.length} member{filteredMemberSkills.length !== 1 ? 's' : ''} matching &quot;{searchQuery}&quot;
          </p>
        )}
      </div>

      {/* Skills List */}
      <div className="space-y-4">
        {filteredMemberSkills.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No skill assignments found.
          </div>
        ) : (
          filteredMemberSkills.map(memberSkill => (
            <div key={memberSkill.memberId} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg text-gray-900">
                  {memberSkill.memberName}
                </h3>
                <span className="text-sm text-gray-500">
                  {memberSkill.skills.length} skill{memberSkill.skills.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-3">
                {memberSkill.skills.map(skill => (
                  <div key={skill.skillId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-medium text-gray-900">{skill.skillName}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(skill.status)}`}>
                          {skill.status}
                        </span>
                        {skill.adminApproved && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Approved
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        Progress: {skill.progress}% | Level: {skill.level} | Assigned: {new Date(skill.assignedDate).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {!skill.adminApproved && skill.status !== 'rejected' && (
                        <Button
                          onClick={() => handleApproveSkill(memberSkill.memberId, skill.skillId)}
                          size="sm"
                          variant="outline"
                          disabled={isLoading}
                        >
                          Approve
                        </Button>
                      )}
                      
                      {skill.status !== 'rejected' && (
                        <Button
                          onClick={() => handleRejectSkill(memberSkill.memberId, skill.skillId)}
                          size="sm"
                          variant="outline"
                          disabled={isLoading}
                        >
                          Reject
                        </Button>
                      )}

                      {skill.status !== 'on-hold' && (
                        <Button
                          onClick={() => handlePutOnHold(memberSkill.memberId, skill.skillId)}
                          size="sm"
                          variant="outline"
                          disabled={isLoading}
                        >
                          Hold
                        </Button>
                      )}

                      <Button
                        onClick={() => handleRemoveSkill(memberSkill.memberId, skill.skillId)}
                        size="sm"
                        variant="outline"
                        disabled={isLoading}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}