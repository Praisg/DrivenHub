"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MemberDashboard from '@/components/member/MemberDashboard';

export default function DashboardPage() {
  const router = useRouter();
  const [memberId, setMemberId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('driven-current-user');
      if (!stored) {
        router.replace('/member/login');
        return;
      }
      const user = JSON.parse(stored);
      if (user.role === 'admin') {
        router.replace('/admin/home');
        return;
      }
      // Redirect members to new member home
      router.replace('/member/home');
      return;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!memberId) {
    return null; // redirected
  }

  return <MemberDashboard memberId={memberId} />;
}


