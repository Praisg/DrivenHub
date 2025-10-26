"use client";

import { useState, useEffect } from 'react';
import { getSkills, getMemberSkills } from '@/lib/data';
import { getCurrentUser, login, logout } from '@/lib/auth';
import { User } from '@/lib/auth';
import { Button } from '@/components';
import { UserIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import LoginForm from '@/components/auth/LoginForm';
import UserProfile from '@/components/auth/UserProfile';
import PersonalSkillsWallet from '@/components/skills/PersonalSkillsWallet';

export default function SkillsWalletPage() {
  const skills = getSkills();
  const memberSkills = getMemberSkills();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const user = getCurrentUser();
    setCurrentUser(user);
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setShowLogin(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleShowLogin = () => {
    setShowLogin(true);
  };

  const handleCancelLogin = () => {
    setShowLogin(false);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="driven-header">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold driven-header">DRIVEN Skills Wallet</h1>
                <p className="text-lg mt-2 driven-header">Track your professional development journey</p>
              </div>
              <Button
                onClick={handleShowLogin}
                className="driven-btn-primary"
              >
                <UserIcon className="h-5 w-5 mr-2" />
                Sign In
              </Button>
            </div>
          </div>
        </div>

        {/* Login Prompt */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="driven-card text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <UserIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold driven-heading mb-4">Sign In to Access Your Skills Wallet</h2>
            <p className="driven-text-muted mb-8 max-w-2xl mx-auto">
              Track your professional development journey, complete skill milestones, and build your portfolio. 
              Sign in to see your personalized learning path and achievements.
            </p>
            <Button
              onClick={handleShowLogin}
              className="driven-btn-primary"
            >
              <UserIcon className="h-5 w-5 mr-2" />
              Sign In to Continue
            </Button>
          </div>

          {/* Skills Preview */}
          <div className="driven-card mt-8">
            <h3 className="text-xl font-semibold driven-heading mb-6">Available Skills</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {skills.slice(0, 6).map((skill) => (
                <div key={skill.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-2xl">{skill.icon}</span>
                    <div>
                      <h4 className="font-semibold driven-heading">{skill.name}</h4>
                      <p className="text-sm driven-text-muted">{skill.category}</p>
                    </div>
                  </div>
                  <p className="text-sm driven-text-muted mb-4">{skill.description}</p>
                  <span className={`px-2 py-1 text-xs rounded-full bg-${skill.color}-100 text-${skill.color}-800`}>
                    {skill.category}
                  </span>
                </div>
              ))}
            </div>
            <div className="text-center mt-6">
              <p className="text-sm driven-text-muted">
                Sign in to see all {skills.length} available skills and start your learning journey
              </p>
            </div>
          </div>
        </div>

        {/* Login Modal */}
        {showLogin && (
          <LoginForm
            onLogin={handleLogin}
            onCancel={handleCancelLogin}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header with User Profile */}
      <div className="driven-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold driven-header">My Skills Wallet</h1>
              <p className="text-lg mt-2 driven-header">Track your professional development journey</p>
            </div>
            <UserProfile user={currentUser} onLogout={handleLogout} />
          </div>
        </div>
      </div>

      {/* Personalized Skills Wallet */}
      <PersonalSkillsWallet
        skills={skills}
        memberSkills={memberSkills}
        currentUserId={currentUser.id}
      />
    </div>
  );
}

