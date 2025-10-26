import { getEvents } from '@/lib/data';
import { sortEventsByDate } from '@/lib/time';
import { EventCard } from '@/components';

export default function EventsPage() {
  const events = getEvents();
  const sortedEvents = sortEventsByDate(events);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Upcoming Events</h1>
      </div>

      {/* Events List */}
      {sortedEvents.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sortedEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events scheduled</h3>
          <p className="text-gray-600">Check back soon for upcoming events!</p>
        </div>
      )}
    </div>
  );
}
