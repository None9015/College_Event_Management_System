import { useState, type ReactNode } from 'react';
import { Lock, LogIn } from 'lucide-react';
import Header from '@/components/layout/Header';
import { EmptyState } from '@/components/ui/StatusStates';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import AboutPage from '@/features/about/AboutPage';
import OrganizerDashboard from '@/features/organizer/OrganizerDashboard';
import DiscoverEventsPage from '@/features/student/DiscoverEventsPage';
import MyRegistrationsPage from '@/features/student/MyRegistrationsPage';
import { useStartingSoonReminders } from '@/hooks/useStartingSoonReminders';

type View = 'discover' | 'registrations' | 'dashboard' | 'about';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ToastProvider>
  );
}

function AppShell() {
  const { user, ready, isOrganizer, profileError, openAuthModal, reloadProfile } = useAuth();
  const [view, setView] = useState<View>('discover');
  useStartingSoonReminders(user?.id ?? null);

  const navItems: { value: View; label: string }[] = [
    { value: 'discover', label: 'Discover events' },
    { value: 'about', label: 'About' },
    ...(user ? [{ value: 'registrations' as const, label: 'My registrations' }] : []),
    ...(isOrganizer ? [{ value: 'dashboard' as const, label: 'Organizer dashboard' }] : []),
  ];

  const activeView = navItems.some((item) => item.value === view) ? view : 'discover';

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-950 font-sans text-slate-100 antialiased">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute right-[-10rem] top-1/3 h-[30rem] w-[30rem] rounded-full bg-violet-600/15 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-1/3 h-[26rem] w-[26rem] rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative">
        <Header items={navItems} active={activeView} onNavigate={setView} />
        <main key={activeView} className="animate-fade-in mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          {activeView === 'discover' && <DiscoverEventsPage />}
          {activeView === 'about' && <AboutPage onExplore={() => setView('discover')} />}
          {activeView === 'registrations' &&
            (!ready ? null : user ? (
              profileError ? (
                <EmptyState
                  title="Account unavailable"
                  description={profileError}
                  action={<PrimaryButton onClick={() => void reloadProfile()}>Try again</PrimaryButton>}
                />
              ) : (
                <MyRegistrationsPage />
              )
            ) : (
              <EmptyState
                title="Sign in to see your registrations"
                description="Your registrations are linked to your account, so you need to sign in to view them."
                icon={<LogIn className="h-7 w-7" aria-hidden="true" />}
                action={<PrimaryButton onClick={openAuthModal}>Sign in</PrimaryButton>}
              />
            ))}
          {activeView === 'dashboard' &&
            (isOrganizer ? (
              <OrganizerDashboard />
            ) : (
              <EmptyState
                title="Organizer access only"
                description="This dashboard is available to organizer accounts. Contact the events office if you need organizer access."
                icon={<Lock className="h-7 w-7" aria-hidden="true" />}
              />
            ))}
        </main>
      </div>
    </div>
  );
}

function PrimaryButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-500 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:-translate-y-0.5 hover:bg-indigo-400"
    >
      {children}
    </button>
  );
}
