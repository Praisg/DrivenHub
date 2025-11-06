'use client';

import { useState } from 'react';
import { Card, Button } from '@/components';
import { addNewMember } from '@/lib/data';
import { useRouter } from 'next/navigation';

interface MemberRegistrationProps {
  onRegistrationComplete?: (member: { name: string; email: string }) => void;
}

export default function MemberRegistration({ onRegistrationComplete }: MemberRegistrationProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const router = useRouter();

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim()) {
      setStatus('Please fill in all fields.');
      setTimeout(() => setStatus(''), 3000);
      return;
    }

    setIsLoading(true);
    setStatus('Registering...');

    try {
      // Generate unique ID
      const memberId = `member-${Date.now()}`;
      const registrationDate = new Date().toISOString().split('T')[0];

      // Create new member data
      const newMember = {
        id: memberId,
        name: name.trim(),
        email: email.trim(),
        registrationDate,
        status: 'active',
        assignedSkills: []
      };

      // Save to database
      const success = addNewMember(newMember);
      
      if (!success) {
        throw new Error('Failed to save member to database');
      }
      
      console.log('New member registration:', newMember);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      setIsRegistered(true);
      setStatus('Registration successful! Redirecting to member sign-in...');
      onRegistrationComplete?.(newMember);

      // Redirect to member login after successful registration
      setTimeout(() => {
        router.push('/member/login');
      }, 1500);

    } catch (error) {
      console.error('Registration error:', error);
      setStatus('Registration failed. Please try again.');
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
              You've successfully registered for the skills program.
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Join Skills Program</h1>
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
