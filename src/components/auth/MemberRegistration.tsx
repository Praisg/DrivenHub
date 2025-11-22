'use client';

import { useState } from 'react';
import { Card, Button } from '@/components';
import { addNewMember } from '@/lib/data';

async function registerViaApi(name: string, email: string, password: string): Promise<any> {
  const res = await fetch('/api/members/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    const errorMessage = j.error || 'Registration failed';
    // Create error object instead of throwing immediately
    const error = new Error(errorMessage);
    // Add status code for handling
    (error as any).status = res.status;
    throw error;
  }
  
  return res.json();
}
import { useRouter } from 'next/navigation';

interface MemberRegistrationProps {
  onRegistrationComplete?: (member: { name: string; email: string }) => void;
}

export default function MemberRegistration({ onRegistrationComplete }: MemberRegistrationProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const router = useRouter();

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim() || !password) {
      setStatus('Please fill in all fields.');
      setTimeout(() => setStatus(''), 3000);
      return;
    }

    if (password.length < 6) {
      setStatus('Password must be at least 6 characters long.');
      setTimeout(() => setStatus(''), 3000);
      return;
    }

    if (password !== confirmPassword) {
      setStatus('Passwords do not match.');
      setTimeout(() => setStatus(''), 3000);
      return;
    }

    setIsLoading(true);
    setStatus('Registering...');

    try {
      // Save to Supabase via API
      await registerViaApi(name.trim(), email.trim(), password);
      
      setIsRegistered(true);
      setStatus('Registration successful! Redirecting to member sign-in...');
      onRegistrationComplete?.({ name: name.trim(), email: email.trim() });

      // Clear any existing session before redirecting to login
      localStorage.removeItem('driven-current-user');

      // Redirect to member login after successful registration
      setTimeout(() => {
        router.push('/member/login');
      }, 1500);

    } catch (error: any) {
      // Handle error gracefully without throwing to Next.js error boundary
      const errorMessage = error?.message || 'Registration failed. Please try again.';
      
      // Provide user-friendly message for duplicate email
      if (error?.status === 409 || errorMessage.includes('already exists')) {
        setStatus('An account with this email already exists. Please log in instead.');
        setTimeout(() => {
          router.push('/member/login');
        }, 3000);
      } else {
        setStatus(errorMessage);
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatus(''), 5000);
    }
  };

  if (isRegistered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome!</h1>
            <p className="text-gray-600 mb-4">
              You've successfully registered for Driven to Wellness Lab.
            </p>
            <p className="text-sm text-gray-500">
              You'll be redirected to the login options shortly.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Join Driven to Wellness Lab</h1>
          <p className="text-gray-600">Register to start your learning journey</p>
        </div>

        <form onSubmit={handleRegistration} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your full name"
              required
            />
          </div>

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

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter password (min. 6 characters)"
              required
              minLength={6}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Confirm your password"
              required
              minLength={6}
            />
          </div>

          {status && (
            <div className={`p-3 rounded-lg ${
              status.includes('successful') 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : status.includes('failed') || status.includes('Please fill')
                ? 'bg-red-50 border border-red-200 text-red-800'
                : 'bg-blue-50 border border-blue-200 text-blue-800'
            }`}>
              {status}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Registering...' : 'Register'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Already registered? <a href="/" className="text-blue-600 hover:text-blue-800">Go to Home</a>
          </p>
        </div>
      </Card>
    </div>
  );
}
