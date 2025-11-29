"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components';
import { getCurrentUser } from '@/lib/auth';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const user = getCurrentUser();
    if (user) {
      // Redirect based on role
      if (user.role === 'admin') {
        router.replace('/admin/home');
      } else {
        router.replace('/member/home');
      }
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="driven-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold driven-header">LAB Member Hub</h1>
              <p className="text-lg mt-2 driven-header">Connect, grow, and support each other</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button href="/admin/login" variant="outline" className="mr-2">
                Admin Login
              </Button>
              <Button href="/register" variant="outline" className="mr-2">
                Register
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to LAB Member Hub</h2>
          <p className="text-xl text-gray-600 mb-8">Choose how you&apos;d like to access the platform</p>
        </div>

        <div className="max-w-md mx-auto">
          {/* Member Login Card */}
          <Card className="text-center p-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">👤</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Member Access</h3>
            <p className="text-gray-600 mb-6">
              Access your learning dashboard, track your skills progress, and connect with the community.
            </p>
            <div className="space-y-3">
              <Button href="/member/login" className="w-full">
                Sign In as Member
              </Button>
              <Button href="/register" variant="outline" className="w-full">
                Register as Member
              </Button>
            </div>
          </Card>
        </div>

        {/* Features Section */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Platform Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#e1ebd9' }}>
                <span className="text-xl">📚</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Skill Tracking</h4>
              <p className="text-sm text-gray-600">Track your learning progress and skill development</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">👥</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Community</h4>
              <p className="text-sm text-gray-600">Connect with other members and share experiences</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">📊</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Progress Analytics</h4>
              <p className="text-sm text-gray-600">Monitor your growth and achievements</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}