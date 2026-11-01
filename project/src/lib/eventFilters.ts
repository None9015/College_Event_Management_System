import { EVENT_CATEGORIES, type EventCategory, type EventRecord, type EventStatus, type EventWithCount } from '@/types/event';
import { todayIso } from '@/lib/dates';

export type StatusFilter = 'all' | EventStatus;
export type SortOption = 'soonest' | 'latest' | 'title' | 'availability';

export interface EventFilters {
  search: string;
  category: EventCategory | 'all';
  status: StatusFilter;
  date: string;
  sort: SortOption;
}

export const DEFAULT_EVENT_FILTERS: EventFilters = {
  search: '',
  category: 'all',
  status: 'upcoming',
  date: '',
  sort: 'soonest',
};

export function getEventStatus(event: Pick<EventRecord, 'event_date'>, today = todayIso()): EventStatus {
  return event.event_date >= today ? 'upcoming' : 'completed';
}

export function getSpotsLeft(event: EventWithCount): number {
  return Math.max(event.capacity - event.registeredCount, 0);
}

export function filterAndSortEvents(
  events: EventWithCount[],
  filters: EventFilters,
  today = todayIso(),
): EventWithCount[] {
  const query = filters.search.trim().toLowerCase();

  const filtered = events.filter((event) => {
    if (query && !`${event.title} ${event.description}`.toLowerCase().includes(query)) return false;
    if (filters.category !== 'all' && event.category !== filters.category) return false;
    if (filters.status !== 'all' && getEventStatus(event, today) !== filters.status) return false;
    if (filters.date && event.event_date !== filters.date) return false;
    return true;
  });

  return filtered.sort((a, b) => {
    switch (filters.sort) {
      case 'latest':
        return b.event_date.localeCompare(a.event_date) || b.start_time.localeCompare(a.start_time);
      case 'title':
        return a.title.localeCompare(b.title);
      case 'availability':
        return getSpotsLeft(b) - getSpotsLeft(a);
      case 'soonest':
      default:
        return a.event_date.localeCompare(b.event_date) || a.start_time.localeCompare(b.start_time);
    }
  });
}

export const CATEGORY_OPTIONS: readonly (EventCategory | 'all')[] = ['all', ...EVENT_CATEGORIES];
