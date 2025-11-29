'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layouts/AdminLayout';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { Button } from '@/components';
import { getCurrentUser } from '@/lib/auth';

interface Announcement {
  id: string;
  title: string;
  body: string;
  published_at: string;
  created_by_id?: string;
  created_by?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function AdminAnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const user = getCurrentUser();

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/admin/announcements');
      
      if (!response.ok) {
        throw new Error('Failed to fetch announcements');
      }

      const data = await response.json();
      setAnnouncements(data.announcements || []);
    } catch (err: any) {
      console.error('Error fetching announcements:', err);
      setError(err.message || 'Failed to load announcements');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: string, title: string) => {
    setDeleteTarget({ id, title });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      const response = await fetch(`/api/admin/announcements/${deleteTarget.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete announcement');
      }

      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      // Refresh list
      fetchAnnouncements();
    } catch (err: any) {
      setError(`Failed to delete announcement: ${err.message}`);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const truncateBody = (body: string, maxLength: number = 100) => {
    if (body.length <= maxLength) return body;
    return body.substring(0, maxLength) + '...';
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Announcements</h1>
            <p className="text-gray-600">Manage announcements for members</p>
          </div>
          <Button onClick={() => router.push('/admin/announcements/new')}>
            New Announcement
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading announcements...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-600 mb-4">No announcements yet.</p>
            <Button onClick={() => router.push('/admin/announcements/new')}>
              Create Your First Announcement
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preview
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Published
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {announcements.map((announcement) => (
                  <tr key={announcement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {announcement.title}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {truncateBody(announcement.body)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatDate(announcement.published_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {announcement.created_by?.name || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => router.push(`/admin/announcements/${announcement.id}/edit`)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(announcement.id, announcement.title)}
                        className="text-red-600 hover:text-red-900"
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

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={showDeleteConfirm}
          title="Delete this announcement?"
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

