'use client';

import { useState } from 'react';
import { getRegisteredMembers } from '@/lib/data';
import { Card, Button } from '@/components';
import { useRouter } from 'next/navigation';

export default function MemberLogin() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Check if it's a member login
      const members = getRegisteredMembers();
      const foundMember = members.find(m => m.email.toLowerCase() === email.toLowerCase());
      
      if (foundMember) {
        // Member login - no password required for demo
        const memberUser = {
          id: foundMember.id,
          name: foundMember.name,
          email: foundMember.email,
          role: 'member'
        };
        
        // Store member session
        localStorage.setItem('driven-current-user', JSON.stringify(memberUser));
        router.push('/dashboard');
        return;
      }

      // No member found
      setError('No member found with this email address.');
      
    } catch (err) {
      setError('An error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Member Login</h1>
          <p className="text-gray-600">Access your learning dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Signing In...' : 'Sign In as Member'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Don&apos;t have an account? <a href="/register" className="text-blue-600 hover:text-blue-800">Register here</a>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            <a href="/" className="text-blue-600 hover:text-blue-800">Back to Home</a>
          </p>
        </div>
      </Card>
    </div>
  );
}