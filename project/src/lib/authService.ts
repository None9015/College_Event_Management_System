import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/auth';

export interface SignUpInput {
  fullName: string;
  rollNo: string;
  email: string;
  password: string;
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message.toLowerCase().includes('invalid login') ? 'INVALID_CREDENTIALS' : error.message);
}

export async function signUpWithEmail({ fullName, rollNo, email, password }: SignUpInput): Promise<boolean> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, roll_no: rollNo } },
  });
  if (error) throw new Error(error.message);
  return data.session !== null;
}

export async function signOutUser(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, roll_no, role')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (data === null) return null;
  if (typeof data !== 'object' || !('role' in data)) throw new Error('Unexpected profile response.');
  return data as Profile;
}
