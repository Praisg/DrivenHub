'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import SkillCreation from '@/components/admin/SkillCreation';
import SkillManagement from '@/components/admin/SkillManagement';
import MemberSkillsManagement from '@/components/admin/MemberSkillsManagement';
import { getCurrentUser } from '@/lib/auth';

export default function AdminSkillsWalletPage() {
  const [activeTab, setActiveTab] = useState<'create-skills' | 'manage-skills' | 'member-skills'>('create-skills');

  return (
    <AdminLayout>
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
              onClick={() => setActiveTab('manage-skills')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'manage-skills'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Manage Skills
            </button>
            <button
              onClick={() => setActiveTab('member-skills')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'member-skills'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Member Skills
            </button>
          </nav>
        </div>

        {/* Admin Content */}
        {activeTab === 'create-skills' && (
          <SkillCreation 
            onSkillCreated={() => {
              // Refresh will be handled by SkillManagement if needed
            }}
          />
        )}

        {activeTab === 'manage-skills' && (
          <SkillManagement 
            onUpdate={() => {
              // Skills list will refresh automatically
            }}
          />
        )}

        {activeTab === 'member-skills' && (
          <MemberSkillsManagement 
            onUpdate={() => {
              // Member skills will refresh automatically
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}

