'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card } from '@/components';
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setRequests(data.requests || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load coaching requests');
      } finally {
        setIsLoading(false);
      }
    };

    loadRequests();
  }, []);

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

        {error && (
          <Card className="mb-6 p-6 bg-red-50 border border-red-200">
            <p className="text-red-800">{error}</p>
          </Card>
        )}

        {isLoading ? (
          <Card className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading coaching requests...</p>
          </Card>
        ) : requests.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600">No coaching requests yet.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{request.topic}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                    {request.member && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Member:</strong> {request.member.name} ({request.member.email})
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      Submitted: {formatDate(request.createdAt)}
                    </p>
                  </div>
                </div>

                {request.details && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Details:</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{request.details}</p>
                  </div>
                )}

                {request.preferredDates && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Preferred Dates/Times:</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{request.preferredDates}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

