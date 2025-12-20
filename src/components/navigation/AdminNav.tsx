'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  HomeIcon, 
  CalendarIcon, 
  BriefcaseIcon, 
  UserGroupIcon,
  MegaphoneIcon,
  AcademicCapIcon,
  UsersIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { 
  HomeIcon as HomeIconSolid, 
  CalendarIcon as CalendarIconSolid, 
  BriefcaseIcon as BriefcaseIconSolid, 
  UserGroupIcon as UserGroupIconSolid,
  MegaphoneIcon as MegaphoneIconSolid,
  AcademicCapIcon as AcademicCapIconSolid,
  UsersIcon as UsersIconSolid,
  DocumentTextIcon as DocumentTextIconSolid
} from '@heroicons/react/24/solid';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconSolid: React.ComponentType<{ className?: string }>;
}

const navigation: NavItem[] = [
  { name: 'Home', href: '/admin/home', icon: HomeIcon, iconSolid: HomeIconSolid },
  { name: 'Announcements', href: '/admin/announcements', icon: MegaphoneIcon, iconSolid: MegaphoneIconSolid },
  { name: 'Resources', href: '/admin/resources', icon: DocumentTextIcon, iconSolid: DocumentTextIconSolid },
  { name: 'Events', href: '/admin/events', icon: CalendarIcon, iconSolid: CalendarIconSolid },
  { name: 'Coaching', href: '/admin/coaching', icon: AcademicCapIcon, iconSolid: AcademicCapIconSolid },
  { name: 'Skills Wallet', href: '/admin/skills-wallet', icon: BriefcaseIcon, iconSolid: BriefcaseIconSolid },
  { name: 'Members', href: '/admin/members', icon: UsersIcon, iconSolid: UsersIconSolid },
  { name: 'Assignments', href: '/admin/assignments', icon: UserGroupIcon, iconSolid: UserGroupIconSolid },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            const Icon = isActive ? item.iconSolid : item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

