'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import Dashboard from '@/components/Dashboard';
import { getCurrentUser } from '@/lib/auth';

export default function AdminHomePage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.role === 'admin') {
      setUser(currentUser);
    }
  }, []);

  if (!user) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Dashboard user={user} />
    </AdminLayout>
  );
}

