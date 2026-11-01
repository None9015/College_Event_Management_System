import { GraduationCap, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface NavItem<T extends string> {
  value: T;
  label: string;
}

interface HeaderProps<T extends string> {
  items: NavItem<T>[];
  active: T;
  onNavigate: (value: T) => void;
}

export default function Header<T extends string>({ items, active, onNavigate }: HeaderProps<T>) {
  const { user, profile, isOrganizer, ready, signOut, openAuthModal } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/30">
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
            </div>
            <span className="text-base font-bold tracking-tight text-slate-50 sm:text-lg">EventHive</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {!ready ? (
              <div className="h-9 w-24 animate-pulse rounded-xl bg-slate-800" aria-hidden="true" />
            ) : user ? (
              <>
                <div className="hidden min-w-0 items-center gap-2.5 sm:flex">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-sm font-bold text-indigo-200 ring-1 ring-inset ring-indigo-400/30">
                    {getInitials(profile?.full_name ?? user.email ?? '')}
                  </div>
                  <div className="min-w-0 leading-tight">
                    <p className="truncate text-sm font-semibold text-slate-100">{profile?.full_name ?? user.email}</p>
                    <p className="text-xs font-medium text-slate-400">{isOrganizer ? 'Organizer' : 'Student'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-slate-50"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={openAuthModal}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-indigo-500 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Sign in
              </button>
            )}
          </div>
        </div>

        <nav aria-label="Main" className="-mx-1 flex gap-1 overflow-x-auto pb-0.5">
          {items.map((item) => {
            const isActive = item.value === active;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onNavigate(item.value)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-indigo-500/15 text-indigo-300 ring-1 ring-inset ring-indigo-400/30'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
