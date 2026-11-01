import type { EventRecord } from '@/types/event';

const REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;

export function getEventStart(event: Pick<EventRecord, 'event_date' | 'start_time'>): Date {
  const [year, month, day] = event.event_date.split('-').map(Number);
  const [hours, minutes] = event.start_time.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

export function isStartingWithin24Hours(event: Pick<EventRecord, 'event_date' | 'start_time'>, now = new Date()): boolean {
  const untilStart = getEventStart(event).getTime() - now.getTime();
  return untilStart > 0 && untilStart <= REMINDER_WINDOW_MS;
}
