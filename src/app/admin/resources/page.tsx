'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
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
  DocumentArrowUpIcon,
  PhotoIcon,
  UsersIcon,
  CheckCircleIcon,
  TagIcon,
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

  // Member selection (access control) + search
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [formAssignedMemberIds, setFormAssignedMemberIds] = useState<string[]>([]);
  // Label metadata (non-functional for access)
  const [formVisibilityLab, setFormVisibilityLab] = useState(false);
  const [formVisibilityAlumni, setFormVisibilityAlumni] = useState(false);
  const [formCohorts, setFormCohorts] = useState<number[]>([]);

  const user = getCurrentUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formThumbnailUrl, setFormThumbnailUrl] = useState('');
  
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

      const resourcesRes = await fetch('/api/admin/resources');
      if (!resourcesRes.ok) throw new Error('Failed to fetch resources');
      const data = await resourcesRes.json();
      setResources(data.resources || []);

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
    setFormAssignedMemberIds([]);
    setFormVisibilityLab(false);
    setFormVisibilityAlumni(false);
    setFormCohorts([]);
    setMemberSearchQuery('');
    setResourceFile(null);
    setThumbnailFile(null);
    setFormErrors({});
    setError(null);
    setShowModal(true);
  };

  const handleEdit = async (resource: Resource) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/resources/${resource.id}`);
      if (!res.ok) throw new Error('Failed to fetch resource details');
      const { resource: full } = await res.json();

      setEditingResource(full);
      setFormTitle(full.title);
      setFormDescription(full.description || '');
      setFormUrl(full.url);
      setFormThumbnailUrl(full.thumbnail_url || '');
      setFormAssignedMemberIds(full.assigned_member_ids || []);
      setFormVisibilityLab(full.visibility_lab ?? false);
      setFormVisibilityAlumni(full.visibility_alumni ?? false);
      setFormCohorts(full.cohorts || []);
      setMemberSearchQuery('');

      setResourceFile(null);
      setThumbnailFile(null);
      setFormErrors({});
      setError(null);
      setShowModal(true);
    } catch (err: any) {
      setError(err.message || 'Failed to open resource');
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

      if (!response.ok) throw new Error('Failed to delete resource');

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
          // labels/metadata only
          visibility_lab: formVisibilityLab,
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
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to save resource');
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  // Member list filtering - ONLY by search query
  // IMPORTANT: Role (Lab/Alumni) and Cohort filters are VISUAL LABELS ONLY
  // They do NOT affect which members are shown in the list
  // Access is granted ONLY by selecting member cards below
  const filteredMembers = useMemo(() => {
    // Filter ONLY by name/email search - ignore all role/cohort filters
    if (!memberSearchQuery.trim()) {
      // No search query = show all members
      return members;
    }
    const query = memberSearchQuery.toLowerCase().trim();
    return members.filter((m) => {
      return (
        m.name.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query)
      );
    });
  }, [members, memberSearchQuery]);
  // NOTE: formVisibilityLab, formVisibilityAlumni, formCohorts are NOT in dependencies
  // They are metadata labels only and must never affect the member list

  const toggleMemberSelection = (memberId: string) => {
    if (formAssignedMemberIds.includes(memberId)) {
      setFormAssignedMemberIds(
        formAssignedMemberIds.filter((id) => id !== memberId)
      );
    } else {
      setFormAssignedMemberIds([...formAssignedMemberIds, memberId]);
    }
  };

  const selectAllFiltered = () => {
    const filteredIds = filteredMembers.map((m) => m.id);
    const merged = new Set([...formAssignedMemberIds, ...filteredIds]);
    setFormAssignedMemberIds(Array.from(merged));
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
            <p className="text-gray-600">Assign resources directly to individual members</p>
          </div>
          <Button onClick={handleCreate}>
            <PlusIcon className="w-5 h-5 mr-2" />
            New Resource
          </Button>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
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
                {/* Simple badge showing how many members are assigned if provided */}
                {resource.assigned_member_ids && (
                  <div className="mt-2 px-1 flex items-center gap-1 text-[11px] text-gray-500">
                    <CheckCircleIcon className="w-3 h-3 text-green-500" />
                    <span>{resource.assigned_member_ids.length} member(s) assigned</span>
                  </div>
                )}
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
                        placeholder="e.g. Workshop Recording"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
                        <input
                          type="url"
                          value={formUrl}
                          onChange={(e) => setFormUrl(e.target.value)}
                          disabled={!!resourceFile}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                            formErrors.url ? 'border-red-500' : 'border-gray-300'
                          } ${resourceFile ? 'bg-gray-50 text-gray-400' : ''}`}
                          placeholder="Link to video, doc, etc."
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
                          <input type="file" ref={fileInputRef} onChange={(e) => setResourceFile(e.target.files?.[0] || null)} className="hidden" />
                          <DocumentArrowUpIcon className={`w-5 h-5 mr-2 ${resourceFile ? 'text-blue-600' : 'text-gray-400'}`} />
                          <span className={`text-sm ${resourceFile ? 'text-blue-700 font-medium' : 'text-gray-500'}`}>
                            {resourceFile ? resourceFile.name : 'Choose File'}
                          </span>
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
                        placeholder="Brief summary for the card"
                      />
                    </div>

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
                          placeholder="Direct image link"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Or Upload Image</label>
                        <div 
                          onClick={() => thumbInputRef.current?.click()}
                          className={`flex items-center justify-center px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                            thumbnailFile ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
                          }`}
                        >
                          <input type="file" ref={thumbInputRef} accept="image/*" onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)} className="hidden" />
                          <PhotoIcon className={`w-5 h-5 mr-2 ${thumbnailFile ? 'text-blue-600' : 'text-gray-400'}`} />
                          <span className={`text-sm ${thumbnailFile ? 'text-blue-700 font-medium' : 'text-gray-500'}`}>
                            {thumbnailFile ? thumbnailFile.name : 'Choose Image'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Labels (metadata only) + Member Assignment (access) */}
                  <div className="pt-4 border-t border-gray-100 space-y-6">
                    {/* Labels (metadata only) */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center">
                        <TagIcon className="w-5 h-5 mr-2 text-blue-600" />
                        Labels (do not control access)
                      </h3>
                      <p className="text-xs text-gray-500 mb-3">
                        These are informational only. Access is granted solely by selecting members below.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${formVisibilityLab ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
                          <input
                            type="checkbox"
                            checked={formVisibilityLab}
                            onChange={(e) => setFormVisibilityLab(e.target.checked)}
                            className="h-5 w-5 text-blue-600 rounded"
                          />
                          <span className="ml-3 text-sm font-bold text-gray-900">Lab Member</span>
                        </label>
                        <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${formVisibilityAlumni ? 'bg-purple-50 border-purple-200' : 'bg-white border-gray-200'}`}>
                          <input
                            type="checkbox"
                            checked={formVisibilityAlumni}
                            onChange={(e) => setFormVisibilityAlumni(e.target.checked)}
                            className="h-5 w-5 text-purple-600 rounded"
                          />
                          <span className="ml-3 text-sm font-bold text-gray-900">Alumni</span>
                        </label>
                      </div>
                      <div className="mt-4">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Cohort Labels (optional)</label>
                        <div className="flex flex-wrap gap-2">
                          {[1,2,3,4,5,6,7,8,9,10].map((cohort) => (
                            <button
                              key={cohort}
                              type="button"
                              onClick={() => {
                                if (formCohorts.includes(cohort)) {
                                  setFormCohorts(formCohorts.filter((c) => c !== cohort));
                                } else {
                                  setFormCohorts([...formCohorts, cohort].sort((a,b)=>a-b));
                                }
                              }}
                              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                                formCohorts.includes(cohort)
                                  ? 'bg-blue-600 text-white shadow-md'
                                  : 'bg-white text-gray-600 border border-gray-200'
                              }`}
                            >
                              {cohort}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Member Assignment (actual access control) */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder="Search members..."
                            value={memberSearchQuery}
                            onChange={(e) => setMemberSearchQuery(e.target.value)}
                            className="w-full pl-3 pr-3 py-1.5 text-sm border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <button
                            type="button"
                            onClick={selectAllFiltered}
                            className="font-semibold text-blue-600 hover:text-blue-800"
                          >
                            Select All
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            type="button"
                            onClick={() => setFormAssignedMemberIds([])}
                            className="font-semibold text-red-600 hover:text-red-800"
                          >
                            Clear All
                          </button>
                        </div>
                      </div>

                      <div className="max-h-72 overflow-y-auto p-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {filteredMembers.map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => toggleMemberSelection(m.id)}
                              className={`flex items-center px-3 py-2 rounded-lg border text-left transition-all ${
                                formAssignedMemberIds.includes(m.id)
                                  ? 'bg-blue-600 border-blue-600 text-white shadow'
                                  : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="text-xs font-bold truncate">
                                    {m.name}
                                  </span>
                                  <span className="text-[10px] text-gray-400">
                                    C{m.cohort || '?'}
                                  </span>
                                </div>
                                <div className="text-[10px] truncate">
                                  {m.email}
                                </div>
                                <div className="mt-0.5 text-[10px] text-gray-300">
                                  {m.is_lab_member && 'Lab'}{m.is_lab_member && m.is_alumni && ' · '}{m.is_alumni && 'Alumni'}
                                </div>
                              </div>
                            </button>
                          ))}
                          {filteredMembers.length === 0 && (
                            <div className="col-span-full py-6 text-center text-xs text-gray-400">
                              {members.length === 0
                                ? 'Loading members...'
                                : memberSearchQuery.trim()
                                ? 'No members match your search.'
                                : 'No members available.'}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-xs text-gray-600">
                        <span>
                          <strong>{formAssignedMemberIds.length}</strong> member(s) selected
                        </span>
                        {formAssignedMemberIds.length === 0 && (
                          <span className="text-amber-600 flex items-center gap-1">
                            <CheckCircleIcon className="w-3 h-3" />
                            Will be saved but not visible to anyone
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {isUploading && (
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    <span className="text-sm text-blue-700">Uploading to Supabase...</span>
                  </div>
                )}
                
                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 font-bold">{error}</div>}

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 sticky bottom-0 bg-white pb-2">
                  <Button onClick={() => setShowModal(false)} variant="outline" disabled={isSaving || isUploading}>Cancel</Button>
                  <Button onClick={handleSave} disabled={isSaving || isUploading || !formTitle.trim()}>
                    {isSaving ? 'Saving...' : editingResource ? 'Update Resource' : 'Publish Resource'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={showDeleteConfirm}
          title="Delete Resource"
          description={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
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
