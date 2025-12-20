'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { Button } from '@/components';
import { getCurrentUser } from '@/lib/auth';
import ResourceCard from '@/components/ResourceCard';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface Resource {
  id: string;
  title: string;
  description?: string;
  url: string;
  provider?: string;
  cover_image_url?: string;
  thumbnail_url?: string;
  visibility: 'all' | 'selected';
  category?: {
    id: string;
    name: string;
  };
  category_id?: string;
  assignedMembers?: Array<{ id: string; name: string; email: string }>;
}

interface Category {
  id: string;
  name: string;
  sort_order: number;
}


export default function AdminResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const user = getCurrentUser();

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formCategoryId, setFormCategoryId] = useState<string>('');
  const [formCoverImageUrl, setFormCoverImageUrl] = useState('');
  const [formVisibility, setFormVisibility] = useState<'all' | 'selected'>('all');
  const [isSaving, setIsSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formErrors, setFormErrors] = useState<{ title?: string; url?: string }>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch resources first (required)
      const resourcesRes = await fetch('/api/admin/resources');
      if (!resourcesRes.ok) {
        const errorData = await resourcesRes.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch resources (${resourcesRes.status})`);
      }
      const resourcesData = await resourcesRes.json();
      setResources(resourcesData.resources || []);

      // Fetch categories (optional - don't fail if this fails)
      try {
        const categoriesRes = await fetch('/api/admin/resource-categories');
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData.categories || []);
        }
      } catch (catErr) {
        console.warn('Failed to fetch categories (optional):', catErr);
        // Continue without categories
      }
    } catch (err: any) {
      console.error('Error fetching data:', {
        message: err.message,
        error: err,
      });
      setError(err.message || 'Failed to load resources. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingResource(null);
    setFormTitle('');
    setFormDescription('');
    setFormUrl('');
    setFormCategoryId('');
    setFormCoverImageUrl('');
    setFormVisibility('all');
    setShowAdvanced(false);
    setFormErrors({});
    setError(null);
    setShowModal(true);
  };

  const handleEdit = async (resource: Resource) => {
    setEditingResource(resource);
    setFormTitle(resource.title);
    setFormDescription(resource.description || '');
    setFormUrl(resource.url);
    setFormCategoryId(resource.category_id || '');
    setFormCoverImageUrl(resource.cover_image_url || '');
    setFormVisibility(resource.visibility);
    setShowAdvanced(false);
    setFormErrors({});
    setError(null);
    setShowModal(true);
  };

  const handleDelete = (id: string, title: string) => {
    setDeleteTarget({ id, title });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !user?.id) return;

    try {
      const response = await fetch(`/api/admin/resources/${deleteTarget.id}?userId=${user.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete resource');
      }

      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      setError(`Failed to delete resource: ${err.message}`);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    }
  };

  const validateForm = (): boolean => {
    const errors: { title?: string; url?: string } = {};
    
    if (!formTitle.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!formUrl.trim()) {
      errors.url = 'URL is required';
    } else if (!formUrl.startsWith('http://') && !formUrl.startsWith('https://')) {
      errors.url = 'URL must start with http:// or https://';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !user?.id) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setFormErrors({});

      const url = editingResource
        ? `/api/admin/resources/${editingResource.id}`
        : '/api/admin/resources';

      const method = editingResource ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle.trim(),
          description: formDescription.trim() || null,
          url: formUrl.trim(),
          categoryId: formCategoryId || null,
          coverImageUrl: formCoverImageUrl.trim() || null,
          visibility: formVisibility,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Failed to save resource';
        throw new Error(errorMessage);
      }

      setShowModal(false);
      await fetchData();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to save resource';
      setError(errorMessage);
      console.error('Save resource error:', err);
    } finally {
      setIsSaving(false);
    }
  };


  // Filter resources
  const filteredResources = resources.filter((resource) => {
    const matchesCategory = selectedCategory === 'all' || resource.category_id === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Resources</h1>
            <p className="text-gray-600">Manage resources for members</p>
          </div>
          <Button onClick={handleCreate}>
            <PlusIcon className="w-5 h-5 mr-2" />
            New Resource
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
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
              {searchQuery || selectedCategory !== 'all'
                ? 'No resources match your filters.'
                : 'No resources yet.'}
            </p>
            <Button onClick={handleCreate}>Create Your First Resource</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
              <div key={resource.id} className="relative group">
                <ResourceCard resource={resource} />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <button
                    onClick={() => handleEdit(resource)}
                    className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50"
                    title="Edit"
                  >
                    <PencilIcon className="w-4 h-4 text-blue-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(resource.id, resource.title)}
                    className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50"
                    title="Delete"
                  >
                    <TrashIcon className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingResource ? 'Edit Resource' : 'New Resource'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Basic Fields - Always Visible */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => {
                      setFormTitle(e.target.value);
                      if (formErrors.title) setFormErrors({ ...formErrors, title: undefined });
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Resource title"
                  />
                  {formErrors.title && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link URL *
                  </label>
                  <input
                    type="url"
                    value={formUrl}
                    onChange={(e) => {
                      setFormUrl(e.target.value);
                      if (formErrors.url) setFormErrors({ ...formErrors, url: undefined });
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.url ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="https://..."
                  />
                  {formErrors.url ? (
                    <p className="mt-1 text-xs text-red-600">{formErrors.url}</p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500">
                      YouTube URLs will automatically get thumbnails
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description..."
                  />
                </div>

                {/* Advanced Section - Collapsible */}
                <div className="border-t border-gray-200 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    <span>Advanced Options</span>
                    {showAdvanced ? (
                      <ChevronUpIcon className="w-5 h-5" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5" />
                    )}
                  </button>

                  {showAdvanced && (
                    <div className="mt-4 space-y-4">
                      {/* Category */}
                      {categories.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category (optional)
                          </label>
                          <select
                            value={formCategoryId}
                            onChange={(e) => setFormCategoryId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">None</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Cover Image URL */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cover Image URL (optional)
                        </label>
                        <input
                          type="url"
                          value={formCoverImageUrl}
                          onChange={(e) => setFormCoverImageUrl(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="https://..."
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Override automatic thumbnail (e.g., for custom images)
                        </p>
                      </div>

                      {/* Visibility - Simplified for now */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Visibility
                        </label>
                        <select
                          value={formVisibility}
                          onChange={(e) => setFormVisibility(e.target.value as 'all' | 'selected')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">Everyone</option>
                          <option value="selected" disabled>
                            Selected Members (coming soon)
                          </option>
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                          Default: Everyone can see this resource
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Error Display */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <Button
                    onClick={() => {
                      setShowModal(false);
                      setError(null);
                      setFormErrors({});
                    }}
                    variant="outline"
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave} 
                    disabled={isSaving || !formTitle.trim() || !formUrl.trim()}
                  >
                    {isSaving ? 'Saving...' : editingResource ? 'Update' : 'Create'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={showDeleteConfirm}
          title="Delete this resource?"
          description={`This will permanently delete "${deleteTarget?.title || ''}". This action cannot be undone.`}
          confirmLabel="Yes, delete"
          cancelLabel="Cancel"
          confirmVariant="danger"
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setDeleteTarget(null);
          }}
        />
      </div>
    </AdminLayout>
  );
}

