'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getRegisteredMembers, getSkills, getMemberSkills } from '@/lib/data';
import { Button } from '@/components';
import SkillsWallet from '@/components/SkillsWallet';
import LevelBasedSkillAssignment from '@/components/admin/LevelBasedSkillAssignment';
import SkillManagement from '@/components/admin/SkillManagement';
import SkillCreation from '@/components/admin/SkillCreation';
import RouteGuard from '@/components/auth/RouteGuard';

export default function AdminDashboardPage() {
  const [user, setUser] = useState<{id: string; name: string; role: string} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'skills-wallet' | 'assign-skills' | 'manage-skills' | 'create-skills'>('create-skills');
  const router = useRouter();

  const [skills, setSkills] = useState(getSkills());
  const [memberSkills, setMemberSkills] = useState(getMemberSkills());
  const [registeredMembers, setRegisteredMembers] = useState(getRegisteredMembers());

  // Refresh member skills data periodically
  useEffect(() => {
    const refreshData = () => {
      const latestSkills = getSkills();
      const latestMemberSkills = getMemberSkills();
      const latestRegisteredMembers = getRegisteredMembers();
      setSkills(latestSkills);
      setMemberSkills(latestMemberSkills);
      setRegisteredMembers(latestRegisteredMembers);
    };

    // Refresh immediately
    refreshData();

    // Refresh every 3 seconds to catch new assignments
    const interval = setInterval(refreshData, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem('driven-current-user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.role === 'admin') {
          setUser(userData);
        } else {
          router.push('/dashboard');
        }
      } else {
        router.push('/admin/login');
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('driven-current-user');
    window.location.href = '/admin/login';
  };

  const refreshMemberSkills = () => {
    const latestMemberSkills = getMemberSkills();
    const latestRegisteredMembers = getRegisteredMembers();
    setMemberSkills(latestMemberSkills);
    setRegisteredMembers(latestRegisteredMembers);
    // Force re-render by updating skills state
    setSkills(getSkills());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <RouteGuard allowedRoles={['admin']} redirectTo="/">
      <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="driven-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold driven-header">Admin Dashboard</h1>
              <p className="text-lg mt-2 driven-header">Welcome back, {user.name}!</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 capitalize">{user.role}</span>
              <Button onClick={handleLogout} variant="outline">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Skills Management</h2>
          <p className="text-gray-600">Manage skills, assign to members, and track progress</p>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('create-skills')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'create-skills'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Create Skills
            </button>
            <button
              onClick={() => setActiveTab('skills-wallet')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'skills-wallet'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Skills Wallet
            </button>
            <button
              onClick={() => setActiveTab('assign-skills')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'assign-skills'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Assign Skills
            </button>
            <button
              onClick={() => setActiveTab('manage-skills')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'manage-skills'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Manage Skills
            </button>
          </nav>
        </div>

        {/* Admin Content */}
        {activeTab === 'create-skills' && (
          <SkillCreation 
            onSkillCreated={() => {
              refreshMemberSkills();
            }}
          />
        )}

        {activeTab === 'skills-wallet' && (
          <SkillsWallet 
            skills={skills} 
            memberSkills={memberSkills} 
            members={registeredMembers}
            isAdmin={true}
            currentUserId={user.id}
            onRefresh={refreshMemberSkills}
          />
        )}

        {activeTab === 'assign-skills' && (
          <LevelBasedSkillAssignment 
            onAssignmentComplete={() => {
              refreshMemberSkills();
            }}
          />
        )}

        {activeTab === 'manage-skills' && (
          <SkillManagement 
            onUpdate={() => {
              refreshMemberSkills();
            }}
          />
        )}
      </div>
    </div>
    </RouteGuard>
  );
}
