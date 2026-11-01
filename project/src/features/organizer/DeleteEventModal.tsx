import { useState } from 'react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/context/ToastContext';
import { deleteEvent } from '@/lib/eventService';
import type { EventWithCount } from '@/types/event';

interface DeleteEventModalProps {
  event: EventWithCount | null;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeleteEventModal({ event, onClose, onDeleted }: DeleteEventModalProps) {
  const { showToast } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!event) return null;

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await deleteEvent(event.id);
      showToast('Event deleted.');
      onDeleted();
      onClose();
    } catch (err) {
      console.error('delete event failed', err);
      setError('Could not delete the event. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Delete this event?" description="This action cannot be undone.">
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" aria-hidden="true" />
          <div className="text-sm leading-6 text-rose-200">
            <p>
              <span className="font-semibold">{event.title}</span> will be removed for all students.
            </p>
            {event.registeredCount > 0 && (
              <p className="mt-1">
                The {event.registeredCount} {event.registeredCount === 1 ? 'registration' : 'registrations'} for this event will also be deleted.
              </p>
            )}
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-200">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="h-11 rounded-xl px-5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-slate-100 disabled:opacity-50"
          >
            Keep event
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 text-sm font-semibold text-white shadow-lg shadow-rose-600/20 transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
            Delete event
          </button>
        </div>
      </div>
    </Modal>
  );
}
