'use client';

import { useEffect, useState } from 'react';
import MemberLayout from '@/components/layouts/MemberLayout';
import MemberSkillsView from '@/components/member/MemberSkillsView';
import { getCurrentUser } from '@/lib/auth';

export default function MemberSkillsPage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.role === 'member') {
      setUser(currentUser);
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <MemberLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </MemberLayout>
    );
  }

  if (!user) {
    return (
      <MemberLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Please log in to view your skills.</p>
          </div>
        </div>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Skills Wallet</h2>
          <p className="text-gray-600">Track your learning progress and skill development</p>
        </div>

        <MemberSkillsView userId={user.id} />
      </div>
    </MemberLayout>
  );
}

