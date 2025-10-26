"use client";

import { useState } from 'react';
import { login, getAllUsers } from '@/lib/auth';
import { Button } from '@/components';
import { UserIcon, LockClosedIcon } from '@heroicons/react/24/outline';

interface LoginFormProps {
  onLogin: (user: any) => void;
  onCancel: () => void;
}

export default function LoginForm({ onLogin, onCancel }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const users = getAllUsers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const user = login(email, password);
    if (user) {
      onLogin(user);
    } else {
      setError('Invalid email or password. Try "password" for demo.');
    }
    setIsLoading(false);
  };

  const handleQuickLogin = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('password');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserIcon className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold driven-heading">Sign In</h2>
            <p className="text-sm driven-text-muted mt-2">Access your Skills Wallet</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium driven-text mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="driven-input w-full"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium driven-text mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="driven-input w-full"
                placeholder="Enter password"
                required
              />
              <p className="text-xs driven-text-muted mt-1">
                Demo password: <strong>password</strong>
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                {error}
              </div>
            )}

            <div className="flex space-x-3">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 driven-btn-primary"
              >
                <LockClosedIcon className="h-4 w-4 mr-2" />
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
              <Button
                type="button"
                onClick={onCancel}
                className="driven-btn-secondary"
              >
                Cancel
              </Button>
            </div>
          </form>

          {/* Quick Login Options */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm driven-text-muted mb-3 text-center">Quick Demo Login:</p>
            <div className="space-y-2">
              {users.slice(0, 3).map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleQuickLogin(user.email)}
                  className="w-full text-left p-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-gray-600">
                        {user.avatar}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium driven-heading">{user.name}</p>
                      <p className="text-xs driven-text-muted">{user.email}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

