import { CalendarDays, Clock, MapPin, Users } from 'lucide-react';
import CategoryBadge from '@/components/events/CategoryBadge';
import { formatEventDate, formatTimeRange } from '@/lib/dates';
import { getEventStatus, getSpotsLeft } from '@/lib/eventFilters';
import type { EventWithCount } from '@/types/event';

interface EventCardProps {
  event: EventWithCount;
  onSelect: (event: EventWithCount) => void;
}

export default function EventCard({ event, onSelect }: EventCardProps) {
  const status = getEventStatus(event);
  const spotsLeft = getSpotsLeft(event);
  const isFull = spotsLeft === 0;
  const fillPercent = Math.min((event.registeredCount / event.capacity) * 100, 100);

  return (
    <button
      type="button"
      onClick={() => onSelect(event)}
      className="group flex h-full w-full flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-left shadow-lg shadow-black/20 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-[0_0_25px_rgba(99,102,241,0.15)] focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/30"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <CategoryBadge category={event.category} />
        {status === 'completed' ? (
          <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300">Completed</span>
        ) : isFull ? (
          <span className="rounded-full bg-rose-500/15 px-2.5 py-1 text-xs font-semibold text-rose-300 ring-1 ring-inset ring-rose-400/30">Full</span>
        ) : (
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-400/30">
            {spotsLeft} {spotsLeft === 1 ? 'seat' : 'seats'} left
          </span>
        )}
      </div>

      <h3 className="text-lg font-bold leading-snug text-slate-50 transition group-hover:text-indigo-300">{event.title}</h3>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">{event.description || 'No description provided.'}</p>

      <dl className="mt-4 space-y-2 text-sm text-slate-300">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 shrink-0 text-indigo-400" aria-hidden="true" />
          <dd>{formatEventDate(event.event_date)}</dd>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 shrink-0 text-indigo-400" aria-hidden="true" />
          <dd>{formatTimeRange(event.start_time, event.end_time)}</dd>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0 text-indigo-400" aria-hidden="true" />
          <dd className="truncate">{event.venue}</dd>
        </div>
      </dl>

      <div className="mt-auto pt-5">
        <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-400">
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {event.registeredCount} / {event.capacity} registered
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-rose-500' : 'bg-indigo-500'}`}
            style={{ width: `${fillPercent}%` }}
          />
        </div>
      </div>
    </button>
  );
}
