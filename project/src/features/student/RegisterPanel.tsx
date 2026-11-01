import { useState } from 'react';
import { CheckCircle2, Loader2, LogIn, Send } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getActionErrorMessage, registerForEvent } from '@/lib/eventService';
import type { Registration } from '@/types/event';

interface RegisterPanelProps {
  eventId: string;
  onRegistered: (registration: Registration) => void;
}

export default function RegisterPanel({ eventId, onRegistered }: RegisterPanelProps) {
  const { user, profile, profileError, openAuthModal } = useAuth();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-2xl border border-slate-700 bg-slate-950/50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-slate-300">Sign in with your student account to reserve a seat.</p>
        <button
          type="button"
          onClick={openAuthModal}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-indigo-500 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400"
        >
          <LogIn className="h-4 w-4" aria-hidden="true" />
          Sign in to register
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <p role="alert" className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm font-medium text-rose-200">
        {profileError ?? 'Your account profile is unavailable right now, so registration is paused.'}
      </p>
    );
  }

  const handleRegister = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const registration = await registerForEvent(eventId);
      showToast('Successfully registered! Your digital pass is ready under My registrations.');
      onRegistered(registration);
    } catch (err) {
      console.error('registration failed', err);
      setError(getActionErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-300">
        Registering as <span className="font-semibold text-slate-50">{profile.full_name}</span> · Roll no.{' '}
        <span className="font-semibold text-slate-50">{profile.roll_no}</span>
      </p>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-200">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => void handleRegister()}
        disabled={submitting}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:-translate-y-0.5 hover:bg-indigo-400 hover:shadow-xl active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Registering...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" aria-hidden="true" />
            Register for this event
          </>
        )}
      </button>
      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
        <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" aria-hidden="true" />
        Your registration is saved to your account.
      </p>
    </div>
  );
}
