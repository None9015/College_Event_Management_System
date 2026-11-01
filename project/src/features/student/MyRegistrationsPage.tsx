import { useCallback, useEffect, useState } from 'react';
import { BellRing, Loader2, QrCode, Ticket } from 'lucide-react';
import CategoryBadge from '@/components/events/CategoryBadge';
import DigitalPass from '@/components/tickets/DigitalPass';
import Modal from '@/components/ui/Modal';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StatusStates';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { formatEventDate, formatRegistrationDate, formatTimeRange } from '@/lib/dates';
import { getEventStatus } from '@/lib/eventFilters';
import { cancelRegistration, getActionErrorMessage, listMyRegistrations } from '@/lib/eventService';
import { isStartingWithin24Hours } from '@/lib/reminders';
import type { RegistrationWithEvent } from '@/types/event';

export default function MyRegistrationsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [registrations, setRegistrations] = useState<RegistrationWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [passId, setPassId] = useState<string | null>(null);
  const userId = user?.id ?? null;

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const rows = await listMyRegistrations(userId);
      setRegistrations(rows.filter((row) => row.events !== null));
    } catch (err) {
      console.error('load registrations failed', err);
      setError('We could not load your registrations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCancel = async (registrationId: string) => {
    setCancellingId(registrationId);
    try {
      await cancelRegistration(registrationId);
      showToast('Your registration has been cancelled.');
      setConfirmingId(null);
      await load();
    } catch (err) {
      console.error('cancel registration failed', err);
      showToast(getActionErrorMessage(err), 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const sorted = [...registrations].sort((a, b) => (a.events?.event_date ?? '').localeCompare(b.events?.event_date ?? ''));
  const startingSoonCount = sorted.filter(
    (row) => row.events && getEventStatus(row.events) === 'upcoming' && isStartingWithin24Hours(row.events),
  ).length;
  const passRegistration = sorted.find((row) => row.id === passId) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-50">My registrations</h2>
        <p className="mt-1 text-sm text-slate-400">Events you have signed up for, with your digital pass for each one.</p>
      </div>

      {startingSoonCount > 0 && (
        <div role="status" className="flex items-center gap-3 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-5 py-4">
          <BellRing className="h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
          <p className="text-sm font-semibold text-amber-100">
            {startingSoonCount === 1 ? '1 of your events starts within 24 hours.' : `${startingSoonCount} of your events start within 24 hours.`}
          </p>
        </div>
      )}

      {loading ? (
        <LoadingState label="Loading your registrations..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : registrations.length === 0 ? (
        <EmptyState
          title="No registrations yet"
          description="You have not registered for any events yet. Browse upcoming events to reserve your seat."
          icon={<Ticket className="h-7 w-7" aria-hidden="true" />}
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {sorted.map((registration) => (
            <RegistrationCard
              key={registration.id}
              registration={registration}
              confirming={confirmingId === registration.id}
              cancelling={cancellingId === registration.id}
              onViewPass={() => setPassId(registration.id)}
              onStartCancel={() => setConfirmingId(registration.id)}
              onKeep={() => setConfirmingId(null)}
              onConfirmCancel={() => void handleCancel(registration.id)}
            />
          ))}
        </ul>
      )}

      <Modal
        open={passRegistration !== null && passRegistration.events !== null}
        onClose={() => setPassId(null)}
        title="Digital pass"
        description="Show this QR code or ticket code at the venue door."
        size="lg"
      >
        {passRegistration?.events && <DigitalPass registration={passRegistration} event={passRegistration.events} />}
      </Modal>
    </div>
  );
}

interface RegistrationCardProps {
  registration: RegistrationWithEvent;
  confirming: boolean;
  cancelling: boolean;
  onViewPass: () => void;
  onStartCancel: () => void;
  onKeep: () => void;
  onConfirmCancel: () => void;
}

function RegistrationCard({
  registration,
  confirming,
  cancelling,
  onViewPass,
  onStartCancel,
  onKeep,
  onConfirmCancel,
}: RegistrationCardProps) {
  const event = registration.events;
  if (!event) return null;
  const isCompleted = getEventStatus(event) === 'completed';
  const startsSoon = !isCompleted && isStartingWithin24Hours(event);

  return (
    <li className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-black/20 backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:border-indigo-500/50 hover:shadow-[0_0_25px_rgba(99,102,241,0.15)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <CategoryBadge category={event.category} />
        {isCompleted ? (
          <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300">Completed</span>
        ) : startsSoon ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-2.5 py-1 text-xs font-bold text-amber-300 ring-1 ring-inset ring-amber-400/40">
            <BellRing className="h-3.5 w-3.5" aria-hidden="true" />
            Starts Tomorrow!
          </span>
        ) : (
          <span className="rounded-full bg-indigo-500/15 px-2.5 py-1 text-xs font-semibold text-indigo-300 ring-1 ring-inset ring-indigo-400/30">Upcoming</span>
        )}
      </div>
      <h3 className="text-base font-bold text-slate-50">{event.title}</h3>
      <p className="mt-2 text-sm text-slate-300">
        {formatEventDate(event.event_date)} · {formatTimeRange(event.start_time, event.end_time)}
      </p>
      <p className="text-sm text-slate-400">{event.venue}</p>
      <p className="mt-3 text-xs font-medium text-slate-500">Registered on {formatRegistrationDate(registration.created_at)}</p>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-800 pt-4">
        <button
          type="button"
          onClick={onViewPass}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-500/15 px-3 text-sm font-semibold text-indigo-200 ring-1 ring-inset ring-indigo-400/30 transition hover:bg-indigo-500/25"
        >
          <QrCode className="h-4 w-4" aria-hidden="true" />
          View pass
        </button>

        {!isCompleted &&
          (confirming ? (
            <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
              <p className="mr-auto text-sm font-medium text-slate-300">Cancel this registration?</p>
              <button
                type="button"
                onClick={onKeep}
                disabled={cancelling}
                className="h-9 rounded-lg px-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
              >
                Keep
              </button>
              <button
                type="button"
                onClick={onConfirmCancel}
                disabled={cancelling}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-rose-600 px-3 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-70"
              >
                {cancelling && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
                Yes, cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onStartCancel}
              className="ml-auto text-sm font-semibold text-rose-400 transition hover:text-rose-300"
            >
              Cancel registration
            </button>
          ))}
      </div>
    </li>
  );
}
