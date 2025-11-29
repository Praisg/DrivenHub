'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import MemberNav from '@/components/navigation/MemberNav';
import { Button } from '@/components';

interface MemberLayoutProps {
  children: React.ReactNode;
}

export default function MemberLayout({ children }: MemberLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const currentUser = getCurrentUser();
      
      if (!currentUser) {
        // Not logged in, redirect to landing page
        router.replace('/');
        return;
      }

      if (currentUser.role === 'admin') {
        // Admin trying to access member routes, redirect to admin home
        router.replace('/admin/home');
        return;
      }

      if (currentUser.role !== 'member') {
        // Invalid role, redirect to landing
        router.replace('/');
        return;
      }

      setUser(currentUser);
      setIsLoading(false);
    };

    checkAuth();
  }, [router, pathname]);

  const handleLogout = () => {
    localStorage.removeItem('driven-current-user');
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="driven-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold driven-header">
                DRIVEN Community Institute:
              </h1>
              <h2 className="text-xl font-semibold driven-header">
                Where Personal Energy Fuels Collective Impact
              </h2>
              <p className="text-base font-medium driven-header opacity-90">
                Communication Hub
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm" style={{ color: '#FCFAF6', opacity: 0.9 }}>
                {user.name 
                  ? `Member · ${user.name}` 
                  : user.email 
                  ? `Member · ${user.email}` 
                  : 'Member'}
              </span>
              <Button onClick={handleLogout} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <MemberNav />

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  );
}

