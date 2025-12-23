'use client';

import { useEffect, useState, useRef } from 'react';
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
  DocumentArrowUpIcon,
  PhotoIcon,
  UserIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { Resource, Member } from '@/types';

export default function AdminResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  const user = getCurrentUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formThumbnailUrl, setFormThumbnailUrl] = useState('');
  const [formIsLabWide, setFormIsLabWide] = useState(true);
  const [formVisibilityAlumni, setFormVisibilityAlumni] = useState(false);
  const [formCohorts, setFormCohorts] = useState<number[]>([]);
  const [formAssignedMemberIds, setFormAssignedMemberIds] = useState<string[]>([]);
  
  // File upload state
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<{ title?: string; url?: string }>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch resources
      const resourcesRes = await fetch('/api/admin/resources');
      if (!resourcesRes.ok) {
        const errorData = await resourcesRes.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch resources (${resourcesRes.status})`);
      }
      const resourcesData = await resourcesRes.json();
      setResources(resourcesData.resources || []);

      // Fetch members for assignment
      const membersRes = await fetch('/api/admin/members');
      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData.members || []);
      }
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
    setFormIsLabWide(true);
    setFormVisibilityAlumni(false);
    setFormCohorts([]);
    setFormAssignedMemberIds([]);
    setResourceFile(null);
    setThumbnailFile(null);
    setFormErrors({});
    setError(null);
    setShowModal(true);
  };

  const handleEdit = async (resource: Resource) => {
    try {
      setIsLoading(true);
      // Fetch full resource details including assignments
      const res = await fetch(`/api/admin/resources/${resource.id}`);
      if (!res.ok) throw new Error('Failed to fetch resource details');
      const { resource: fullResource } = await res.json();

      setEditingResource(fullResource);
      setFormTitle(fullResource.title);
      setFormDescription(fullResource.description || '');
      setFormUrl(fullResource.url);
      setFormThumbnailUrl(fullResource.thumbnail_url || '');
      setFormIsLabWide(fullResource.is_lab_wide);
      setFormVisibilityAlumni(fullResource.visibility_alumni);
      setFormCohorts(fullResource.cohorts || []);
      setFormAssignedMemberIds(fullResource.assigned_member_ids || []);
      setResourceFile(null);
      setThumbnailFile(null);
      setFormErrors({});
      setError(null);
      setShowModal(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
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
    }
  };

  const validateForm = (): boolean => {
    const errors: { title?: string; url?: string } = {};
    if (!formTitle.trim()) errors.title = 'Title is required';
    if (!formUrl.trim() && !resourceFile) {
      errors.url = 'Either a Link URL or a File is required';
    } else if (formUrl.trim() && !formUrl.startsWith('http')) {
      errors.url = 'URL must start with http:// or https://';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const uploadFile = async (file: File, type: 'resource' | 'thumbnail') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await fetch('/api/admin/resources/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to upload ${type}`);
    }

    return await response.json();
  };

  const handleSave = async () => {
    if (!validateForm() || !user?.id) return;

    try {
      setIsSaving(true);
      setError(null);

      let finalUrl = formUrl.trim();
      let finalThumbnailUrl = formThumbnailUrl.trim();

      // Upload files if present
      if (resourceFile || thumbnailFile) {
        setIsUploading(true);
        if (resourceFile) {
          const uploadRes = await uploadFile(resourceFile, 'resource');
          finalUrl = uploadRes.url;
        }
        if (thumbnailFile) {
          const uploadRes = await uploadFile(thumbnailFile, 'thumbnail');
          finalThumbnailUrl = uploadRes.url;
        }
        setIsUploading(false);
      }

      const apiUrl = editingResource
        ? `/api/admin/resources/${editingResource.id}`
        : '/api/admin/resources';

      const method = editingResource ? 'PUT' : 'POST';

      const response = await fetch(apiUrl, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle.trim(),
          description: formDescription.trim() || null,
          url: finalUrl,
          thumbnailUrl: finalThumbnailUrl || null,
          is_lab_wide: formIsLabWide,
          visibility_alumni: formVisibilityAlumni,
          cohorts: formCohorts,
          assigned_member_ids: formAssignedMemberIds,
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
      setIsUploading(false);
    }
  };

  const toggleCohort = (cohort: number) => {
    if (formCohorts.includes(cohort)) {
      setFormCohorts(formCohorts.filter(c => c !== cohort));
    } else {
      setFormCohorts([...formCohorts, cohort].sort((a, b) => a - b));
    }
  };

  const toggleMember = (memberId: string) => {
    if (formAssignedMemberIds.includes(memberId)) {
      setFormAssignedMemberIds(formAssignedMemberIds.filter(id => id !== memberId));
    } else {
      setFormAssignedMemberIds([...formAssignedMemberIds, memberId]);
    }
  };

  const selectAllMembers = () => {
    setFormAssignedMemberIds(members.map(m => m.id));
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(memberSearchQuery.toLowerCase())
  );

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
                  {resource.is_lab_wide && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      Lab-wide
                    </span>
                  )}
                  {resource.visibility_alumni && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                      Alumni
                    </span>
                  )}
                  {resource.cohorts && resource.cohorts.length > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      Cohorts: {resource.cohorts.join(', ')}
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
                  {/* Basic Info */}
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
                    
                    {/* Link vs File */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Resource Link</label>
                        <input
                          type="url"
                          value={formUrl}
                          onChange={(e) => setFormUrl(e.target.value)}
                          disabled={!!resourceFile}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                            formErrors.url ? 'border-red-500' : 'border-gray-300'
                          } ${resourceFile ? 'bg-gray-50 text-gray-400' : ''}`}
                          placeholder="YouTube, Dropbox, etc."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Or Upload File</label>
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className={`flex items-center justify-center px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                            resourceFile ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
                          }`}
                        >
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={(e) => setResourceFile(e.target.files?.[0] || null)}
                            className="hidden"
                          />
                          <DocumentArrowUpIcon className={`w-5 h-5 mr-2 ${resourceFile ? 'text-blue-600' : 'text-gray-400'}`} />
                          <span className={`text-sm ${resourceFile ? 'text-blue-700 font-medium' : 'text-gray-500'}`}>
                            {resourceFile ? resourceFile.name : 'Choose File'}
                          </span>
                          {resourceFile && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setResourceFile(null); }}
                              className="ml-2 text-gray-400 hover:text-red-500"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
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

                    {/* Thumbnail Link vs File */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
                        <input
                          type="url"
                          value={formThumbnailUrl}
                          onChange={(e) => setFormThumbnailUrl(e.target.value)}
                          disabled={!!thumbnailFile}
                          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                            thumbnailFile ? 'bg-gray-50 text-gray-400' : ''
                          }`}
                          placeholder="Image URL"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Or Upload Thumbnail</label>
                        <div 
                          onClick={() => thumbInputRef.current?.click()}
                          className={`flex items-center justify-center px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                            thumbnailFile ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
                          }`}
                        >
                          <input
                            type="file"
                            ref={thumbInputRef}
                            accept="image/*"
                            onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                            className="hidden"
                          />
                          <PhotoIcon className={`w-5 h-5 mr-2 ${thumbnailFile ? 'text-blue-600' : 'text-gray-400'}`} />
                          <span className={`text-sm ${thumbnailFile ? 'text-blue-700 font-medium' : 'text-gray-500'}`}>
                            {thumbnailFile ? thumbnailFile.name : 'Choose Image'}
                          </span>
                          {thumbnailFile && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setThumbnailFile(null); }}
                              className="ml-2 text-gray-400 hover:text-red-500"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Visibility & Access */}
                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <GlobeAltIcon className="w-5 h-5 mr-2 text-blue-600" />
                      Visibility & Access
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Lab-wide option */}
                      <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                          type="checkbox"
                          checked={formIsLabWide}
                          onChange={(e) => setFormIsLabWide(e.target.checked)}
                          className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <div className="ml-3">
                          <span className="block text-sm font-medium text-gray-900">Lab-wide (All Members)</span>
                          <span className="block text-xs text-gray-500">Visible to all active Lab members regardless of cohort</span>
                        </div>
                      </label>

                      {/* Alumni Visibility */}
                      <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                          type="checkbox"
                          checked={formVisibilityAlumni}
                          onChange={(e) => setFormVisibilityAlumni(e.target.checked)}
                          className="h-5 w-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                        />
                        <div className="ml-3">
                          <span className="block text-sm font-medium text-gray-900">Available to Alumni</span>
                          <span className="block text-xs text-gray-500">Visible to former members in selected cohorts</span>
                        </div>
                      </label>

                      {/* Cohort Selection */}
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-sm font-medium text-gray-900">
                            Assign to Specific Cohorts
                          </label>
                          {formCohorts.length > 0 && (
                            <button 
                              onClick={() => setFormCohorts([])}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Clear Selection
                            </button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((cohort) => (
                            <button
                              key={cohort}
                              type="button"
                              onClick={() => toggleCohort(cohort)}
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                                formCohorts.includes(cohort)
                                  ? 'bg-blue-600 text-white shadow-md ring-2 ring-offset-2 ring-blue-500'
                                  : 'bg-white text-gray-600 border border-gray-300 hover:border-blue-400'
                              }`}
                            >
                              {cohort}
                            </button>
                          ))}
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                          Used for Alumni and Lab Members (if not Lab-wide)
                        </p>
                      </div>

                      {/* Individual Member Assignment */}
                      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                              <UserIcon className="w-4 h-4 mr-1.5 text-blue-600" />
                              Assign to Specific Members
                            </h4>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {formAssignedMemberIds.length} member(s) selected
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              type="button"
                              onClick={selectAllMembers}
                              className="text-xs font-medium text-blue-600 hover:text-blue-800"
                            >
                              Select All
                            </button>
                            <span className="text-gray-300">|</span>
                            <button 
                              type="button"
                              onClick={() => setFormAssignedMemberIds([])}
                              className="text-xs font-medium text-red-600 hover:text-red-800"
                            >
                              Clear
                            </button>
                          </div>
                        </div>

                        {/* Member Search */}
                        <div className="relative mb-3">
                          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Filter members..."
                            value={memberSearchQuery}
                            onChange={(e) => setMemberSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
                          />
                        </div>

                        {/* Members List */}
                        <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-md bg-gray-50/50">
                          {filteredMembers.length === 0 ? (
                            <p className="p-4 text-xs text-center text-gray-500 italic">No members found</p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 p-2">
                              {filteredMembers.map((m) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => toggleMember(m.id)}
                                  className={`flex items-center px-3 py-2 rounded-md border text-left transition-all ${
                                    formAssignedMemberIds.includes(m.id)
                                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                      : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50/50'
                                  }`}
                                >
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold truncate leading-tight">
                                      {m.name}
                                    </p>
                                    <p className={`text-[10px] truncate leading-tight mt-0.5 ${
                                      formAssignedMemberIds.includes(m.id) ? 'text-blue-100' : 'text-gray-400'
                                    }`}>
                                      {m.email}
                                    </p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Loading states / Errors */}
                {isUploading && (
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    <span className="text-sm text-blue-700">Uploading files...</span>
                  </div>
                )}
                
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                    {error}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                  <Button
                    onClick={() => setShowModal(false)}
                    variant="outline"
                    disabled={isSaving || isUploading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave} 
                    disabled={isSaving || isUploading || !formTitle.trim()}
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
