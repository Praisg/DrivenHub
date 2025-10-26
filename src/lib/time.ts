/**
 * Format a date to show both Central Time and Eastern Time
 */
export function formatEventTime(dateISO: string): { ct: string; et: string } {
  const date = new Date(dateISO);
  
  // Use consistent formatting to avoid hydration mismatches
  const ctFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  
  const etFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  
  return {
    ct: ctFormatter.format(date),
    et: etFormatter.format(date),
  };
}

/**
 * Format a date for display in announcements
 */
export function formatAnnouncementDate(dateISO: string): string {
  const date = new Date(dateISO);
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

/**
 * Check if an event is upcoming
 */
export function isUpcoming(dateISO: string): boolean {
  return new Date(dateISO) > new Date();
}

/**
 * Sort events by date (upcoming first)
 */
export function sortEventsByDate<T extends { startISO: string }>(events: T[]): T[] {
  return [...events].sort((a, b) => {
    const dateA = new Date(a.startISO);
    const dateB = new Date(b.startISO);
    return dateA.getTime() - dateB.getTime();
  });
}
