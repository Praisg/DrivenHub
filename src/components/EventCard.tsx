'use client';

import { Event } from '@/types';
import { formatEventTime, isUpcoming } from '@/lib/time';
import { downloadICS } from '@/lib/ics';
import Button from './Button';
import Badge from './Badge';
import Card from './Card';

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  const { ct, et } = formatEventTime(event.startISO);
  const upcoming = isUpcoming(event.startISO);

  const handleAddToCalendar = () => {
    downloadICS({
      title: event.title,
      startISO: event.startISO,
      endISO: event.endISO,
      description: event.description,
      url: event.zoomUrl,
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
        {upcoming && (
          <Badge variant="success">Upcoming</Badge>
        )}
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="text-sm text-gray-600">
          <strong>Central Time:</strong> {ct}
        </div>
        <div className="text-sm text-gray-600">
          <strong>Eastern Time:</strong> {et}
        </div>
      </div>
      
      <p className="text-gray-700 mb-4">{event.description}</p>
      
      <div className="flex flex-wrap gap-2">
        {event.zoomUrl && (
          <Button
            href={event.zoomUrl}
            variant="primary"
            size="sm"
          >
            Join Zoom
          </Button>
        )}
        
        {event.eventbriteUrl && (
          <Button
            href={event.eventbriteUrl}
            variant="outline"
            size="sm"
          >
            Register
          </Button>
        )}
        
        <Button
          onClick={handleAddToCalendar}
          variant="secondary"
          size="sm"
        >
          Add to Calendar
        </Button>
      </div>
    </Card>
  );
}
