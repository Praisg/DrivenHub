import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles: ('admin' | 'member')[];
  redirectTo?: string;
}

export default function RouteGuard({ children, allowedRoles, redirectTo = '/' }: RouteGuardProps) {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem('driven-current-user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        
        // Check if user has required role
        if (!allowedRoles.includes(userData.role)) {
          // Redirect unauthorized users
          router.push(redirectTo);
          return;
        }
      } else {
        // No user logged in, redirect to login
        router.push(redirectTo);
        return;
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, [allowedRoles, redirectTo, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}

