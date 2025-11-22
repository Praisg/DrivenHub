'use client';

import { useState, useEffect } from 'react';
import { getAnnouncements, getEvents, getEmails, getMembers, getRegisteredMembers } from '@/lib/data';
import { getSkillsFromDB, getMemberSkillsFromDB } from '@/lib/db-data';
import { sortEventsByDate, isUpcoming } from '@/lib/time';
import { Card, Button, MemberDirectory } from '@/components';
import { CalendarIcon, UserGroupIcon, PaperAirplaneIcon, BriefcaseIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import SkillsWallet from '@/components/SkillsWallet';
import LevelBasedSkillAssignment from '@/components/admin/LevelBasedSkillAssignment';
import SkillManagement from '@/components/admin/SkillManagement';

interface DashboardProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'member';
  };
}

export default function Dashboard({ user }: DashboardProps) {
  const announcements = getAnnouncements();
  const events = getEvents();
  const emails = getEmails();
  const members = getMembers();
  const upcomingEvents = sortEventsByDate(events).filter(event => isUpcoming(event.startISO));
  
  const [activeSection, setActiveSection] = useState<'home' | 'skills'>('home');
  const [activeAdminTab, setActiveAdminTab] = useState<'skills-wallet' | 'assign-skills' | 'manage-skills'>('skills-wallet');
  const [isSlackModalOpen, setIsSlackModalOpen] = useState(false);
  const [skills, setSkills] = useState<any[]>([]);
  const [memberSkills, setMemberSkills] = useState<any[]>([]);
  const [registeredMembers, setRegisteredMembers] = useState(getRegisteredMembers());

  // Load skills and member skills from database
  useEffect(() => {
    const loadData = async () => {
      try {
        const [skillsData, memberSkillsData] = await Promise.all([
          getSkillsFromDB(),
          getMemberSkillsFromDB(user.id),
        ]);
        setSkills(skillsData);
        setMemberSkills(memberSkillsData);
        setRegisteredMembers(getRegisteredMembers());
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadData();

    // Refresh every 5 seconds to catch new assignments
    const interval = setInterval(loadData, 5000);

    return () => clearInterval(interval);
  }, [user.id]);


  const refreshMemberSkills = async () => {
    try {
      const [skillsData, memberSkillsData] = await Promise.all([
        getSkillsFromDB(),
        getMemberSkillsFromDB(user.id),
      ]);
      setSkills(skillsData);
      setMemberSkills(memberSkillsData);
      setRegisteredMembers(getRegisteredMembers());
    } catch (error) {
      console.error('Error refreshing skills:', error);
    }
  };

  const SlackRedirect = () => {
    useEffect(() => {
      window.open('https://app.slack.com/client/T06GCESFL82/C09CQ8PU86B', '_blank');
    }, []);
    return null;
  };

  return (
    <div className="min-h-screen bg-white">

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeSection === 'home' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Sidebar - Quick Actions */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Button 
                      onClick={() => setIsSlackModalOpen(true)}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <PaperAirplaneIcon className="w-5 h-5 mr-2" />
                      Join Slack
                    </Button>
                    <Button href={user.role === 'admin' ? '/admin/home' : '/member/coaching'} className="w-full justify-start">
                      <BriefcaseIcon className="w-5 h-5 mr-2" />
                      Book Coaching
                    </Button>
                  </div>
                </Card>

                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Community Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Active Members</span>
                      <span className="text-sm font-medium">{registeredMembers.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Upcoming Events</span>
                      <span className="text-sm font-medium">{upcomingEvents.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Announcements</span>
                      <span className="text-sm font-medium">{announcements.length}</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              <div className="space-y-8">
                {/* Slack Community - Prominent Section */}
                <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                        <PaperAirplaneIcon className="w-8 h-8 text-purple-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">Join Our Slack Community</h2>
                        <p className="text-gray-600">Connect with members, get help, and stay updated</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => {
                        setIsSlackModalOpen(true);
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3"
                    >
                      Go to Slack
                    </Button>
                  </div>
                </Card>

                {/* Quick Links */}
                <Card>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Links</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user.role === 'member' && (
                      <Button href="/member/skills" className="w-full justify-start h-auto py-4" variant="outline">
                        <BriefcaseIcon className="w-6 h-6 mr-3" />
                        <div className="text-left">
                          <div className="font-semibold">Skills Wallet</div>
                          <div className="text-sm text-gray-600">Manage your skills</div>
                        </div>
                      </Button>
                    )}
                    <Button href={user.role === 'admin' ? '/admin/events' : '/member/events'} className="w-full justify-start h-auto py-4" variant="outline">
                      <CalendarIcon className="w-6 h-6 mr-3" />
                      <div className="text-left">
                        <div className="font-semibold">Events</div>
                        <div className="text-sm text-gray-600">View upcoming events</div>
                      </div>
                    </Button>
                    <Button href={user.role === 'admin' ? '/admin/home' : '/member/coaching'} className="w-full justify-start h-auto py-4" variant="outline">
                      <AcademicCapIcon className="w-6 h-6 mr-3" />
                      <div className="text-left">
                        <div className="font-semibold">Book Coaching</div>
                        <div className="text-sm text-gray-600">Schedule a session</div>
                      </div>
                    </Button>
                    <Button href={user.role === 'admin' ? '/admin/home' : '/member/resources'} className="w-full justify-start h-auto py-4" variant="outline">
                      <span className="text-2xl mr-3">📚</span>
                      <div className="text-left">
                        <div className="font-semibold">Resources</div>
                        <div className="text-sm text-gray-600">Learning materials</div>
                      </div>
                    </Button>
                    <Button href={user.role === 'admin' ? '/admin/surveys' : '/member/surveys'} className="w-full justify-start h-auto py-4" variant="outline">
                      <span className="text-2xl mr-3">📊</span>
                      <div className="text-left">
                        <div className="font-semibold">Surveys</div>
                        <div className="text-sm text-gray-600">Share your feedback</div>
                      </div>
                    </Button>
                  </div>
                </Card>

                {/* Announcements */}
                <Card>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Latest Announcements</h2>
                  <div className="space-y-4">
                    {announcements.slice(0, 3).map((announcement) => (
                      <div key={announcement.id} className="border-l-4 border-blue-500 pl-4">
                        <h3 className="font-medium text-gray-900">{announcement.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{announcement.body}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(announcement.dateISO).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Upcoming Events */}
                <Card>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Events</h2>
                  <div className="space-y-4">
                    {upcomingEvents.slice(0, 3).map((event) => (
                      <div key={event.id} className="flex items-center space-x-4">
                        <CalendarIcon className="w-6 h-6 text-blue-500" />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{event.title}</h3>
                          <p className="text-sm text-gray-600">{event.description}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(event.startISO).toLocaleDateString()} at {new Date(event.startISO).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

              </div>
            </div>
          </div>
        )}

        {activeSection === 'skills' && (
          <div className="space-y-6">
            {user.role === 'member' ? (
              // Member Skills View
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Skills</h2>
                <SkillsWallet 
                  skills={skills} 
                  memberSkills={memberSkills} 
                  members={registeredMembers}
                  isAdmin={false}
                  currentUserId={user.id}
                  onRefresh={refreshMemberSkills}
                />
              </div>
            ) : (
              // Admin Skills Management - Full Admin Panel
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Skills Panel</h2>
                  <p className="text-gray-600">Manage skills, assign to members, and track progress</p>
                </div>

                {/* Admin Navigation Tabs */}
                <div className="border-b border-gray-200 mb-6">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setActiveAdminTab('skills-wallet')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeAdminTab === 'skills-wallet'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Skills Wallet
                    </button>
                    <button
                      onClick={() => setActiveAdminTab('assign-skills')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeAdminTab === 'assign-skills'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Assign Skills
                    </button>
                    <button
                      onClick={() => setActiveAdminTab('manage-skills')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeAdminTab === 'manage-skills'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Manage Skills
                    </button>
                  </nav>
                </div>

                {/* Admin Content */}
                {activeAdminTab === 'skills-wallet' && (
                  <SkillsWallet 
                    skills={skills} 
                    memberSkills={memberSkills} 
                    members={registeredMembers}
                    isAdmin={true}
                    currentUserId={user.id}
                    onRefresh={refreshMemberSkills}
                  />
                )}

                {activeAdminTab === 'assign-skills' && (
                  <LevelBasedSkillAssignment 
                    onAssignmentComplete={() => {
                      window.location.reload();
                    }}
                  />
                )}

                {activeAdminTab === 'manage-skills' && (
                  <SkillManagement 
                    onUpdate={() => {
                      window.location.reload();
                    }}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Slack Modal */}
      {isSlackModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Join Our Slack Community</h3>
            <p className="text-gray-600 mb-4">
              Connect with other members, get support, and stay updated on community activities.
            </p>
            <div className="flex space-x-3">
              <Button onClick={() => setIsSlackModalOpen(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={() => {
                setIsSlackModalOpen(false);
                window.open('https://app.slack.com/client/T06GCESFL82/C09CQ8PU86B', '_blank');
              }}>
                Open Slack
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
