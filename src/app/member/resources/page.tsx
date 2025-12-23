'use client';

import { useEffect, useState } from 'react';
import MemberLayout from '@/components/layouts/MemberLayout';
import ResourceCard from '@/components/ResourceCard';
import { getCurrentUser } from '@/lib/auth';
import { Resource } from '@/types';

export default function MemberResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = getCurrentUser();

  useEffect(() => {
    if (!user?.id) return;

    const fetchResources = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/member/resources?userId=${user.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch resources');
        }

        const data = await response.json();
        setResources(data.resources || []);
      } catch (err: any) {
        console.error('Error fetching resources:', err);
        setError(err.message || 'Failed to load resources');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResources();
  }, [user?.id]);

  return (
    <MemberLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Resources</h1>
          <p className="text-xl text-gray-600 max-w-2xl">
            Your curated library of workshop recordings, documents, and learning materials.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-800 text-sm font-medium">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-500 font-medium">Loading your resources...</p>
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-24 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <div className="bg-white p-4 rounded-full shadow-sm inline-block mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No resources found</h3>
            <p className="text-gray-600 max-w-sm mx-auto">
              You don&apos;t have any resources assigned to your account yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {resources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        )}
      </div>
    </MemberLayout>
  );
}
