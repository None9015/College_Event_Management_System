import { AlertTriangle, CalendarX2, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-300" aria-hidden="true" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-300">
        {icon ?? <CalendarX2 className="h-7 w-7" aria-hidden="true" />}
      </div>
      <h3 className="text-base font-semibold text-slate-50">{title}</h3>
      <p className="mt-1 max-w-sm text-sm leading-6 text-slate-400">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-6 py-12 text-center">
      <AlertTriangle className="h-8 w-8 text-rose-400" aria-hidden="true" />
      <p className="max-w-md text-sm font-medium leading-6 text-rose-200">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"
        >
          Try again
        </button>
      )}
    </div>
  );
}
