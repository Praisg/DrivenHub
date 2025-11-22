'use client';

import MemberLayout from '@/components/layouts/MemberLayout';
import { useEffect, useState } from 'react';
import { sortEventsByDate } from '@/lib/time';
import { EventCard } from '@/components';
import { Event } from '@/types';
import { getCurrentUser } from '@/lib/auth';

export default function MemberEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const user = getCurrentUser();
        if (!user || !user.email) {
          setError('Please log in to view events');
          setIsLoading(false);
          return;
        }

        const response = await fetch(`/api/events?email=${encodeURIComponent(user.email)}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to fetch events');
        }

        const data = await response.json();
        setEvents(data.events || []);
      } catch (err: any) {
        console.error('Error fetching events:', err);
        setError(err.message || 'Failed to load events');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const sortedEvents = sortEventsByDate(events);

  return (
    <MemberLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">My Events</h1>
          <p className="text-gray-600">Events you've been invited to</p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading events...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-red-600 mb-2">Error</h3>
            <p className="text-gray-600">{error}</p>
          </div>
        )}

        {/* Events List */}
        {!isLoading && !error && sortedEvents.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sortedEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && sortedEvents.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events scheduled</h3>
            <p className="text-gray-600">
              You don't have any upcoming events. Events will appear here when you're invited via Google Calendar.
            </p>
          </div>
        )}
      </div>
    </MemberLayout>
  );
}

