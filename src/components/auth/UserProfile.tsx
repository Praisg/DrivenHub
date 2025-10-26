"use client";

import { User } from '@/lib/auth';
import { logout } from '@/lib/auth';
import { Button } from '@/components';
import { UserIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

interface UserProfileProps {
  user: User;
  onLogout: () => void;
}

export default function UserProfile({ user, onLogout }: UserProfileProps) {
  const handleLogout = () => {
    logout();
    onLogout();
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
          <span className="text-sm font-bold text-white">
            {user.avatar || user.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold driven-heading">{user.name}</p>
          <p className="text-xs driven-text-muted">{user.role}</p>
        </div>
      </div>
      <Button
        onClick={handleLogout}
        className="driven-btn-secondary text-sm"
      >
        <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
        Logout
      </Button>
    </div>
  );
}

