import { useState } from 'react';
import { Check, Loader2, Send, Trash2, X } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import {
  deleteTeamListing,
  getActionErrorMessage,
  requestToJoin,
  respondToJoinRequest,
  withdrawJoinRequest,
} from '@/lib/eventService';
import type { JoinRequestStatus, TeamJoinRequest, TeamListing } from '@/types/event';

interface TeamListingCardProps {
  listing: TeamListing;
  requests: TeamJoinRequest[];
  isOwner: boolean;
  myRequest?: TeamJoinRequest | null;
  onChanged: () => void;
}

const STATUS_LABELS: Record<JoinRequestStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-400/15 text-amber-300 ring-amber-400/30' },
  accepted: { label: 'Accepted', className: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30' },
  declined: { label: 'Declined', className: 'bg-slate-700/60 text-slate-300 ring-slate-500/40' },
};

export default function TeamListingCard({ listing, requests, isOwner, myRequest = null, onChanged }: TeamListingCardProps) {
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [composing, setComposing] = useState(false);
  const [message, setMessage] = useState('');
  const [confirmingClose, setConfirmingClose] = useState(false);

  const run = async (action: () => Promise<void>, successText: string) => {
    setBusy(true);
    try {
      await action();
      showToast(successText);
      onChanged();
    } catch (err) {
      console.error('team action failed', err);
      showToast(getActionErrorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleRequest = () => run(async () => {
    await requestToJoin(listing.id, message.trim());
    setComposing(false);
    setMessage('');
  }, 'Request sent. The team owner will respond soon.');

  return (
    <article className="flex h-full flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-black/20 backdrop-blur-md transition duration-300 hover:border-indigo-500/50 hover:shadow-[0_0_25px_rgba(99,102,241,0.15)]">
      <div className="min-w-0 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-400">
            {isOwner ? 'Posted by you' : `Posted by ${listing.owner_name}`}
          </p>
          {isOwner && (
            <span className="rounded-full bg-indigo-500/15 px-2.5 py-1 text-xs font-semibold text-indigo-300 ring-1 ring-inset ring-indigo-400/30">
              {requests.length} {requests.length === 1 ? 'request' : 'requests'}
            </span>
          )}
        </div>
        <h4 className="text-base font-bold leading-snug text-slate-50">{listing.title}</h4>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tech stack</dt>
            <dd className="mt-0.5 text-slate-200">{listing.tech_stack}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Looking for</dt>
            <dd className="mt-0.5 text-slate-200">{listing.skills_needed}</dd>
          </div>
        </dl>
      </div>

      {isOwner ? (
        <div className="mt-auto space-y-3 border-t border-slate-800 pt-4">
          {requests.length === 0 ? (
            <p className="text-sm text-slate-400">No join requests yet.</p>
          ) : (
            <ul className="space-y-2">
              {requests.map((request) => (
                <li key={request.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-100">{request.requester_name}</p>
                    <StatusPill status={request.status} />
                  </div>
                  {request.message && <p className="mt-1.5 text-sm leading-6 text-slate-300">{request.message}</p>}
                  {request.status === 'pending' && (
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void run(() => respondToJoinRequest(request.id, 'accepted'), `${request.requester_name} has been added to your team.`)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
                      >
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        Accept
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void run(() => respondToJoinRequest(request.id, 'declined'), 'Request declined.')}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-slate-300 ring-1 ring-inset ring-slate-600 transition hover:bg-slate-800 disabled:opacity-60"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                        Decline
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          {confirmingClose ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <p className="mr-auto text-sm text-slate-300">Close this listing?</p>
              <button
                type="button"
                onClick={() => setConfirmingClose(false)}
                disabled={busy}
                className="h-8 rounded-lg px-3 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
              >
                Keep
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void run(() => deleteTeamListing(listing.id), 'Your team listing has been closed.')}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-rose-600 px-3 text-xs font-semibold text-white transition hover:bg-rose-500 disabled:opacity-60"
              >
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
                Yes, close
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingClose(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 transition hover:text-rose-300"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Close listing
            </button>
          )}
        </div>
      ) : (
        <div className="mt-auto border-t border-slate-800 pt-4">
          {myRequest ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                Your request: <StatusPill status={myRequest.status} />
              </div>
              {myRequest.status === 'pending' && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void run(() => withdrawJoinRequest(myRequest.id), 'Your request has been withdrawn.')}
                  className="text-xs font-semibold text-slate-400 transition hover:text-slate-100 disabled:opacity-60"
                >
                  Withdraw
                </button>
              )}
            </div>
          ) : composing ? (
            <div className="space-y-3">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Message (optional)</span>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  maxLength={300}
                  rows={2}
                  placeholder="Say hi and share what you can bring to the team"
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900/70 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
                />
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setComposing(false)}
                  disabled={busy}
                  className="h-9 rounded-lg px-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleRequest()}
                  disabled={busy}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-500 px-4 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-70"
                >
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Send className="h-3.5 w-3.5" aria-hidden="true" />}
                  Send request
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setComposing(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-500/15 px-3.5 text-sm font-semibold text-indigo-200 ring-1 ring-inset ring-indigo-400/30 transition hover:bg-indigo-500/25"
            >
              Request to join
            </button>
          )}
        </div>
      )}
    </article>
  );
}

function StatusPill({ status }: { status: JoinRequestStatus }) {
  const style = STATUS_LABELS[status];
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${style.className}`}>{style.label}</span>
  );
}
