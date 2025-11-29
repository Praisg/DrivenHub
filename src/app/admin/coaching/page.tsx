'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { Button, Card } from '@/components';
import { getCurrentUser } from '@/lib/auth';

interface CoachingRequest {
  id: string;
  topic: string;
  details: string | null;
  preferredDates: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  member: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export default function AdminCoachingPage() {
  const [requests, setRequests] = useState<CoachingRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<CoachingRequest[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'PENDING' | 'COMPLETED'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const loadRequests = async () => {
      const user = getCurrentUser();
      if (!user || !user.id) {
        setError('You must be logged in as an admin.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/admin/coaching-requests?userId=${user.id}`);
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to load coaching requests');
        }

        const data = await response.json();
        const requestsList = data.requests || [];
        setRequests(requestsList);
        setFilteredRequests(requestsList);
      } catch (err: any) {
        setError(err.message || 'Failed to load coaching requests');
      } finally {
        setIsLoading(false);
      }
    };

    loadRequests();
  }, []);

  useEffect(() => {
    // Filter requests based on active filter
    if (activeFilter === 'all') {
      setFilteredRequests(requests);
    } else {
      setFilteredRequests(requests.filter(r => r.status === activeFilter));
    }
  }, [activeFilter, requests]);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    setIsUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/coaching-requests/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update status' }));
        throw new Error(errorData.error || 'Failed to update status');
      }

      setSuccess('Status updated successfully');
      // Reload requests
      const reloadResponse = await fetch(`/api/admin/coaching-requests?userId=${getCurrentUser()?.id}`);
      if (reloadResponse.ok) {
        const reloadData = await reloadResponse.json();
        const requestsList = reloadData.requests || [];
        setRequests(requestsList);
        setFilteredRequests(requestsList);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteTarget(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setIsUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/coaching-requests/${deleteTarget}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete request' }));
        throw new Error(errorData.error || 'Failed to delete request');
      }

      setSuccess('Coaching request deleted successfully');
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      
      // Reload requests
      const reloadResponse = await fetch(`/api/admin/coaching-requests?userId=${getCurrentUser()?.id}`);
      if (reloadResponse.ok) {
        const reloadData = await reloadResponse.json();
        const requestsList = reloadData.requests || [];
        setRequests(requestsList);
        setFilteredRequests(requestsList);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete request');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REVIEWED':
        return 'bg-blue-100 text-blue-800';
      case 'SCHEDULED':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'REVIEWED':
        return 'Reviewed';
      case 'SCHEDULED':
        return 'Scheduled';
      case 'COMPLETED':
        return 'Done';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Coaching Requests</h1>
          <p className="text-lg text-gray-600">
            View and manage coaching requests from members.
          </p>
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

        {/* Filter Tabs */}
        {requests.length > 0 && (
          <Card className="mb-6 p-4">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({requests.length})
              </button>
              <button
                onClick={() => setActiveFilter('PENDING')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeFilter === 'PENDING'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending ({requests.filter(r => r.status === 'PENDING').length})
              </button>
              <button
                onClick={() => setActiveFilter('COMPLETED')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeFilter === 'COMPLETED'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Done ({requests.filter(r => r.status === 'COMPLETED').length})
              </button>
            </div>
          </Card>
        )}

        {isLoading ? (
          <Card className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading coaching requests...</p>
          </Card>
        ) : filteredRequests.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600">
              {activeFilter === 'all' 
                ? 'No coaching requests yet.' 
                : `No ${activeFilter.toLowerCase()} requests.`}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <Card key={request.id} className="p-6 hover:shadow-lg transition-shadow">
                {/* Header */}
                <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{request.topic}</h3>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                        {getStatusLabel(request.status)}
                      </span>
                    </div>
                    {request.member && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-medium">{request.member.name}</span>
                        <span className="text-gray-400">•</span>
                        <span>{request.member.email}</span>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Submitted: {formatDate(request.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Body */}
                <div className="mb-4 space-y-3">
                  {request.details && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Details:</h4>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">{request.details}</p>
                    </div>
                  )}

                  {request.preferredDates && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Preferred Dates/Times:</h4>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">{request.preferredDates}</p>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
                  {request.status !== 'COMPLETED' ? (
                    <Button
                      onClick={() => handleStatusUpdate(request.id, 'COMPLETED')}
                      disabled={isUpdating}
                      variant="outline"
                      size="sm"
                      className="text-green-700 border-green-300 hover:bg-green-50"
                    >
                      Mark as Done
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleStatusUpdate(request.id, 'PENDING')}
                      disabled={isUpdating}
                      variant="outline"
                      size="sm"
                      className="text-yellow-700 border-yellow-300 hover:bg-yellow-50"
                    >
                      Mark as Pending
                    </Button>
                  )}
                  <Button
                    onClick={() => handleDelete(request.id)}
                    disabled={isUpdating}
                    variant="danger"
                    size="sm"
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={showDeleteConfirm}
          title="Delete this coaching request?"
          description="This will permanently remove this coaching request. This action cannot be undone."
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

