'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import AdminNav from '@/components/navigation/AdminNav';
import { Button } from '@/components';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
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

      if (currentUser.role !== 'admin') {
        // Member trying to access admin routes, redirect to member home
        router.replace('/member/home');
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
              <h1 className="text-2xl font-semibold driven-header">
                DRIVEN Community Institute: Where personal energy fuels collective impact
              </h1>
              <p className="text-base font-medium driven-header opacity-90">
                Communication Hub
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-300 capitalize">Admin</span>
              <Button onClick={handleLogout} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <AdminNav />

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  );
}

