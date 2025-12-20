'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { Button } from '@/components';
import { getCurrentUser } from '@/lib/auth';
import ResourceCard from '@/components/ResourceCard';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getProviderIcon } from '@/lib/resources';

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

interface Member {
  id: string;
  name: string;
  email: string;
}

export default function AdminResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
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
  const [formSelectedMemberIds, setFormSelectedMemberIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [resourcesRes, categoriesRes, membersRes] = await Promise.all([
        fetch('/api/admin/resources'),
        fetch('/api/admin/resource-categories'),
        fetch('/api/admin/members'),
      ]);

      if (!resourcesRes.ok) throw new Error('Failed to fetch resources');
      if (!categoriesRes.ok) throw new Error('Failed to fetch categories');
      if (!membersRes.ok) throw new Error('Failed to fetch members');

      const resourcesData = await resourcesRes.json();
      const categoriesData = await categoriesRes.json();
      const membersData = await membersRes.json();

      setResources(resourcesData.resources || []);
      setCategories(categoriesData.categories || []);
      setMembers((membersData.members || []).filter((m: Member) => m.role === 'member'));
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
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
    setFormSelectedMemberIds([]);
    setShowModal(true);
  };

  const handleEdit = async (resource: Resource) => {
    // Fetch full resource details including assigned members
    try {
      const res = await fetch(`/api/admin/resources/${resource.id}`);
      if (res.ok) {
        const data = await res.json();
        const fullResource = data.resource;
        setEditingResource(fullResource);
        setFormTitle(fullResource.title);
        setFormDescription(fullResource.description || '');
        setFormUrl(fullResource.url);
        setFormCategoryId(fullResource.category_id || '');
        setFormCoverImageUrl(fullResource.cover_image_url || '');
        setFormVisibility(fullResource.visibility);
        setFormSelectedMemberIds(fullResource.assignedMembers?.map((m: Member) => m.id) || []);
        setShowModal(true);
      }
    } catch (err) {
      console.error('Error fetching resource:', err);
    }
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

  const handleSave = async () => {
    if (!formTitle || !formUrl || !user?.id) {
      setError('Title and URL are required');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const url = editingResource
        ? `/api/admin/resources/${editingResource.id}`
        : '/api/admin/resources';

      const method = editingResource ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription || null,
          url: formUrl,
          categoryId: formCategoryId || null,
          coverImageUrl: formCoverImageUrl || null,
          visibility: formVisibility,
          selectedMemberIds: formVisibility === 'selected' ? formSelectedMemberIds : [],
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save resource');
      }

      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setError(`Failed to save resource: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName || !user?.id) return;

    try {
      const response = await fetch('/api/admin/resource-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create category');
      }

      const data = await response.json();
      setCategories([...categories, data.category]);
      setFormCategoryId(data.category.id);
      setNewCategoryName('');
    } catch (err: any) {
      setError(`Failed to create category: ${err.message}`);
    }
  };

  const toggleMemberSelection = (memberId: string) => {
    setFormSelectedMemberIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Resource title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL *
                  </label>
                  <input
                    type="url"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    YouTube URLs will automatically get thumbnails
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={formCategoryId}
                        onChange={(e) => setFormCategoryId(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">None</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

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
                      <option value="selected">Selected Members</option>
                    </select>
                  </div>
                </div>

                {/* Quick add category */}
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quick Add Category
                    </label>
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleCreateCategory()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Category name..."
                    />
                  </div>
                  <Button onClick={handleCreateCategory} variant="outline">
                    Add
                  </Button>
                </div>

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
                </div>

                {/* Member Selection */}
                {formVisibility === 'selected' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Members ({formSelectedMemberIds.length} selected)
                    </label>
                    <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto p-2">
                      {members.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No members found</p>
                      ) : (
                        members.map((member) => (
                          <label
                            key={member.id}
                            className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formSelectedMemberIds.includes(member.id)}
                              onChange={() => toggleMemberSelection(member.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">
                              {member.name} ({member.email})
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <Button
                    onClick={() => setShowModal(false)}
                    variant="outline"
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
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

