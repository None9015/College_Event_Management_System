import { useState, type FormEvent, type ReactNode } from 'react';
import { Loader2, LogIn, UserPlus } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { useToast } from '@/context/ToastContext';
import { signInWithEmail, signUpWithEmail } from '@/lib/authService';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

type AuthMode = 'signin' | 'signup';

const MODE_OPTIONS: { value: AuthMode; label: string }[] = [
  { value: 'signin', label: 'Sign in' },
  { value: 'signup', label: 'Create account' },
];

const MIN_PASSWORD_LENGTH = 8;

const inputClass =
  'h-11 w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3.5 text-sm text-slate-100 shadow-sm transition placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:opacity-60';

export default function AuthModal({ open, onClose }: AuthModalProps) {
  if (!open) return null;
  return (
    <Modal open onClose={onClose} title="Welcome to Campus Events" description="Sign in to register for events and manage your bookings.">
      <AuthForm onClose={onClose} />
    </Modal>
  );
}

function AuthForm({ onClose }: { onClose: () => void }) {
  const { showToast } = useToast();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [fullName, setFullName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
    setNotice(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = fullName.trim();
    const trimmedRoll = rollNo.trim();

    if (!trimmedEmail.includes('@')) return setError('Please enter a valid email address.');
    if (password.length < MIN_PASSWORD_LENGTH) {
      return setError(`Your password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    }
    if (mode === 'signup' && (!trimmedName || !trimmedRoll)) {
      return setError('Please enter your full name and roll number.');
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === 'signin') {
        await signInWithEmail(trimmedEmail, password);
        showToast('Welcome back! You are signed in.');
        onClose();
      } else {
        const hasSession = await signUpWithEmail({
          fullName: trimmedName,
          rollNo: trimmedRoll,
          email: trimmedEmail,
          password,
        });
        if (hasSession) {
          showToast('Account created. Welcome to Campus Events!');
          onClose();
        } else {
          setNotice('Account created. Check your inbox to confirm your email, then sign in.');
          setMode('signin');
        }
      }
    } catch (err) {
      console.error('auth failed', err);
      setError(getAuthErrorMessage(mode, err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SegmentedControl label="Authentication mode" options={MODE_OPTIONS} value={mode} onChange={switchMode} />

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {mode === 'signup' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <input
                type="text"
                autoComplete="name"
                maxLength={120}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={submitting}
                placeholder="Ada Lovelace"
                className={inputClass}
              />
            </Field>
            <Field label="Roll number">
              <input
                type="text"
                maxLength={40}
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                disabled={submitting}
                placeholder="21CS045"
                className={inputClass}
              />
            </Field>
          </div>
        )}
        <Field label="College email">
          <input
            type="email"
            autoComplete="email"
            maxLength={255}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            placeholder="you@college.edu"
            className={inputClass}
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            maxLength={72}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
            className={inputClass}
          />
        </Field>

        {error && (
          <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-200">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-300">
            {notice}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:-translate-y-0.5 hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : mode === 'signin' ? (
            <LogIn className="h-4 w-4" aria-hidden="true" />
          ) : (
            <UserPlus className="h-4 w-4" aria-hidden="true" />
          )}
          {mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
      </form>
    </div>
  );
}

function getAuthErrorMessage(mode: AuthMode, err: unknown): string {
  if (mode === 'signin' && err instanceof Error && err.message === 'INVALID_CREDENTIALS') {
    return 'Email or password is incorrect.';
  }
  if (mode === 'signup') {
    return 'We could not create your account. Check your details and try again, or sign in if you already have one.';
  }
  return 'We could not sign you in right now. Please try again.';
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-slate-300">{label}</span>
      {children}
    </label>
  );
}
