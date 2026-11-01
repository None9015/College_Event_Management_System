import { useMemo, useState } from 'react';
import { CalendarDays, Clock, MapPin, Pencil, Plus, Trash2, Users } from 'lucide-react';
import CategoryBadge from '@/components/events/CategoryBadge';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StatusStates';
import DeleteEventModal from '@/features/organizer/DeleteEventModal';
import EventFormModal from '@/features/organizer/EventFormModal';
import ParticipantsModal from '@/features/organizer/ParticipantsModal';
import { useEvents } from '@/hooks/useEvents';
import { formatEventDate, formatTimeRange } from '@/lib/dates';
import { getEventStatus } from '@/lib/eventFilters';
import type { EventWithCount } from '@/types/event';

type ModalState =
  | { kind: 'form'; event: EventWithCount | null }
  | { kind: 'delete'; event: EventWithCount }
  | { kind: 'participants'; event: EventWithCount }
  | null;

type StatusView = 'upcoming' | 'completed' | 'all';

const STATUS_OPTIONS: { value: StatusView; label: string }[] = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
  { value: 'all', label: 'All' },
];

export default function OrganizerDashboard() {
  const { events, loading, error, reload } = useEvents();
  const [modal, setModal] = useState<ModalState>(null);
  const [statusView, setStatusView] = useState<StatusView>('upcoming');

  const stats = useMemo(() => {
    const totalRegistrations = events.reduce((sum, event) => sum + event.registeredCount, 0);
    const totalCapacity = events.reduce((sum, event) => sum + event.capacity, 0);
    return {
      total: events.length,
      upcoming: events.filter((event) => getEventStatus(event) === 'upcoming').length,
      registrations: totalRegistrations,
      fillRate: totalCapacity > 0 ? Math.round((totalRegistrations / totalCapacity) * 100) : 0,
    };
  }, [events]);

  const visibleEvents = useMemo(
    () =>
      events
        .filter((event) => statusView === 'all' || getEventStatus(event) === statusView)
        .sort((a, b) =>
          statusView === 'completed'
            ? b.event_date.localeCompare(a.event_date)
            : a.event_date.localeCompare(b.event_date) || a.start_time.localeCompare(b.start_time),
        ),
    [events, statusView],
  );

  const closeModal = () => setModal(null);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-50">Organizer dashboard</h2>
          <p className="mt-1 text-sm text-slate-400">Publish events, track sign-ups and manage your attendee lists.</p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ kind: 'form', event: null })}
          className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-xl bg-indigo-500 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:-translate-y-0.5 hover:bg-indigo-400 hover:shadow-xl active:translate-y-0 sm:self-auto"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New event
        </button>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Total events" value={stats.total} />
        <StatCard label="Upcoming" value={stats.upcoming} />
        <StatCard label="Registrations" value={stats.registrations} />
        <StatCard label="Seats filled" value={`${stats.fillRate}%`} />
      </dl>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-bold text-slate-50">Your events</h3>
          <SegmentedControl label="Filter events by status" options={STATUS_OPTIONS} value={statusView} onChange={setStatusView} />
        </div>

        {loading && events.length === 0 ? (
          <LoadingState label="Loading your events..." />
        ) : error ? (
          <ErrorState message={error} onRetry={() => void reload()} />
        ) : events.length === 0 ? (
          <EmptyState
            title="No events yet"
            description="Create your first event and it will appear here and on the student discovery page."
            action={
              <button
                type="button"
                onClick={() => setModal({ kind: 'form', event: null })}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-400"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Create an event
              </button>
            }
          />
        ) : visibleEvents.length === 0 ? (
          <EmptyState
            title={statusView === 'upcoming' ? 'No upcoming events' : 'No completed events'}
            description="Events will move between these tabs automatically as their dates pass."
          />
        ) : (
          <ul className="space-y-3">
            {visibleEvents.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                onViewParticipants={() => setModal({ kind: 'participants', event })}
                onEdit={() => setModal({ kind: 'form', event })}
                onDelete={() => setModal({ kind: 'delete', event })}
              />
            ))}
          </ul>
        )}
      </section>

      <EventFormModal
        open={modal?.kind === 'form'}
        event={modal?.kind === 'form' ? modal.event : null}
        onClose={closeModal}
        onSaved={() => void reload()}
      />
      <DeleteEventModal
        event={modal?.kind === 'delete' ? modal.event : null}
        onClose={closeModal}
        onDeleted={() => void reload()}
      />
      <ParticipantsModal event={modal?.kind === 'participants' ? modal.event : null} onClose={closeModal} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm backdrop-blur-md sm:p-5">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-2 text-2xl font-extrabold tracking-tight text-slate-50 sm:text-3xl">{value}</dd>
    </div>
  );
}

interface EventRowProps {
  event: EventWithCount;
  onViewParticipants: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function EventRow({ event, onViewParticipants, onEdit, onDelete }: EventRowProps) {
  const isCompleted = getEventStatus(event) === 'completed';
  const fillPercent = Math.min((event.registeredCount / event.capacity) * 100, 100);
  const isFull = event.registeredCount >= event.capacity;

  return (
    <li className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm backdrop-blur-md transition duration-300 hover:border-indigo-500/50 hover:shadow-[0_0_25px_rgba(99,102,241,0.15)] sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={event.category} />
            {isCompleted && (
              <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300">Completed</span>
            )}
          </div>
          <h4 className="truncate text-base font-bold text-slate-50">{event.title}</h4>
          <div className="flex flex-col gap-1 text-sm text-slate-400 sm:flex-row sm:flex-wrap sm:gap-x-5">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-indigo-300" aria-hidden="true" />
              {formatEventDate(event.event_date)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-indigo-300" aria-hidden="true" />
              {formatTimeRange(event.start_time, event.end_time)}
            </span>
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <MapPin className="h-4 w-4 shrink-0 text-indigo-300" aria-hidden="true" />
              <span className="truncate">{event.venue}</span>
            </span>
          </div>
        </div>

        <div className="w-full lg:w-56 lg:shrink-0">
          <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              {event.registeredCount} / {event.capacity} registered
            </span>
            {isFull && <span className="text-rose-300">Full</span>}
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-rose-500' : 'bg-indigo-500'}`}
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
          <button
            type="button"
            onClick={onViewParticipants}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-500/15 px-3 text-sm font-semibold text-indigo-300 ring-1 ring-indigo-500/30 transition hover:bg-indigo-500/25"
          >
            <Users className="h-4 w-4" aria-hidden="true" />
            Participants
          </button>
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${event.title}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-slate-100"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${event.title}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </li>
  );
}
