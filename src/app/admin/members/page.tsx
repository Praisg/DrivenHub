'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { Button, Card } from '@/components';
import { getCurrentUser } from '@/lib/auth';

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at?: string;
  assigned_skills?: any[];
}

export default function AdminMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'multiple' | 'all'; id?: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    // Filter members based on search query
    if (!searchQuery.trim()) {
      setFilteredMembers(members);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredMembers(
        members.filter(
          (m) =>
            m.name.toLowerCase().includes(query) ||
            m.email.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, members]);

  const loadMembers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/members');
      if (!response.ok) {
        throw new Error('Failed to load members');
      }
      const data = await response.json();
      // Filter to only show members (not admins)
      const memberList = (data.members || []).filter((m: Member) => m.role === 'member');
      setMembers(memberList);
      setFilteredMembers(memberList);
    } catch (err: any) {
      setError(err.message || 'Failed to load members');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredMembers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMembers.map((m) => m.id)));
    }
  };

  const handleSelectMember = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDeleteSingle = (id: string) => {
    setDeleteTarget({ type: 'single', id });
    setShowDeleteConfirm(true);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    setDeleteTarget({ type: 'multiple' });
    setShowDeleteConfirm(true);
  };

  const handleDeleteAll = () => {
    setDeleteTarget({ type: 'all' });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      let idsToDelete: string[] = [];

      if (deleteTarget.type === 'single' && deleteTarget.id) {
        idsToDelete = [deleteTarget.id];
      } else if (deleteTarget.type === 'multiple') {
        idsToDelete = Array.from(selectedIds);
      } else if (deleteTarget.type === 'all') {
        idsToDelete = filteredMembers.map((m) => m.id);
      }

      if (idsToDelete.length === 0) {
        throw new Error('No members selected');
      }

      const user = getCurrentUser();
      if (!user || !user.id) {
        throw new Error('You must be logged in to delete members');
      }

      // Use bulk delete endpoint for multiple, single delete for one
      const endpoint =
        idsToDelete.length === 1
          ? `/api/admin/members/${idsToDelete[0]}?adminUserId=${encodeURIComponent(user.id)}`
          : '/api/admin/members/bulk-delete';

      const response = await fetch(endpoint, {
        method: idsToDelete.length === 1 ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: idsToDelete.length === 1 ? undefined : JSON.stringify({ ids: idsToDelete, adminUserId: user.id }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete members' }));
        throw new Error(errorData.error || 'Failed to delete members');
      }

      setSuccess(`Successfully deleted ${idsToDelete.length} member${idsToDelete.length !== 1 ? 's' : ''}`);
      setSelectedIds(new Set());
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      await loadMembers();
    } catch (err: any) {
      setError(err.message || 'Failed to delete members');
    } finally {
      setIsDeleting(false);
    }
  };

  const getSkillCount = (member: Member) => {
    if (member.assigned_skills && Array.isArray(member.assigned_skills)) {
      return member.assigned_skills.length;
    }
    return 0;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Remove & Manage Members</h1>
          <p className="text-gray-600">Search, select, and remove members from the system</p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <Card className="mb-6 p-4 bg-green-50 border border-green-200">
            <p className="text-green-800 text-sm">{success}</p>
          </Card>
        )}

        {error && (
          <Card className="mb-6 p-4 bg-red-50 border border-red-200">
            <p className="text-red-800 text-sm">{error}</p>
          </Card>
        )}

        {/* Search and Actions */}
        <Card className="mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={handleDeleteSelected}
                disabled={selectedIds.size === 0 || isDeleting}
                variant="danger"
                className="flex-1 sm:flex-none"
              >
                Delete Selected ({selectedIds.size})
              </Button>
              {filteredMembers.length > 0 && (
                <Button
                  onClick={handleDeleteAll}
                  disabled={isDeleting}
                  variant="danger"
                  className="flex-1 sm:flex-none"
                >
                  Delete All
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Members Table */}
        <Card className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading members...</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">
                {searchQuery ? 'No members found matching your search.' : 'No members found.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredMembers.length && filteredMembers.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Skills Assigned
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(member.id)}
                          onChange={() => handleSelectMember(member.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{member.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getSkillCount(member)} {getSkillCount(member) === 1 ? 'skill' : 'skills'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(member.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeleteSingle(member.id)}
                          disabled={isDeleting}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={showDeleteConfirm}
          title={
            deleteTarget?.type === 'single'
              ? 'Remove this member?'
              : deleteTarget?.type === 'all'
              ? 'Delete all members?'
              : 'Remove selected members?'
          }
          description={
            deleteTarget?.type === 'single'
              ? "This will delete this member's account and any associated skill assignments and coaching requests. This action cannot be undone."
              : deleteTarget?.type === 'all'
              ? `This will delete all ${filteredMembers.length} members and their associated data. This action cannot be undone.`
              : `This will delete all ${selectedIds.size} selected accounts and associated data for these members. This action cannot be undone.`
          }
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

