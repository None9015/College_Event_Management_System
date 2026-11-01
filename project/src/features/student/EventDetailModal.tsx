import { useState, type ReactNode } from 'react';
import { CalendarDays, CheckCircle2, Clock, MapPin, Users } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import CategoryBadge from '@/components/events/CategoryBadge';
import RegisterPanel from '@/features/student/RegisterPanel';
import TeamFormationPanel from '@/features/student/team/TeamFormationPanel';
import { formatEventDate, formatTimeRange } from '@/lib/dates';
import { getEventStatus, getSpotsLeft } from '@/lib/eventFilters';
import type { EventWithCount, Registration } from '@/types/event';

interface EventDetailModalProps {
  event: EventWithCount | null;
  onClose: () => void;
  onRegistered: (registration: Registration) => void;
}

type DetailTab = 'details' | 'teams';

export default function EventDetailModal({ event, onClose, onRegistered }: EventDetailModalProps) {
  if (!event) return null;
  return (
    <Modal open onClose={onClose} title={event.title} size="lg">
      <EventDetailBody key={event.id} event={event} onRegistered={onRegistered} />
    </Modal>
  );
}

function EventDetailBody({ event, onRegistered }: { event: EventWithCount; onRegistered: (registration: Registration) => void }) {
  const [justRegistered, setJustRegistered] = useState(false);
  const [tab, setTab] = useState<DetailTab>('details');
  const status = getEventStatus(event);
  const spotsLeft = getSpotsLeft(event);
  const isCompleted = status === 'completed';
  const isFull = spotsLeft === 0;
  const isHackathon = event.category === 'Hackathons';
  const fillPercent = Math.min((event.registeredCount / event.capacity) * 100, 100);

  const handleRegistered = (registration: Registration) => {
    setJustRegistered(true);
    onRegistered(registration);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <CategoryBadge category={event.category} />
        {isCompleted && (
          <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300">Completed</span>
        )}
      </div>

      {isHackathon && (
        <div role="tablist" aria-label="Event sections" className="inline-flex rounded-xl border border-slate-800 bg-slate-950/60 p-1">
          <TabButton active={tab === 'details'} onClick={() => setTab('details')}>
            Details
          </TabButton>
          <TabButton active={tab === 'teams'} onClick={() => setTab('teams')}>
            Team formation
          </TabButton>
        </div>
      )}

      {tab === 'teams' && isHackathon ? (
        <TeamFormationPanel eventId={event.id} />
      ) : (
        <>
          <p className="whitespace-pre-line text-sm leading-6 text-slate-300">{event.description || 'No description provided.'}</p>

          <dl className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-4 sm:grid-cols-2">
            <DetailItem icon={<CalendarDays className="h-4 w-4" />} label="Date" value={formatEventDate(event.event_date)} />
            <DetailItem icon={<Clock className="h-4 w-4" />} label="Time" value={formatTimeRange(event.start_time, event.end_time)} />
            <DetailItem icon={<MapPin className="h-4 w-4" />} label="Venue" value={event.venue} />
            <DetailItem icon={<Users className="h-4 w-4" />} label="Capacity" value={`${event.registeredCount} of ${event.capacity} registered`}>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-rose-500' : 'bg-indigo-500'}`}
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
            </DetailItem>
          </dl>

          <section aria-label="Registration">
            {justRegistered ? (
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-300" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold text-emerald-100">You are registered</h3>
                  <p className="mt-1 text-sm leading-6 text-emerald-200/90">
                    Your digital pass is waiting under My registrations.
                  </p>
                </div>
              </div>
            ) : isCompleted ? (
              <NoticeBox tone="neutral" text="This event has already taken place, so registration is closed." />
            ) : isFull ? (
              <NoticeBox tone="error" text="Sorry, this event is fully booked." />
            ) : (
              <>
                <h3 className="mb-4 text-base font-bold text-slate-50">Reserve your seat</h3>
                <RegisterPanel eventId={event.id} onRegistered={handleRegistered} />
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
        active ? 'bg-indigo-500/20 text-indigo-200 shadow-sm' : 'text-slate-400 hover:text-slate-100'
      }`}
    >
      {children}
    </button>
  );
}

function DetailItem({
  icon,
  label,
  value,
  children,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  children?: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <span className="text-indigo-400">{icon}</span>
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-slate-100">{value}</dd>
      {children}
    </div>
  );
}

function NoticeBox({ tone, text }: { tone: 'neutral' | 'error'; text: string }) {
  const styles =
    tone === 'error'
      ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
      : 'border-slate-700 bg-slate-950/50 text-slate-300';
  return <p className={`rounded-2xl border px-5 py-4 text-sm font-medium ${styles}`}>{text}</p>;
}
