'use client';

import { Event } from '@/types';
import { formatEventTime } from '@/lib/time';
import { downloadICS } from '@/lib/ics';
import Button from './Button';
import Card from './Card';

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  const { ct, et } = formatEventTime(event.startISO);

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
      {/* Invitation Message */}
      <p className="text-sm text-gray-600 mb-3">You are being invited to an event</p>
      
      {/* Event Title */}
      <h3 className="text-xl font-semibold text-gray-900 mb-4">{event.title}</h3>
      
      {/* Time Information */}
      <div className="space-y-1 mb-6">
        <div className="text-sm text-gray-600">
          <strong>Central Time:</strong> {ct}
        </div>
        <div className="text-sm text-gray-600">
          <strong>Eastern Time:</strong> {et}
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {event.zoomUrl && (
          <Button
            href={event.zoomUrl}
            variant="primary"
            size="sm"
          >
            {event.zoomUrl.includes('zoom.us') ? 'Join Zoom' : 
             event.zoomUrl.includes('meet.google.com') ? 'Join Google Meet' : 
             'Join Meeting'}
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
