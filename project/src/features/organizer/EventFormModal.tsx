import { useState, type FormEvent, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/context/ToastContext';
import { createEvent, updateEvent } from '@/lib/eventService';
import { EVENT_CATEGORIES, type EventCategory, type EventInput, type EventWithCount } from '@/types/event';

interface EventFormModalProps {
  open: boolean;
  event: EventWithCount | null;
  onClose: () => void;
  onSaved: () => void;
}

interface FormValues {
  title: string;
  description: string;
  category: EventCategory;
  event_date: string;
  start_time: string;
  end_time: string;
  venue: string;
  capacity: string;
}

const EMPTY_VALUES: FormValues = {
  title: '',
  description: '',
  category: 'Technical',
  event_date: '',
  start_time: '',
  end_time: '',
  venue: '',
  capacity: '',
};

const inputClass =
  'h-11 w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3.5 text-sm text-slate-100 shadow-sm transition placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:opacity-60';

function valuesFromEvent(event: EventWithCount | null): FormValues {
  if (!event) return EMPTY_VALUES;
  return {
    title: event.title,
    description: event.description,
    category: event.category,
    event_date: event.event_date,
    start_time: event.start_time.slice(0, 5),
    end_time: event.end_time ? event.end_time.slice(0, 5) : '',
    venue: event.venue,
    capacity: String(event.capacity),
  };
}

function validate(values: FormValues, registeredCount: number): { input?: EventInput; error?: string } {
  const title = values.title.trim();
  const venue = values.venue.trim();
  const capacity = Number(values.capacity);

  if (!title) return { error: 'Please give the event a name.' };
  if (!values.event_date) return { error: 'Please choose a date.' };
  if (!values.start_time) return { error: 'Please choose a start time.' };
  if (values.end_time && values.end_time <= values.start_time) {
    return { error: 'The end time must be after the start time.' };
  }
  if (!venue) return { error: 'Please enter a venue.' };
  if (!Number.isInteger(capacity) || capacity < 1) {
    return { error: 'Capacity must be a whole number of at least 1.' };
  }
  if (capacity < registeredCount) {
    return { error: `Capacity cannot be lower than the ${registeredCount} students already registered.` };
  }

  return {
    input: {
      title,
      description: values.description.trim(),
      category: values.category,
      event_date: values.event_date,
      start_time: values.start_time,
      end_time: values.end_time || null,
      venue,
      capacity,
    },
  };
}

export default function EventFormModal({ open, event, onClose, onSaved }: EventFormModalProps) {
  if (!open) return null;
  const isEditing = event !== null;
  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={isEditing ? 'Edit event' : 'Create new event'}
      description={isEditing ? 'Update the details students see on the event page.' : 'Publish a new event for students to discover and register for.'}
    >
      <EventForm key={event?.id ?? 'new'} event={event} onClose={onClose} onSaved={onSaved} />
    </Modal>
  );
}

function EventForm({ event, onClose, onSaved }: { event: EventWithCount | null; onClose: () => void; onSaved: () => void }) {
  const { showToast } = useToast();
  const [values, setValues] = useState<FormValues>(() => valuesFromEvent(event));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (patch: Partial<FormValues>) => setValues((current) => ({ ...current, ...patch }));

  const handleSubmit = async (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    const result = validate(values, event?.registeredCount ?? 0);
    if (!result.input) {
      setError(result.error ?? 'Please check the form and try again.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      if (event) {
        await updateEvent(event.id, result.input);
        showToast('Event updated successfully.');
      } else {
        await createEvent(result.input);
        showToast('Event published successfully.');
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error('save event failed', err);
      setError('Could not save the event. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <Field label="Event name">
        <input
          type="text"
          value={values.title}
          maxLength={150}
          onChange={(e) => update({ title: e.target.value })}
          disabled={submitting}
          placeholder="e.g. Annual Hackathon"
          className={inputClass}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Category">
          <select
            value={values.category}
            onChange={(e) => update({ category: e.target.value as EventCategory })}
            disabled={submitting}
            className={inputClass}
          >
            {EVENT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Venue">
          <input
            type="text"
            value={values.venue}
            maxLength={150}
            onChange={(e) => update({ venue: e.target.value })}
            disabled={submitting}
            placeholder="e.g. Main Auditorium"
            className={inputClass}
          />
        </Field>
        <Field label="Date">
          <input
            type="date"
            value={values.event_date}
            onChange={(e) => update({ event_date: e.target.value })}
            disabled={submitting}
            className={inputClass}
          />
        </Field>
        <Field label="Capacity">
          <input
            type="number"
            min={1}
            step={1}
            value={values.capacity}
            onChange={(e) => update({ capacity: e.target.value })}
            disabled={submitting}
            placeholder="e.g. 100"
            className={inputClass}
          />
        </Field>
        <Field label="Start time">
          <input
            type="time"
            value={values.start_time}
            onChange={(e) => update({ start_time: e.target.value })}
            disabled={submitting}
            className={inputClass}
          />
        </Field>
        <Field label="End time (optional)">
          <input
            type="time"
            value={values.end_time}
            onChange={(e) => update({ end_time: e.target.value })}
            disabled={submitting}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Description">
        <textarea
          rows={4}
          value={values.description}
          maxLength={2000}
          onChange={(e) => update({ description: e.target.value })}
          disabled={submitting}
          placeholder="What will students experience? Who should attend?"
          className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900/70 px-3.5 py-3 text-sm leading-6 text-slate-100 shadow-sm transition placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
        />
      </Field>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-200">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="h-11 rounded-xl px-5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-slate-100 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {event ? 'Save changes' : 'Publish event'}
        </button>
      </div>
    </form>
  );
}

function Field({ label, className = '', children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-sm font-semibold text-slate-300">{label}</span>
      {children}
    </label>
  );
}
