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
  GlobeAltIcon,
  DocumentArrowUpIcon,
  PhotoIcon,
  UserIcon,
  MagnifyingGlassIcon,
  FunnelIcon
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
  
  // Filter state for member selection
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [filterLabOnly, setFilterLabOnly] = useState(false);
  const [filterAlumniOnly, setFilterAlumniOnly] = useState(false);
  const [filterCohorts, setFilterCohorts] = useState<number[]>([]);

  const user = getCurrentUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formThumbnailUrl, setFormThumbnailUrl] = useState('');
  const [formIsLabWide, setFormIsLabWide] = useState(false);
  const [formVisibilityAlumni, setFormVisibilityAlumni] = useState(false);
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
    setFormIsLabWide(false);
    setFormVisibilityAlumni(false);
    setFormAssignedMemberIds([]);
    setResourceFile(null);
    setThumbnailFile(null);
    setFormErrors({});
    setError(null);
    
    // Reset filters
    setFilterLabOnly(false);
    setFilterAlumniOnly(false);
    setFilterCohorts([]);
    setMemberSearchQuery('');
    
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
      setFormIsLabWide(fullResource.is_lab_wide || false);
      setFormVisibilityAlumni(fullResource.visibility_alumni || false);
      setFormAssignedMemberIds(fullResource.assigned_member_ids || []);
      setResourceFile(null);
      setThumbnailFile(null);
      setFormErrors({});
      setError(null);
      
      // Reset filters when opening edit
      setFilterLabOnly(false);
      setFilterAlumniOnly(false);
      setFilterCohorts([]);
      setMemberSearchQuery('');
      
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

  // Filter Logic
  const toggleFilterCohort = (cohort: number) => {
    if (filterCohorts.includes(cohort)) {
      setFilterCohorts(filterCohorts.filter(c => c !== cohort));
    } else {
      setFilterCohorts([...filterCohorts, cohort].sort((a, b) => a - b));
    }
  };

  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      // Search filter
      const matchesSearch = 
        m.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(memberSearchQuery.toLowerCase());
      
      // Role filter (Now ignored for matching, just using searchQuery and cohorts)
      
      // Cohort filter
      let matchesCohort = true;
      if (filterCohorts.length > 0) {
        matchesCohort = m.cohort ? filterCohorts.includes(m.cohort) : false;
      }
      
      return matchesSearch && matchesCohort;
    });
  }, [members, memberSearchQuery, filterCohorts]);

  const toggleMemberSelection = (memberId: string) => {
    if (formAssignedMemberIds.includes(memberId)) {
      setFormAssignedMemberIds(formAssignedMemberIds.filter(id => id !== memberId));
    } else {
      setFormAssignedMemberIds([...formAssignedMemberIds, memberId]);
    }
  };

  const selectAllFiltered = () => {
    const filteredIds = filteredMembers.map(m => m.id);
    const newSelection = Array.from(new Set([...formAssignedMemberIds, ...filteredIds]));
    setFormAssignedMemberIds(newSelection);
  };

  const deselectAllFiltered = () => {
    const filteredIds = new Set(filteredMembers.map(m => m.id));
    setFormAssignedMemberIds(formAssignedMemberIds.filter(id => !filteredIds.has(id)));
  };

  const resourcesFiltered = resources.filter((resource) => {
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
            <p className="text-gray-600">Assign workshop recordings and files to members</p>
          </div>
          <Button onClick={handleCreate}>
            <PlusIcon className="w-5 h-5 mr-2" />
            New Resource
          </Button>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        ) : resourcesFiltered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md border border-gray-100">
            <p className="text-gray-600 mb-4">No resources found.</p>
            <Button onClick={handleCreate}>Create Your First Resource</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resourcesFiltered.map((resource) => (
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
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[95vh] overflow-y-auto shadow-2xl">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl sticky top-0 z-10">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingResource ? 'Edit & Assign Resource' : 'New Resource Assignment'}
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
                        placeholder="What is this resource about?"
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
                          <input type="file" ref={thumbInputRef} accept="image/*" onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)} className="hidden" />
                          <PhotoIcon className={`w-5 h-5 mr-2 ${thumbnailFile ? 'text-blue-600' : 'text-gray-400'}`} />
                          <span className={`text-sm ${thumbnailFile ? 'text-blue-700 font-medium' : 'text-gray-500'}`}>
                            {thumbnailFile ? thumbnailFile.name : 'Choose Image'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Resource Audience Labels */}
                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider text-gray-500">
                      Target Audience Labels
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${formIsLabWide ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                        <input 
                          type="checkbox" 
                          checked={formIsLabWide} 
                          onChange={(e) => setFormIsLabWide(e.target.checked)} 
                          className="h-5 w-5 text-blue-600 rounded border-gray-300" 
                        />
                        <div className="ml-3">
                          <span className="block text-sm font-bold text-gray-900">Lab Members</span>
                          <span className="block text-[10px] text-gray-500">Intended for active Lab</span>
                        </div>
                      </label>

                      <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${formVisibilityAlumni ? 'bg-purple-50 border-purple-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                        <input 
                          type="checkbox" 
                          checked={formVisibilityAlumni} 
                          onChange={(e) => setFormVisibilityAlumni(e.target.checked)} 
                          className="h-5 w-5 text-purple-600 rounded border-gray-300" 
                        />
                        <div className="ml-3">
                          <span className="block text-sm font-bold text-gray-900">Alumni</span>
                          <span className="block text-[10px] text-gray-500">Intended for Alumni</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Assignment Section */}
                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <FunnelIcon className="w-5 h-5 mr-2 text-blue-600" />
                      Assign Members
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Filter Tool - Cohort Only */}
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                          Filter Members by Cohort
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((cohort) => (
                            <button
                              key={cohort}
                              type="button"
                              onClick={() => toggleFilterCohort(cohort)}
                              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                                filterCohorts.includes(cohort)
                                  ? 'bg-blue-600 text-white shadow-md'
                                  : 'bg-white text-gray-600 border border-gray-200'
                              }`}
                            >
                              {cohort}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Member List with Actions */}
                      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="relative flex-1">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Search filtered list..."
                              value={memberSearchQuery}
                              onChange={(e) => setMemberSearchQuery(e.target.value)}
                              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-md outline-none"
                            />
                          </div>
                          <div className="flex items-center gap-3">
                            <button type="button" onClick={selectAllFiltered} className="text-xs font-bold text-blue-600 hover:text-blue-800">
                              Select All Filtered
                            </button>
                            <span className="text-gray-300">|</span>
                            <button type="button" onClick={deselectAllFiltered} className="text-xs font-bold text-red-600 hover:text-red-800">
                              Deselect All Filtered
                            </button>
                          </div>
                        </div>

                        <div className="max-h-64 overflow-y-auto p-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {filteredMembers.map((m) => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => toggleMemberSelection(m.id)}
                                className={`flex items-center px-3 py-3 rounded-lg border text-left transition-all ${
                                  formAssignedMemberIds.includes(m.id)
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                    : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50/30'
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <p className="text-xs font-black truncate uppercase tracking-tight">
                                      {m.name}
                                    </p>
                                    <span className={`text-[9px] px-1 rounded ${formAssignedMemberIds.includes(m.id) ? 'bg-blue-500' : 'bg-gray-100 text-gray-500'}`}>
                                      C{m.cohort || '?'}
                                    </span>
                                  </div>
                                  <p className={`text-[10px] truncate leading-tight ${
                                    formAssignedMemberIds.includes(m.id) ? 'text-blue-100' : 'text-gray-400'
                                  }`}>
                                    {m.email}
                                  </p>
                                </div>
                              </button>
                            ))}
                            {filteredMembers.length === 0 && (
                              <div className="col-span-full py-8 text-center text-gray-400 italic text-sm">
                                No members match your current filters.
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                          <p className="text-xs font-bold text-gray-500">
                            {formAssignedMemberIds.length} Total Selected
                          </p>
                          {formAssignedMemberIds.length > 0 && (
                            <button type="button" onClick={() => setFormAssignedMemberIds([])} className="text-[10px] uppercase font-black text-red-500 hover:underline tracking-widest">
                              Clear All
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 font-bold">{error}</div>}

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 sticky bottom-0 bg-white z-10 pb-2">
                  <Button onClick={() => setShowModal(false)} variant="outline" disabled={isSaving || isUploading}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving || isUploading || !formTitle.trim()}>
                    {isSaving ? 'Saving...' : editingResource ? 'Update Assignments' : (
                      formAssignedMemberIds.length > 0 ? `Assign to ${formAssignedMemberIds.length} Member(s)` : 'Save Without Assignments'
                    )}
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
