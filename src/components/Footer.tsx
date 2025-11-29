'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';

export default function Footer() {
  const [coachingHref, setCoachingHref] = useState('/member/coaching');

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      if (user.role === 'admin') {
        setCoachingHref('/admin/coaching');
      } else {
        setCoachingHref('/member/coaching');
      }
    } else {
      setCoachingHref('/member/coaching');
    }
  }, []);

  return (
    <footer className="text-white" style={{ backgroundColor: '#7EA25A' }}>
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">DRIVEN Community Hub</h3>
            <p className="mb-4" style={{ color: '#FCFAF6' }}>
              Connect, grow, and support each other in our virtual space for lifelong learners.
            </p>
            <div className="flex space-x-4">
              <Link
                href="https://www.drivenpros.com"
                className="hover:text-white transition-colors"
                style={{ color: '#FCFAF6' }}
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit DRIVEN Professionals
              </Link>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/events" className="hover:text-white transition-colors" style={{ color: '#FCFAF6' }}>
                  Upcoming Events
                </Link>
              </li>
              <li>
                <Link href="/resources" className="hover:text-white transition-colors" style={{ color: '#FCFAF6' }}>
                  Resources
                </Link>
              </li>
              <li>
                <Link href={coachingHref} className="hover:text-white transition-colors" style={{ color: '#FCFAF6' }}>
                  Book Coaching
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Community</h4>
            <p className="mb-4" style={{ color: '#FCFAF6' }}>
              Join our community of professionals committed to personal and professional growth.
            </p>
            <div className="rounded-lg p-4" style={{ backgroundColor: '#587240' }}>
              <p className="text-sm font-medium mb-2">Ready to get started?</p>
              <Link 
                href={coachingHref}
                className="bg-white px-4 py-2 rounded-lg font-semibold transition-colors inline-block hover:bg-[#e1ebd9]"
                style={{ color: '#7EA25A' }}
              >
                Book a Consultation
              </Link>
            </div>
          </div>
        </div>
        
        <div className="border-t mt-8 pt-8 text-center" style={{ borderColor: '#6b8a4d' }}>
          <p style={{ color: '#FCFAF6' }}>
            © 2025 DRIVEN Professionals. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}