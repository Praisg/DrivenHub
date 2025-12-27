export interface Announcement {
  id: string;
  title: string;
  body: string;
  link?: string;
  dateISO: string;
}

export interface Event {
  id: string;
  googleEventId?: string;
  title: string;
  startISO: string;
  endISO: string;
  zoomUrl?: string;
  eventbriteUrl?: string;
  description: string;
  organizerEmail?: string;
  attendeesEmails?: string[]; // List of invited Gmail addresses
  location?: string;
}

export interface Resource {
  id: string;
  title: string;
  description?: string;
  url: string;
  thumbnail_url?: string;
  provider: string;
  created_at?: string;
  // Metadata / labels (do NOT control access)
  visibility_lab?: boolean;
  visibility_alumni?: boolean;
  cohorts?: number[];
  // For admin editing convenience – not stored directly on the row
  assigned_member_ids?: string[]; // IDs of members assigned to this resource
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
  cohort?: number;
  is_lab_member: boolean;
  is_alumni: boolean;
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
  what_it_develops?: string;
  why_it_matters?: string;
  how_it_works?: string;
  category: string;
  icon: string;
  color: string;
  level: 'Awareness' | 'Practice' | 'Embodiment' | 'Mastery' | 'Mentorship';
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
  // For display purposes
  contentCount?: number;
  progress?: number;
  completedCount?: number;
  totalCount?: number;
}

export interface SkillContentItem {
  id?: string;
  skillId: string;
  title: string;
  type: 'BOOK' | 'VIDEO' | 'ARTICLE' | 'LINK' | 'OTHER';
  url?: string;
  notes?: string;
  order?: number;
  display_order?: number;
  createdAt?: string;
  updatedAt?: string;
  // For file uploads
  file?: File;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  fileUrl?: string; // URL after upload
  // For member view
  isCompleted?: boolean;
}

export interface MemberSkill {
  skillId: string;
  skillName: string;
  level: string;
  assignedDate: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  progress: number;
  completedCount?: number;
  totalCount?: number;
  adminApproved?: boolean;
  adminNotes?: string;
}

export interface MemberSkills {
  memberId: string;
  memberName: string;
  skills: MemberSkill[];
}
