import { useMemo, useState } from 'react';
import { CalendarSearch } from 'lucide-react';
import EventCard from '@/components/events/EventCard';
import EventFiltersBar from '@/components/events/EventFiltersBar';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StatusStates';
import EventDetailModal from '@/features/student/EventDetailModal';
import { useEvents } from '@/hooks/useEvents';
import { DEFAULT_EVENT_FILTERS, filterAndSortEvents, type EventFilters } from '@/lib/eventFilters';

export default function DiscoverEventsPage() {
  const { events, loading, error, reload } = useEvents();
  const [filters, setFilters] = useState<EventFilters>(DEFAULT_EVENT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visibleEvents = useMemo(() => filterAndSortEvents(events, filters), [events, filters]);
  const selectedEvent = events.find((event) => event.id === selectedId) ?? null;

  const hasActiveSearch = Boolean(filters.search || filters.category !== 'all' || filters.date);
  const resetSearch = () => setFilters((current) => ({ ...current, search: '', category: 'all', date: '' }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-50">Discover events</h2>
          <p className="mt-1 text-sm text-slate-400">Find talks, workshops, hackathons and more across campus.</p>
        </div>
        {!loading && !error && events.length > 0 && (
          <p className="text-sm font-medium text-slate-400">
            Showing {visibleEvents.length} of {events.length} events
          </p>
        )}
      </div>

      <EventFiltersBar filters={filters} onChange={setFilters} />

      {loading && events.length === 0 ? (
        <LoadingState label="Loading events..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void reload()} />
      ) : events.length === 0 ? (
        <EmptyState
          title="No events yet"
          description="There are no events scheduled right now. Check back soon for new campus activities."
        />
      ) : visibleEvents.length === 0 ? (
        <EmptyState
          title="No events found"
          description="Try a different search term, category or date, or view all events."
          icon={<CalendarSearch className="h-7 w-7" aria-hidden="true" />}
          action={
            hasActiveSearch || filters.status !== 'all' ? (
              <div className="flex flex-wrap justify-center gap-3">
                {hasActiveSearch && (
                  <button
                    type="button"
                    onClick={resetSearch}
                    className="rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400"
                  >
                    Clear filters
                  </button>
                )}
                {filters.status !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setFilters((current) => ({ ...current, status: 'all' }))}
                    className="rounded-xl bg-slate-900/70 px-4 py-2.5 text-sm font-semibold text-slate-300 ring-1 ring-slate-700 transition hover:bg-slate-800 hover:text-slate-100"
                  >
                    Show all statuses
                  </button>
                )}
              </div>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visibleEvents.map((event, index) => (
            <div
              key={event.id}
              className="animate-modal-in h-full"
              style={{ animationDelay: `${Math.min(index, 8) * 40}ms`, animationFillMode: 'both' }}
            >
              <EventCard event={event} onSelect={(picked) => setSelectedId(picked.id)} />
            </div>
          ))}
        </div>
      )}

      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedId(null)}
        onRegistered={() => void reload()}
      />
    </div>
  );
}
