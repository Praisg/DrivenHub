'use client';

import { useState, useEffect } from 'react';
import { getAnnouncements, getEvents, getResources, getMembers, getSkills, getMemberSkills, saveAnnouncements, saveEvents, saveResources, getRegisteredMembers } from '@/lib/data';
import { Card, Button, SkillsWallet } from '@/components';
import LevelBasedSkillAssignment from '@/components/admin/LevelBasedSkillAssignment';
import SkillManagement from '@/components/admin/SkillManagement';
import AdminGuard from '@/components/auth/AdminGuard';
import { getCurrentUser, logout } from '@/lib/auth';
import { Announcement, Event, Resource } from '@/types';

export default function AdminPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [activeTab, setActiveTab] = useState<'announcements' | 'events' | 'resources' | 'skills' | 'skill-assignment' | 'skill-management'>('announcements');
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    // Load data on component mount
    setAnnouncements(getAnnouncements());
    setEvents(getEvents());
    setResources(getResources());
  }, []);

  const handleSave = (type: 'announcements' | 'events' | 'resources') => {
    let success = false;
    
    switch (type) {
      case 'announcements':
        success = saveAnnouncements(announcements);
        break;
      case 'events':
        success = saveEvents(events);
        break;
      case 'resources':
        success = saveResources(resources);
        break;
    }

    if (success) {
      setStatus(`${type} saved successfully!`);
      setTimeout(() => setStatus(''), 3000);
    } else {
      setStatus(`Failed to save ${type}. Check console for errors.`);
      setTimeout(() => setStatus(''), 5000);
    }
  };

  const updateAnnouncements = (value: string) => {
    try {
      const parsed = JSON.parse(value);
      setAnnouncements(parsed);
    } catch (error) {
      console.error('Invalid JSON:', error);
    }
  };

  const updateEvents = (value: string) => {
    try {
      const parsed = JSON.parse(value);
      setEvents(parsed);
    } catch (error) {
      console.error('Invalid JSON:', error);
    }
  };

  const updateResources = (value: string) => {
    try {
      const parsed = JSON.parse(value);
      setResources(parsed);
    } catch (error) {
      console.error('Invalid JSON:', error);
    }
  };

  const skills = getSkills();
  const memberSkills = getMemberSkills();
  const members = getMembers();
  const registeredMembers = getRegisteredMembers();

  const tabs = [
    { id: 'announcements', label: 'Announcements', count: announcements.length },
    { id: 'events', label: 'Events', count: events.length },
    { id: 'resources', label: 'Resources', count: resources.length },
    { id: 'skills', label: 'Skills Wallet', count: skills.length },
    { id: 'skill-assignment', label: 'Assign Skills', count: 0 },
    { id: 'skill-management', label: 'Manage Skills', count: 0 },
  ] as const;

  return (
    <AdminGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Welcome, {getCurrentUser()?.name}
            </span>
            <Button 
              onClick={() => {
                logout();
                window.location.href = '/admin/login';
              }}
              variant="outline"
              size="sm"
            >
              Logout
            </Button>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 font-medium">
            ⚠️ This is a prototype admin panel. Changes are saved to localStorage in production.
          </p>
        </div>
      </div>

      {/* Status Message */}
      {status && (
        <div className={`mb-6 p-4 rounded-lg ${
          status.includes('successfully') 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {status}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'announcements' && (
          <Card>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Announcements</h3>
              <p className="text-sm text-gray-600 mb-4">
                Edit the announcements JSON. Each announcement should have: id, title, body, link (optional), dateISO
              </p>
            </div>
            <textarea
              value={JSON.stringify(announcements, null, 2)}
              onChange={(e) => updateAnnouncements(e.target.value)}
              className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm"
              placeholder="Enter JSON data..."
            />
            <div className="mt-4">
              <Button onClick={() => handleSave('announcements')}>
                Save Announcements
              </Button>
            </div>
          </Card>
        )}

        {activeTab === 'events' && (
          <Card>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Events</h3>
              <p className="text-sm text-gray-600 mb-4">
                Edit the events JSON. Each event should have: id, title, startISO, endISO, zoomUrl (optional), eventbriteUrl (optional), description
              </p>
            </div>
            <textarea
              value={JSON.stringify(events, null, 2)}
              onChange={(e) => updateEvents(e.target.value)}
              className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm"
              placeholder="Enter JSON data..."
            />
            <div className="mt-4">
              <Button onClick={() => handleSave('events')}>
                Save Events
              </Button>
            </div>
          </Card>
        )}

        {activeTab === 'resources' && (
          <Card>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Resources</h3>
              <p className="text-sm text-gray-600 mb-4">
                Edit the resources JSON. Each resource should have: id, kind (&quot;video&quot;|&quot;podcast&quot;|&quot;doc&quot;), title, description, url, provider
              </p>
            </div>
            <textarea
              value={JSON.stringify(resources, null, 2)}
              onChange={(e) => updateResources(e.target.value)}
              className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm"
              placeholder="Enter JSON data..."
            />
            <div className="mt-4">
              <Button onClick={() => handleSave('resources')}>
                Save Resources
              </Button>
            </div>
          </Card>
        )}

        {activeTab === 'skills' && (
          <div>
            <SkillsWallet 
              skills={skills} 
              memberSkills={memberSkills} 
              members={registeredMembers}
              isAdmin={true}
              currentUserId={getCurrentUser()?.id}
            />
          </div>
        )}

        {activeTab === 'skill-assignment' && (
          <LevelBasedSkillAssignment 
            onAssignmentComplete={() => {
              // Refresh the skills wallet data after assignment
              window.location.reload();
            }}
          />
        )}

        {activeTab === 'skill-management' && (
          <SkillManagement 
            onUpdate={() => {
              // Refresh the skills wallet data after management
              window.location.reload();
            }}
          />
        )}
      </div>

      {/* Help Section */}
      <div className="mt-12 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Admin Help</h3>
        <div className="space-y-2 text-gray-600 text-sm">
          <p>• <strong>JSON Format:</strong> Make sure your JSON is valid before saving</p>
          <p>• <strong>Development Only:</strong> File saving only works in development mode</p>
          <p>• <strong>Backup:</strong> Always backup your data before making changes</p>
          <p>• <strong>Validation:</strong> Check the browser console for any errors</p>
        </div>
      </div>
      </div>
    </AdminGuard>
  );
}
