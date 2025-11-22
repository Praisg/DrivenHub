/**
 * Database-backed data loading utilities
 * These functions fetch from Supabase instead of JSON files
 */

import { Skill, MemberSkills } from '@/types';

/**
 * Fetch skills from database via API
 */
export async function getSkillsFromDB(): Promise<Skill[]> {
  try {
    const response = await fetch('/api/skills');
    if (!response.ok) {
      throw new Error('Failed to fetch skills from database');
    }
    const data = await response.json();
    return data.skills || [];
  } catch (error) {
    console.error('Error fetching skills from database:', error);
    return [];
  }
}

/**
 * Fetch member skills from database via API
 */
export async function getMemberSkillsFromDB(memberId?: string): Promise<MemberSkills[]> {
  try {
    const url = memberId ? `/api/member-skills?memberId=${memberId}` : '/api/member-skills';
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch member skills from database');
    }
    const data = await response.json();
    return data.memberSkills || [];
  } catch (error) {
    console.error('Error fetching member skills from database:', error);
    return [];
  }
}

/**
 * Create or update a skill in the database
 */
export async function saveSkillToDB(skill: Skill): Promise<boolean> {
  try {
    const response = await fetch('/api/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(skill),
    });
    return response.ok;
  } catch (error) {
    console.error('Error saving skill to database:', error);
    return false;
  }
}

