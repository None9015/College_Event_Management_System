import { useState, type FormEvent } from 'react';
import { Loader2, Megaphone } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { createTeamListing, getActionErrorMessage } from '@/lib/eventService';

interface TeamListingFormProps {
  eventId: string;
  onPosted: () => void;
}

const inputClass =
  'w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 transition focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20';

export default function TeamListingForm({ eventId, onPosted }: TeamListingFormProps) {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [techStack, setTechStack] = useState('');
  const [skillsNeeded, setSkillsNeeded] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = { title: title.trim(), techStack: techStack.trim(), skillsNeeded: skillsNeeded.trim() };
    if (input.title.length < 3 || input.techStack.length < 2 || input.skillsNeeded.length < 2) {
      setError('Add a headline, your tech stack, and the skills you need.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await createTeamListing(eventId, input);
      showToast('Your team listing is live.');
      onPosted();
    } catch (err) {
      console.error('create team listing failed', err);
      setError(getActionErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md"
    >
      <div>
        <h4 className="flex items-center gap-2 text-base font-bold text-slate-50">
          <Megaphone className="h-4 w-4 text-indigo-400" aria-hidden="true" />
          Post a "Looking for Teammates" listing
        </h4>
        <p className="mt-1 text-sm text-slate-400">Tell other registered students what you bring and who you need.</p>
      </div>

      <label className="block space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Headline</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={80}
          placeholder="e.g. Solo dev looking for a designer and a backend engineer"
          className={inputClass}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Your tech stack</span>
        <input
          value={techStack}
          onChange={(event) => setTechStack(event.target.value)}
          maxLength={200}
          placeholder="e.g. React, Node.js, Figma"
          className={inputClass}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Skills you need</span>
        <input
          value={skillsNeeded}
          onChange={(event) => setSkillsNeeded(event.target.value)}
          maxLength={200}
          placeholder="e.g. Machine learning, UI design"
          className={inputClass}
        />
      </label>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-200">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {submitting ? 'Posting...' : 'Post listing'}
      </button>
    </form>
  );
}
