export interface Announcement {
  id: string;
  title: string;
  body: string;
  link?: string;
  dateISO: string;
}

export interface Event {
  id: string;
  title: string;
  startISO: string;
  endISO: string;
  zoomUrl?: string;
  eventbriteUrl?: string;
  description: string;
}

export interface Resource {
  id: string;
  kind: 'video' | 'podcast' | 'doc';
  title: string;
  description: string;
  url: string;
  provider: string;
}

export interface EmailCapture {
  email: string;
  timestamp: string;
}

export interface EmailMessage {
  id: string;
  from: string;
  subject: string;
  preview: string;
  dateISO: string;
}

export interface SlackPost {
  id: string;
  channel: string;
  author: string;
  body: string;
  dateISO: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  avatar?: string;
  status: 'online' | 'away' | 'offline';
  assignedSkills?: MemberSkill[];
}

export interface SkillContent {
  id: string;
  title: string;
  type: 'book' | 'video' | 'article' | 'course' | 'document';
  url?: string;
  description: string;
  duration?: string;
  uploadedAt: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  level: 'primary' | 'secondary' | 'tertiary';
  parentId?: string;
  subtopics?: Skill[]; // Sub-skills under this skill
  content?: SkillContent[]; // Learning materials
  createdAt: string;
  createdBy: string;
}

export interface MemberSkill {
  skillId: string;
  skillName: string;
  level: string;
  assignedDate: string;
  status: 'assigned' | 'learning' | 'completed' | 'mastered' | 'approved' | 'rejected' | 'on-hold';
  progress: number;
  currentMilestone: string;
  completedMilestones: string[];
  milestoneProgress: {
    [milestoneId: string]: {
      completed: boolean;
      progress: number;
      completionDate?: string;
    };
  };
  nextTask: string;
  achievements: string[];
  completionDate?: string;
  adminApproved: boolean;
  adminNotes?: string;
}

export interface MemberSkills {
  memberId: string;
  memberName: string;
  skills: MemberSkill[];
}
