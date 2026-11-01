import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import AuthModal from '@/components/auth/AuthModal';
import { useToast } from '@/context/ToastContext';
import { fetchProfile, signOutUser } from '@/lib/authService';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/auth';

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  isOrganizer: boolean;
  ready: boolean;
  profileError: string | null;
  openAuthModal: () => void;
  signOut: () => Promise<void>;
  reloadProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  const loadProfile = useCallback(async (userId: string) => {
    setProfileError(null);
    try {
      const loaded = await fetchProfile(userId);
      setProfile(loaded);
      if (!loaded) setProfileError('Your account profile could not be found. Please sign out and sign in again.');
    } catch (err) {
      console.error('profile load failed', err);
      setProfile(null);
      setProfileError('We could not load your account. Please try again.');
    }
  }, []);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        const nextUser = session?.user ?? null;
        setUser(nextUser);
        if (nextUser) {
          await loadProfile(nextUser.id);
        } else {
          setProfile(null);
          setProfileError(null);
        }
        setReady(true);
      })();
    });
    return () => data.subscription.unsubscribe();
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    try {
      await signOutUser();
      showToast('You have signed out.');
    } catch (err) {
      console.error('sign out failed', err);
      showToast('Could not sign out. Please try again.', 'error');
    }
  }, [showToast]);

  const reloadProfile = useCallback(async () => {
    if (user) await loadProfile(user.id);
  }, [user, loadProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      isOrganizer: profile?.role === 'organizer',
      ready,
      profileError,
      openAuthModal: () => setAuthOpen(true),
      signOut,
      reloadProfile,
    }),
    [user, profile, ready, profileError, signOut, reloadProfile],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
