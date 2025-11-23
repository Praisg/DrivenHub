'use client';

import MemberLayout from '@/components/layouts/MemberLayout';
import { useEffect, useState } from 'react';
import { EventCard } from '@/components';
import { Event } from '@/types';
import { getCurrentUser } from '@/lib/auth';

// Helper function to categorize events into Today, Upcoming, and Past
function categorizeEvents(events: Event[]) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const today: Event[] = [];
  const upcoming: Event[] = [];
  const past: Event[] = [];

  events.forEach((event) => {
    const eventDate = new Date(event.startISO);
    
    if (eventDate >= todayStart && eventDate < todayEnd) {
      // Event is today
      today.push(event);
    } else if (eventDate >= todayEnd) {
      // Event is in the future (after today)
      upcoming.push(event);
    } else {
      // Event is in the past
      past.push(event);
    }
  });

  // Sort each category
  today.sort((a, b) => new Date(a.startISO).getTime() - new Date(b.startISO).getTime());
  upcoming.sort((a, b) => new Date(a.startISO).getTime() - new Date(b.startISO).getTime());
  past.sort((a, b) => new Date(b.startISO).getTime() - new Date(a.startISO).getTime()); // Most recent first

  return { today, upcoming, past };
}

export default function MemberEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const user = getCurrentUser();
        if (!user || !user.id) {
          setError('Please log in to view events');
          setIsLoading(false);
          return;
        }

        // Use the member events API endpoint which uses user_events join table
        const apiUrl = `/api/member/events?userId=${encodeURIComponent(user.id)}`;
        const response = await fetch(apiUrl);
        
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

  const { today, upcoming, past } = categorizeEvents(events);

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
        {!isLoading && !error && events.length > 0 && (
          <div className="space-y-8">
            {/* Today's Events */}
            {today.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                  Today's Events ({today.length})
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {today.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Events */}
            {upcoming.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                  Upcoming Events ({upcoming.length})
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {upcoming.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            )}

            {/* Past Events */}
            {past.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                  Past Events ({past.length})
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {past.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && events.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events scheduled</h3>
            <p className="text-gray-600">
              You don't have any events. Events will appear here when you're invited via Google Calendar.
            </p>
          </div>
        )}
      </div>
    </MemberLayout>
  );
}
