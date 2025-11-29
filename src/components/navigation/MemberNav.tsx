'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  HomeIcon, 
  CalendarIcon, 
  AcademicCapIcon, 
  DocumentTextIcon, 
  ClipboardDocumentListIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';
import { 
  HomeIcon as HomeIconSolid, 
  CalendarIcon as CalendarIconSolid, 
  AcademicCapIcon as AcademicCapIconSolid, 
  DocumentTextIcon as DocumentTextIconSolid, 
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
  BriefcaseIcon as BriefcaseIconSolid
} from '@heroicons/react/24/solid';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconSolid: React.ComponentType<{ className?: string }>;
}

const navigation: NavItem[] = [
  { name: 'Home', href: '/member/home', icon: HomeIcon, iconSolid: HomeIconSolid },
  { name: 'Skills Wallet', href: '/member/skills', icon: BriefcaseIcon, iconSolid: BriefcaseIconSolid },
  { name: 'Events', href: '/member/events', icon: CalendarIcon, iconSolid: CalendarIconSolid },
  { name: 'Coaching', href: '/member/coaching', icon: AcademicCapIcon, iconSolid: AcademicCapIconSolid },
  { name: 'Resources', href: '/member/resources', icon: DocumentTextIcon, iconSolid: DocumentTextIconSolid },
];

export default function MemberNav() {
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

