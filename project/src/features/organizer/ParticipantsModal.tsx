import { useEffect, useState, type FormEvent } from 'react';
import { Check, Download, Search, Users } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StatusStates';
import { useToast } from '@/context/ToastContext';
import { downloadCsv, toCsvFilename } from '@/lib/csv';
import { formatRegistrationDate } from '@/lib/dates';
import { checkInRegistration, getActionErrorMessage, listParticipants } from '@/lib/eventService';
import { getTicketCode } from '@/lib/tickets';
import type { EventWithCount, Registration } from '@/types/event';

interface ParticipantsModalProps {
  event: EventWithCount | null;
  onClose: () => void;
}

export default function ParticipantsModal({ event, onClose }: ParticipantsModalProps) {
  if (!event) return null;
  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={`Participants: ${event.title}`}
      description={`${event.registeredCount} of ${event.capacity} seats taken`}
    >
      <ParticipantsList key={event.id} eventId={event.id} eventTitle={event.title} />
    </Modal>
  );
}

function ParticipantsList({ eventId, eventTitle }: { eventId: string; eventTitle: string }) {
  const { showToast } = useToast();
  const [participants, setParticipants] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [ticketCode, setTicketCode] = useState('');
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    listParticipants(eventId)
      .then((rows) => {
        if (active) setParticipants(rows);
      })
      .catch((err: unknown) => {
        console.error('load participants failed', err);
        if (active) setError('We could not load the participant list. Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [eventId, attempt]);

  if (loading) return <LoadingState label="Loading participants..." />;
  if (error) return <ErrorState message={error} onRetry={() => setAttempt((n) => n + 1)} />;
  if (participants.length === 0) {
    return (
      <EmptyState
        title="No participants yet"
        description="Students who register for this event will appear here with their details."
        icon={<Users className="h-7 w-7" aria-hidden="true" />}
      />
    );
  }

  const checkedInCount = participants.filter((p) => p.checked_in_at !== null).length;
  const normalizedQuery = query.trim().toLowerCase();
  const visible = normalizedQuery
    ? participants.filter(
        (p) =>
          p.student_name.toLowerCase().includes(normalizedQuery) ||
          p.student_email.toLowerCase().includes(normalizedQuery) ||
          p.roll_no.toLowerCase().includes(normalizedQuery),
      )
    : participants;

  const handleExport = () => {
    try {
      downloadCsv(
        toCsvFilename(eventTitle),
        ['Name', 'Email', 'Roll No', 'Registration Date'],
        participants.map((p) => [p.student_name, p.student_email, p.roll_no, formatRegistrationDate(p.created_at)]),
      );
      showToast(`Exported ${participants.length} ${participants.length === 1 ? 'participant' : 'participants'}.`);
    } catch (err) {
      console.error('csv export failed', err);
      showToast('Could not export the list. Please try again.', 'error');
    }
  };

  const checkIn = async (registrationId: string, name: string) => {
    setCheckingInId(registrationId);
    try {
      await checkInRegistration(registrationId);
      showToast(`${name} is checked in.`);
      setAttempt((n) => n + 1);
    } catch (err) {
      console.error('check in failed', err);
      showToast(getActionErrorMessage(err), 'error');
    } finally {
      setCheckingInId(null);
    }
  };

  const handleVerify = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = ticketCode.replace(/\s+/g, '').toUpperCase();
    if (!code) return;
    const match = participants.find((p) => getTicketCode(p.id) === code);
    if (!match) {
      showToast('No participant matches that ticket code.', 'error');
      return;
    }
    if (match.checked_in_at) {
      showToast(`${match.student_name} is already checked in.`);
      return;
    }
    setTicketCode('');
    void checkIn(match.id, match.student_name);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
        <form onSubmit={handleVerify} className="flex gap-2" aria-label="Verify digital pass">
          <input
            value={ticketCode}
            onChange={(event) => setTicketCode(event.target.value)}
            maxLength={12}
            placeholder="Ticket code, e.g. 3F9A1C2B"
            aria-label="Ticket code"
            className="h-11 min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900/70 px-3.5 font-mono text-sm uppercase tracking-widest text-slate-100 placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
          />
          <button
            type="submit"
            disabled={!ticketCode.trim() || checkingInId !== null}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-indigo-500 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            Verify pass
          </button>
        </form>
        <div className="flex items-center justify-between gap-3 lg:justify-end">
          <p className="text-sm font-semibold text-emerald-300">
            {checkedInCount} of {participants.length} checked in
          </p>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-4 text-sm font-semibold text-slate-100 transition hover:-translate-y-0.5 hover:border-indigo-500/50 hover:bg-slate-800"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export to CSV
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by name, roll no or email"
          aria-label="Filter participants"
          className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900/70 pl-10 pr-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
        />
      </div>

      {visible.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">No participants match “{query}”.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/50 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <tr>
                <th scope="col" className="px-4 py-3">Student</th>
                <th scope="col" className="hidden px-4 py-3 sm:table-cell">Roll no</th>
                <th scope="col" className="hidden px-4 py-3 md:table-cell">Email</th>
                <th scope="col" className="px-4 py-3">Registered</th>
                <th scope="col" className="px-4 py-3 text-right">Attendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900/40">
              {visible.map((participant) => {
                const checkedIn = participant.checked_in_at !== null;
                return (
                  <tr key={participant.id} className="transition hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-100">{participant.student_name}</p>
                      <p className="text-xs text-slate-400 sm:hidden">{participant.roll_no}</p>
                      <p className="break-all text-xs text-slate-400 md:hidden">{participant.student_email}</p>
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-slate-300 sm:table-cell">{participant.roll_no}</td>
                    <td className="hidden break-all px-4 py-3 text-slate-300 md:table-cell">{participant.student_email}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-300">{formatRegistrationDate(participant.created_at)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {checkedIn ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-400/30">
                          <Check className="h-3 w-3" aria-hidden="true" />
                          Checked in
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void checkIn(participant.id, participant.student_name)}
                          disabled={checkingInId === participant.id}
                          className="h-8 rounded-lg bg-slate-800 px-3 text-xs font-semibold text-slate-100 ring-1 ring-inset ring-slate-600 transition hover:bg-slate-700 disabled:opacity-60"
                        >
                          {checkingInId === participant.id ? 'Checking in...' : 'Check in'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
