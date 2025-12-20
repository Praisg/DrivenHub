'use client';

import { useEffect, useState } from 'react';
import MemberLayout from '@/components/layouts/MemberLayout';
import ResourceCard from '@/components/ResourceCard';
import { getCurrentUser } from '@/lib/auth';

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

interface Category {
  id: string;
  name: string;
}

export default function MemberResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = getCurrentUser();

  useEffect(() => {
    fetchResources();
    fetchCategories();
  }, []);

  const fetchResources = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const url = user?.id
        ? `/api/member/resources?userId=${user.id}`
        : '/api/member/resources';

      const response = await fetch(url);
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

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/resource-categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // Group resources by category
  const resourcesByCategory = categories.reduce((acc, category) => {
    const categoryResources = resources.filter(
      (r) => r.category?.id === category.id
    );
    if (categoryResources.length > 0) {
      acc[category.name] = categoryResources;
    }
    return acc;
  }, {} as Record<string, Resource[]>);

  const uncategorizedResources = resources.filter((r) => !r.category);

  // Filter resources based on selected category
  const filteredResources =
    selectedCategory === 'all'
      ? resources
      : resources.filter((r) => r.category?.id === selectedCategory);

  return (
    <MemberLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Resources</h1>
          <p className="text-lg text-gray-600">
            Access videos, documents, podcasts, and other learning resources.
          </p>
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="mb-6">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading resources...</p>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-600 mb-4">
              {selectedCategory !== 'all'
                ? 'No resources in this category.'
                : 'No resources available yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        )}
      </div>
    </MemberLayout>
  );
}
