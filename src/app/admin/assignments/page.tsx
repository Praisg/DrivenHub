'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import LevelBasedSkillAssignment from '@/components/admin/LevelBasedSkillAssignment';
import { getRegisteredMembers } from '@/lib/data';
import { getMemberSkillsFromDB } from '@/lib/db-data';

export default function AdminAssignmentsPage() {
  const [memberSkills, setMemberSkills] = useState<any[]>([]);
  const [registeredMembers, setRegisteredMembers] = useState(getRegisteredMembers());

  useEffect(() => {
    const loadData = async () => {
      try {
        const memberSkillsData = await getMemberSkillsFromDB();
        setMemberSkills(memberSkillsData);
        setRegisteredMembers(getRegisteredMembers());
      } catch (error) {
        console.error('Error loading member skills:', error);
      }
    };

    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const refreshMemberSkills = async () => {
    try {
      const memberSkillsData = await getMemberSkillsFromDB();
      setMemberSkills(memberSkillsData);
      setRegisteredMembers(getRegisteredMembers());
    } catch (error) {
      console.error('Error refreshing member skills:', error);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Skill Assignments</h2>
          <p className="text-gray-600">Assign skills to members and track their progress</p>
        </div>

        <LevelBasedSkillAssignment 
          onAssignmentComplete={() => {
            refreshMemberSkills();
          }}
        />
      </div>
    </AdminLayout>
  );
}

