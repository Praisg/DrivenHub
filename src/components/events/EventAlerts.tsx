import { Event } from '@/types';
import { isUpcoming, sortEventsByDate, formatEventTime } from '@/lib/time';
import Card from '../Card';
import Button from '../Button';

interface EventAlertsProps {
  events: Event[];
  limit?: number;
}

export default function EventAlerts({ events, limit = 3 }: EventAlertsProps) {
  const upcoming = sortEventsByDate(events).filter((e) => isUpcoming(e.startISO)).slice(0, limit);

  if (upcoming.length === 0) {
    return (
      <Card>
        <p className="text-gray-600">No upcoming events.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {upcoming.map((event) => {
        const { ct, et } = formatEventTime(event.startISO);
        return (
          <Card key={event.id} className="p-4">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h4 className="text-gray-900 font-semibold">{event.title}</h4>
                <p className="text-sm text-gray-600">CT: {ct} · ET: {et}</p>
                <p className="text-gray-700 line-clamp-2 mt-1">{event.description}</p>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                {event.zoomUrl && (
                  <Button href={event.zoomUrl} size="sm">Join on Zoom</Button>
                )}
                {event.eventbriteUrl && (
                  <Button href={event.eventbriteUrl} size="sm" variant="secondary">Eventbrite</Button>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}


