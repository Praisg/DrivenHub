'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MemberLogin from '@/components/auth/MemberLogin';

export default function MemberLoginPage() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem('driven-current-user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.role === 'admin') {
          // Admin logged in, redirect to admin dashboard
          router.push('/admin/dashboard');
          return;
        } else {
          // Member already logged in, redirect to member dashboard
          router.push('/dashboard');
          return;
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <MemberLogin />;
}