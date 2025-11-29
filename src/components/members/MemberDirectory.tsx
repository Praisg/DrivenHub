"use client";

import { useState } from 'react';
import Card from '../Card';
import Button from '../Button';

interface Member {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  status: 'online' | 'away' | 'offline';
}

interface MemberDirectoryProps {
  members: Member[];
}

export default function MemberDirectory({ members }: MemberDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartDM = (member: Member) => {
    // TODO: Implement DM functionality
    console.log('Start DM with:', member.name);
    // For now, just show an alert
    alert(`Starting DM with ${member.name}`);
  };

  return (
    <Card className="driven-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#e1ebd9' }}>
            <span className="text-sm font-semibold" style={{ color: '#7EA25A' }}>👥</span>
          </div>
          <h3 className="text-xl font-semibold driven-heading">Members</h3>
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#7EA25A' }}></div>
          <span className="text-sm driven-text-muted">{members.length} online</span>
        </div>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="driven-input"
        />
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {filteredMembers.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm"
            onClick={() => handleStartDM(member)}
          >
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-sm font-semibold text-gray-600">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div 
                  className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                    member.status === 'online' ? '' :
                    member.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                  }`}
                  style={member.status === 'online' ? { backgroundColor: '#7EA25A' } : undefined}
                />
              </div>
              <div>
                <p className="text-sm font-semibold driven-heading">{member.name}</p>
                <p className="text-xs driven-text-muted">{member.role}</p>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs driven-btn-secondary"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e1ebd9';
                e.currentTarget.style.borderColor = '#c3d7b3';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '';
                e.currentTarget.style.borderColor = '';
              }}
            >
              DM
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}