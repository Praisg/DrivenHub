'use client';

import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import GoogleCalendarSync from '@/components/admin/GoogleCalendarSync';
import { getCurrentUser } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';

export default function AdminEventsPage() {
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = getCurrentUser();

  const fetchAllEvents = useCallback(async () => {
    try {
      setIsLoading(true);
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
    } catch (error: any) {
      console.error('Error fetching events:', error);
      setError(error.message || 'Failed to fetch events');
      setAllEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllEvents();
  }, [fetchAllEvents]);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Events Management</h1>
          <p className="text-gray-600">Sync and manage events from Google Calendar</p>
        </div>

        {/* Google Calendar Sync */}
        <div className="mb-8">
          <GoogleCalendarSync onSyncComplete={fetchAllEvents} />
        </div>

        {/* All Events List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">All Synced Events</h2>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
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
            <div className="space-y-4">
              {allEvents.map((event: any) => {
                // Safely parse dates with validation
                const startDate = event.startISO ? new Date(event.startISO) : null;
                const endDate = event.endISO ? new Date(event.endISO) : null;
                const startStr = startDate && !isNaN(startDate.getTime()) 
                  ? startDate.toLocaleString() 
                  : 'Invalid date';
                const endStr = endDate && !isNaN(endDate.getTime()) 
                  ? endDate.toLocaleString() 
                  : 'Invalid date';
                
                return (
                  <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{event.title || 'Untitled Event'}</h3>
                        <p className="text-sm text-gray-600 mt-1">{event.description || 'No description'}</p>
                        <div className="mt-2 text-xs text-gray-500">
                          <p>Start: {startStr}</p>
                          <p>End: {endStr}</p>
                          {event.organizerEmail && <p>Organizer: {event.organizerEmail}</p>}
                          {event.attendeesEmails && event.attendeesEmails.length > 0 && (
                            <p className="mt-1">
                              Attendees ({event.attendeesEmails.length}): {event.attendeesEmails.slice(0, 3).join(', ')}
                              {event.attendeesEmails.length > 3 && ` +${event.attendeesEmails.length - 3} more`}
                            </p>
                          )}
                          {event.zoomUrl && (
                            <p className="mt-1">
                              <a href={event.zoomUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                Join Meeting
                              </a>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

