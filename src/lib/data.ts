/**
 * Data loading utilities for JSON files
 */
import { Announcement, Event, Resource, EmailMessage, SlackPost, Member, Skill, MemberSkills } from '@/types';

// Import JSON files directly
import announcementsData from '../../data/announcements.json';
import eventsData from '../../data/events.json';
import resourcesData from '../../data/resources.json';
import emailsData from '../../data/emails.json';
import slackData from '../../data/slack.json';
import membersData from '../../data/members.json';
import skillsData from '../../data/skills.json';
import memberSkillsData from '../../data/member-skills.json';
import membersDatabaseData from '../../data/members-database.json';

export function getAnnouncements(): Announcement[] {
  try {
    return announcementsData as Announcement[];
  } catch (error) {
    console.error('Error loading announcements:', error);
    return [];
  }
}

export function getEvents(): Event[] {
  try {
    return eventsData as Event[];
  } catch (error) {
    console.error('Error loading events:', error);
    return [];
  }
}

export function getResources(): Resource[] {
  try {
    return resourcesData as Resource[];
  } catch (error) {
    console.error('Error loading resources:', error);
    return [];
  }
}

export function getEmails(): EmailMessage[] {
  try {
    return (emailsData as EmailMessage[]) || [];
  } catch (error) {
    console.error('Error loading emails:', error);
    return [];
  }
}

export function getSlackPosts(): SlackPost[] {
  try {
    return (slackData as SlackPost[]) || [];
  } catch (error) {
    console.error('Error loading slack posts:', error);
    return [];
  }
}

export function getMembers(): Member[] {
  try {
    return (membersData as Member[]) || [];
  } catch (error) {
    console.error('Error loading members:', error);
    return [];
  }
}

export function getSkills(): Skill[] {
  try {
    // First try to get from localStorage (for created skills)
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('driven-skills');
      if (stored) {
        return JSON.parse(stored);
      }
    }
    // Fallback to static data
    return (skillsData as Skill[]) || [];
  } catch (error) {
    console.error('Error loading skills:', error);
    return [];
  }
}

export function saveSkills(skills: Skill[]): boolean {
  try {
    // Save to localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('driven-skills', JSON.stringify(skills));
      console.log('Saved skills to localStorage:', skills);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error saving skills:', error);
    return false;
  }
}

export function getMemberSkills(): MemberSkills[] {
  try {
    // First try to get from localStorage (for new assignments)
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('driven-member-skills');
      if (stored) {
        return JSON.parse(stored);
      }
    }
    // Fallback to static data
    return (memberSkillsData as MemberSkills[]) || [];
  } catch (error) {
    console.error('Error loading member skills:', error);
    return [];
  }
}

/**
 * Save data back to JSON files (development only)
 * Note: In production, this would need to be handled by an API route
 */
export function saveAnnouncements(announcements: Announcement[]): boolean {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('Saving data is only allowed in development mode');
    return false;
  }
  
  try {
    // In a real implementation, this would make an API call to save the data
    console.log('Saving announcements:', announcements);
    return true;
  } catch (error) {
    console.error('Error saving announcements:', error);
    return false;
  }
}

export function saveEvents(events: Event[]): boolean {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('Saving data is only allowed in development mode');
    return false;
  }
  
  try {
    // In a real implementation, this would make an API call to save the data
    console.log('Saving events:', events);
    return true;
  } catch (error) {
    console.error('Error saving events:', error);
    return false;
  }
}

export function saveResources(resources: Resource[]): boolean {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('Saving data is only allowed in development mode');
    return false;
  }
  
  try {
    // In a real implementation, this would make an API call to save the data
    console.log('Saving resources:', resources);
    return true;
  } catch (error) {
    console.error('Error saving resources:', error);
    return false;
  }
}

export function saveMemberSkills(memberSkills: MemberSkills[]): boolean {
  try {
    // Save to localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('driven-member-skills', JSON.stringify(memberSkills));
      console.log('Saved member skills to localStorage:', memberSkills);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error saving member skills:', error);
    return false;
  }
}

// New functions for member database
export function getRegisteredMembers(): any[] {
  try {
    // First try to get from localStorage (for new registrations)
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('driven-registered-members');
      if (stored) {
        return JSON.parse(stored);
      } else {
        // Initialize localStorage with demo data if empty
        localStorage.setItem('driven-registered-members', JSON.stringify(membersDatabaseData));
        return membersDatabaseData as any[];
      }
    }
    // Fallback to static data
    return membersDatabaseData as any[];
  } catch (error) {
    console.error('Error loading registered members:', error);
    return [];
  }
}

export function saveRegisteredMembers(members: any[]): boolean {
  try {
    // Save to localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('driven-registered-members', JSON.stringify(members));
      console.log('Saved registered members to localStorage:', members);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error saving registered members:', error);
    return false;
  }
}

export function addNewMember(member: any): boolean {
  try {
    const members = getRegisteredMembers();
    members.push(member);
    return saveRegisteredMembers(members);
  } catch (error) {
    console.error('Error adding new member:', error);
    return false;
  }
}

export function updateMemberSkills(memberId: string, skills: any[]): boolean {
  try {
    const memberSkillsData = getMemberSkills();
    const memberSkillsIndex = memberSkillsData.findIndex(ms => ms.memberId === memberId);
    
    if (memberSkillsIndex !== -1) {
      // Update existing member skills
      memberSkillsData[memberSkillsIndex].skills = skills;
    } else {
      // Create new member skills entry
      const members = getRegisteredMembers();
      const member = members.find(m => m.id === memberId);
      if (member) {
        memberSkillsData.push({
          memberId,
          memberName: member.name,
          skills
        });
      }
    }
    
    return saveMemberSkills(memberSkillsData);
  } catch (error) {
    console.error('Error updating member skills:', error);
    return false;
  }
}
