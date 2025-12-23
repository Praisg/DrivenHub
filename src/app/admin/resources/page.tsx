'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { Button } from '@/components';
import { getCurrentUser } from '@/lib/auth';
import ResourceCard from '@/components/ResourceCard';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  XMarkIcon,
  GlobeAltIcon,
  UserGroupIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { Resource } from '@/types';

export default function AdminResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const user = getCurrentUser();

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formThumbnailUrl, setFormThumbnailUrl] = useState('');
  const [formVisibilityLab, setFormVisibilityLab] = useState(true);
  const [formVisibilityAlumni, setFormVisibilityAlumni] = useState(false);
  const [formIsCohortSpecific, setFormIsCohortSpecific] = useState(false);
  const [formCohorts, setFormCohorts] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<{ title?: string; url?: string }>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const resourcesRes = await fetch('/api/admin/resources');
      if (!resourcesRes.ok) {
        const errorData = await resourcesRes.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch resources (${resourcesRes.status})`);
      }
      const resourcesData = await resourcesRes.json();
      setResources(resourcesData.resources || []);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load resources.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingResource(null);
    setFormTitle('');
    setFormDescription('');
    setFormUrl('');
    setFormThumbnailUrl('');
    setFormVisibilityLab(true);
    setFormVisibilityAlumni(false);
    setFormIsCohortSpecific(false);
    setFormCohorts([]);
    setFormErrors({});
    setError(null);
    setShowModal(true);
  };

  const handleEdit = async (resource: Resource) => {
    setEditingResource(resource);
    setFormTitle(resource.title);
    setFormDescription(resource.description || '');
    setFormUrl(resource.url);
    setFormThumbnailUrl(resource.thumbnail_url || '');
    setFormVisibilityLab(resource.visibility_lab);
    setFormVisibilityAlumni(resource.visibility_alumni);
    setFormIsCohortSpecific(resource.is_cohort_specific);
    setFormCohorts(resource.cohorts || []);
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
    }
  };

  const validateForm = (): boolean => {
    const errors: { title?: string; url?: string } = {};
    if (!formTitle.trim()) errors.title = 'Title is required';
    if (!formUrl.trim()) {
      errors.url = 'URL is required';
    } else if (!formUrl.startsWith('http')) {
      errors.url = 'URL must start with http:// or https://';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !user?.id) return;

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
          title: formTitle.trim(),
          description: formDescription.trim() || null,
          url: formUrl.trim(),
          thumbnailUrl: formThumbnailUrl.trim() || null,
          visibility_lab: formVisibilityLab,
          visibility_alumni: formVisibilityAlumni,
          is_cohort_specific: formIsCohortSpecific,
          cohorts: formCohorts,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save resource');
      }

      setShowModal(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to save resource');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCohort = (cohort: number) => {
    if (formCohorts.includes(cohort)) {
      setFormCohorts(formCohorts.filter(c => c !== cohort));
    } else {
      setFormCohorts([...formCohorts, cohort].sort((a, b) => a - b));
    }
  };

  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      !searchQuery ||
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Resources</h1>
            <p className="text-gray-600">Manage resources for Lab Members and Alumni</p>
          </div>
          <Button onClick={handleCreate}>
            <PlusIcon className="w-5 h-5 mr-2" />
            New Resource
          </Button>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
          <div className="text-center py-12 bg-white rounded-lg shadow-md border border-gray-100">
            <p className="text-gray-600 mb-4">No resources found.</p>
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
                    className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 border border-gray-200"
                    title="Edit"
                  >
                    <PencilIcon className="w-4 h-4 text-blue-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(resource.id, resource.title)}
                    className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 border border-gray-200"
                    title="Delete"
                  >
                    <TrashIcon className="w-4 h-4 text-red-600" />
                  </button>
                </div>
                {/* Status Badges */}
                <div className="mt-2 flex flex-wrap gap-2 px-1">
                  {resource.visibility_lab && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      Lab
                    </span>
                  )}
                  {resource.visibility_alumni && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                      Alumni
                    </span>
                  )}
                  {resource.is_cohort_specific && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      Cohorts: {resource.cohorts?.join(', ') || 'None'}
                    </span>
                  )}
                  {!resource.is_cohort_specific && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      Lab-wide
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingResource ? 'Edit Resource' : 'New Resource'}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  {/* Title & URL */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                      <input
                        type="text"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                          formErrors.title ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="e.g. Weekly Workshop Recording"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Resource Link *</label>
                      <input
                        type="url"
                        value={formUrl}
                        onChange={(e) => setFormUrl(e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                          formErrors.url ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="YouTube, Dropbox, Drive, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                      <textarea
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="What is this resource about?"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail Image URL</label>
                      <input
                        type="url"
                        value={formThumbnailUrl}
                        onChange={(e) => setFormThumbnailUrl(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Leave blank for automatic provider thumbnail"
                      />
                    </div>
                  </div>

                  {/* Visibility & Access */}
                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <GlobeAltIcon className="w-5 h-5 mr-2 text-blue-600" />
                      Visibility & Access
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                          type="checkbox"
                          checked={formVisibilityLab}
                          onChange={(e) => setFormVisibilityLab(e.target.checked)}
                          className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <div className="ml-3">
                          <span className="block text-sm font-medium text-gray-900">Lab Members</span>
                          <span className="block text-xs text-gray-500">Visible to active members</span>
                        </div>
                      </label>

                      <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                          type="checkbox"
                          checked={formVisibilityAlumni}
                          onChange={(e) => setFormVisibilityAlumni(e.target.checked)}
                          className="h-5 w-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                        />
                        <div className="ml-3">
                          <span className="block text-sm font-medium text-gray-900">Alumni</span>
                          <span className="block text-xs text-gray-500">Visible to former members</span>
                        </div>
                      </label>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div>
                          <h4 className="font-medium text-gray-900">Resource Type</h4>
                          <p className="text-sm text-gray-500">Should this be restricted to specific cohorts?</p>
                        </div>
                        <div className="flex bg-white p-1 rounded-lg border border-gray-200">
                          <button
                            type="button"
                            onClick={() => setFormIsCohortSpecific(false)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                              !formIsCohortSpecific 
                                ? 'bg-blue-600 text-white shadow-sm' 
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            Lab-wide
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormIsCohortSpecific(true)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                              formIsCohortSpecific 
                                ? 'bg-blue-600 text-white shadow-sm' 
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            Cohort-specific
                          </button>
                        </div>
                      </div>

                      {formIsCohortSpecific && (
                        <div className="p-4 border border-blue-100 bg-blue-50 rounded-lg">
                          <label className="block text-sm font-medium text-blue-900 mb-3">
                            Select Cohorts
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((cohort) => (
                              <button
                                key={cohort}
                                type="button"
                                onClick={() => toggleCohort(cohort)}
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                                  formCohorts.includes(cohort)
                                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                                    : 'bg-white text-gray-600 border border-gray-300 hover:border-blue-400'
                                }`}
                              >
                                {cohort}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                  <Button
                    onClick={() => setShowModal(false)}
                    variant="outline"
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave} 
                    disabled={isSaving || !formTitle.trim() || !formUrl.trim()}
                  >
                    {isSaving ? 'Saving...' : editingResource ? 'Update Resource' : 'Create Resource'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={showDeleteConfirm}
          title="Delete Resource"
          description={`Are you sure you want to delete "${deleteTarget?.title}"? This cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          confirmVariant="danger"
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      </div>
    </AdminLayout>
  );
}
