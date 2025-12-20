'use client';

import { useEffect, useState } from 'react';
import ResourceCard from '@/components/ResourceCard';

interface Resource {
  id: string;
  title: string;
  description?: string;
  url: string;
  provider?: string;
  cover_image_url?: string;
  thumbnail_url?: string;
  category?: {
    id: string;
    name: string;
  };
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch resources from API (public access)
    const fetchResources = async () => {
      try {
        const response = await fetch('/api/member/resources');
        if (response.ok) {
          const data = await response.json();
          setResources(data.resources || []);
        }
      } catch (err) {
        console.error('Error fetching resources:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResources();
  }, []);
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Resources</h1>
        <p className="text-lg text-gray-600">
          Access videos, documents, podcasts, and other learning resources.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading resources...</p>
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No resources available</h3>
          <p className="text-gray-600">Check back soon for new content!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      )}
    </div>
  );
}
