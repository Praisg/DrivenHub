'use client';

import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import GoogleCalendarSync from '@/components/admin/GoogleCalendarSync';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { Button } from '@/components';
import { getCurrentUser } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';

// Helper function to validate URLs
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export default function AdminEventsPage() {
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const user = getCurrentUser();

  const fetchAllEvents = useCallback(async (retryCount = 0, isPostSync = false) => {
    try {
      if (isPostSync) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      // Fetch all events (admin can see all)
      const response = await fetch('/api/admin/events');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch events' }));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch events`);
      }
      const data = await response.json();
      // Validate and filter out events with invalid dates
      const validEvents = (data.events || []).filter((event: any) => {
        if (!event.startISO || !event.endISO) {
          console.warn('Event missing dates:', event.id, event.title);
          return false;
        }
        const startDate = new Date(event.startISO);
        const endDate = new Date(event.endISO);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          console.warn('Event has invalid dates:', event.id, event.title, { startISO: event.startISO, endISO: event.endISO });
          return false;
        }
        return true;
      });
      setAllEvents(validEvents);
      setError(null); // Clear any previous errors on success
    } catch (error: any) {
      console.error('Error fetching events:', error);
      // Retry logic: if this is a retry after sync and we get an error, retry once more
      if (retryCount < 2 && (isPostSync || error.message?.includes('Failed to fetch'))) {
        console.log(`Retrying fetch (attempt ${retryCount + 1}/2)...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
        return fetchAllEvents(retryCount + 1, isPostSync);
      }
      setError(error.message || 'Failed to fetch events');
      setAllEvents([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllEvents();
  }, [fetchAllEvents]);

  const handleClearEvents = async () => {
    setIsClearing(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/admin/events/clear', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to clear events' }));
        throw new Error(errorData.error || 'Failed to clear events');
      }

      const data = await response.json();
      setSuccess(data.message || `Cleared ${data.cleared || 0} synced events`);
      setShowClearConfirm(false);
      
      // Refresh events list
      await fetchAllEvents();
    } catch (err: any) {
      setError(err.message || 'Failed to clear events');
    } finally {
      setIsClearing(false);
    }
  };

  // Group events by date
  const groupEventsByDate = (events: any[]) => {
    const grouped: { [key: string]: any[] } = {};
    
    events.forEach((event) => {
      const date = event.startISO ? new Date(event.startISO) : null;
      if (date && !isNaN(date.getTime())) {
        const dateKey = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(event);
      } else {
        // Events without valid dates go to "Other"
        if (!grouped['Other']) {
          grouped['Other'] = [];
        }
        grouped['Other'].push(event);
      }
    });

    return grouped;
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Events Management</h1>
          <p className="text-gray-600">Sync and manage events from Google Calendar</p>
        </div>

        {/* Google Calendar Sync */}
        <div className="mb-8">
          <GoogleCalendarSync onSyncComplete={() => fetchAllEvents(0, true)} />
          
          {/* Clear Synced Events Button */}
          {allEvents.length > 0 && (
            <div className="mt-4">
              <Button
                onClick={() => setShowClearConfirm(true)}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                Clear Synced Events
              </Button>
            </div>
          )}
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">{success}</p>
          </div>
        )}

        {/* All Events List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">All Synced Events</h2>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
          
          {isRefreshing && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">Refreshing events list...</p>
            </div>
          )}
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading events...</p>
            </div>
          ) : allEvents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No events synced yet. Use the sync button above to import events from Google Calendar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Table Layout */}
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date/Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendees
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Meeting Link
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allEvents.map((event: any) => {
                    const startDate = event.startISO ? new Date(event.startISO) : null;
                    const endDate = event.endISO ? new Date(event.endISO) : null;
                    const startStr = startDate && !isNaN(startDate.getTime()) 
                      ? startDate.toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Invalid date';
                    const attendeesCount = event.attendeesEmails?.length || 0;
                    
                    return (
                      <tr key={event.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{event.title || 'Untitled Event'}</div>
                          {event.description && (
                            <div className="text-xs text-gray-500 mt-1 line-clamp-2 max-w-xs">
                              {event.description}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{startStr}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {attendeesCount > 0 ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {attendeesCount} {attendeesCount === 1 ? 'attendee' : 'attendees'}
                              </span>
                            ) : (
                              <span className="text-gray-400">No attendees</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {event.zoomUrl && isValidUrl(event.zoomUrl) ? (
                            <a
                              href={event.zoomUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Join Meeting
                            </a>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Clear Events Confirmation Dialog */}
        <ConfirmDialog
          open={showClearConfirm}
          title="Clear all synced events?"
          description="This will delete all events that have been synced from Google Calendar, and remove them from members' views. This action cannot be undone."
          confirmLabel="Yes, clear events"
          cancelLabel="Cancel"
          confirmVariant="danger"
          onConfirm={handleClearEvents}
          onCancel={() => setShowClearConfirm(false)}
        />
      </div>
    </AdminLayout>
  );
}

