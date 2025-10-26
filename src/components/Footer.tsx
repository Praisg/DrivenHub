import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-green-600 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">DRIVEN Community Hub</h3>
            <p className="text-green-100 mb-4">
              Connect, grow, and support each other in our virtual space for lifelong learners.
            </p>
            <div className="flex space-x-4">
              <Link
                href="https://www.drivenpros.com"
                className="text-green-100 hover:text-white transition-colors"
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
                <Link href="/events" className="text-green-100 hover:text-white transition-colors">
                  Upcoming Events
                </Link>
              </li>
              <li>
                <Link href="/resources" className="text-green-100 hover:text-white transition-colors">
                  Resources
                </Link>
              </li>
              <li>
                <Link href="/coaching" className="text-green-100 hover:text-white transition-colors">
                  Book Coaching
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Community</h4>
            <p className="text-green-100 mb-4">
              Join our community of professionals committed to personal and professional growth.
            </p>
            <div className="bg-green-700 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">Ready to get started?</p>
              <Link 
                href="/coaching" 
                className="bg-white text-green-600 px-4 py-2 rounded-lg font-semibold hover:bg-green-50 transition-colors inline-block"
              >
                Book a Consultation
              </Link>
            </div>
          </div>
        </div>
        
        <div className="border-t border-green-500 mt-8 pt-8 text-center">
          <p className="text-green-100">
            © 2025 DRIVEN Professionals. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}