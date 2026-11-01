import { supabase } from '@/lib/supabase';
import type {
  EventInput,
  EventRow,
  EventWithCount,
  JoinRequestStatus,
  Registration,
  RegistrationWithEvent,
  TeamJoinRequest,
  TeamListing,
} from '@/types/event';

const ACTION_ERRORS: Record<string, string> = {
  NOT_AUTHENTICATED: 'Please sign in to continue.',
  NOT_AUTHORIZED: 'Only organizers can do that.',
  PROFILE_INCOMPLETE: 'Your account is missing your name or roll number. Please contact the organizers.',
  ALREADY_REGISTERED: 'You are already registered for this event.',
  EVENT_FULL: 'Sorry, this event has reached its capacity.',
  EVENT_CLOSED: 'This event has already taken place.',
  EVENT_NOT_FOUND: 'This event no longer exists.',
  REGISTRATION_NOT_FOUND: 'This registration no longer exists.',
  NOT_REGISTERED: 'Register for this event first to take part.',
  TEAMS_NOT_AVAILABLE: 'Team formation is only available for hackathons.',
  LISTING_NOT_FOUND: 'This team listing no longer exists.',
  OWN_LISTING: 'You cannot request to join your own team listing.',
  ALREADY_REQUESTED: 'You have already asked to join this team.',
};

const GENERIC_ERROR = 'Something went wrong. Please try again.';

export function getActionErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return GENERIC_ERROR;
  const match = Object.keys(ACTION_ERRORS).find((code) => error.message.includes(code));
  return match ? ACTION_ERRORS[match] : GENERIC_ERROR;
}

export async function listEvents(): Promise<EventWithCount[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) throw new Error(error.message);
  if (!Array.isArray(data)) throw new Error('Unexpected response while loading events.');

  return (data as EventRow[]).map(({ registered_count, ...event }) => ({
    ...event,
    registeredCount: registered_count,
  }));
}

export async function createEvent(input: EventInput): Promise<void> {
  const { error } = await supabase.from('events').insert(input);
  if (error) throw new Error(error.message);
}

export async function updateEvent(id: string, input: EventInput): Promise<void> {
  const { error } = await supabase
    .from('events')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function listParticipants(eventId: string): Promise<Registration[]> {
  const { data, error } = await supabase
    .from('registrations')
    .select('id, event_id, student_name, student_email, roll_no, created_at, checked_in_at')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  if (!Array.isArray(data)) throw new Error('Unexpected response while loading participants.');
  return data as Registration[];
}

export async function checkInRegistration(registrationId: string): Promise<string> {
  const { data, error } = await supabase.rpc('check_in_registration', { p_registration_id: registrationId });
  if (error) throw new Error(error.message);
  if (typeof data !== 'string') throw new Error('Unexpected response while checking in.');
  return data;
}

export async function registerForEvent(eventId: string): Promise<Registration> {
  const { data, error } = await supabase.rpc('register_for_event', { p_event_id: eventId });

  if (error) throw new Error(error.message);
  if (!data || typeof data !== 'object' || !('id' in data)) {
    throw new Error('Unexpected response while registering.');
  }
  return data as Registration;
}

export async function getMyRegistrationForEvent(eventId: string, userId: string): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from('registrations')
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function cancelRegistration(registrationId: string): Promise<void> {
  const { error } = await supabase.rpc('cancel_registration', { p_registration_id: registrationId });
  if (error) throw new Error(error.message);
}

export async function listMyRegistrations(userId: string): Promise<RegistrationWithEvent[]> {
  const { data, error } = await supabase
    .from('registrations')
    .select('id, event_id, student_name, student_email, roll_no, created_at, checked_in_at, events(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  if (!Array.isArray(data)) throw new Error('Unexpected response while loading registrations.');
  return data as unknown as RegistrationWithEvent[];
}

export async function listTeamListings(eventId: string): Promise<TeamListing[]> {
  const { data, error } = await supabase
    .from('team_listings')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  if (!Array.isArray(data)) throw new Error('Unexpected response while loading teams.');
  return data as TeamListing[];
}

export async function createTeamListing(
  eventId: string,
  input: { title: string; techStack: string; skillsNeeded: string },
): Promise<TeamListing> {
  const { data, error } = await supabase.rpc('create_team_listing', {
    p_event_id: eventId,
    p_title: input.title,
    p_tech_stack: input.techStack,
    p_skills_needed: input.skillsNeeded,
  });
  if (error) throw new Error(error.message);
  if (!data || typeof data !== 'object' || !('id' in data)) throw new Error('Unexpected response while posting.');
  return data as TeamListing;
}

export async function deleteTeamListing(listingId: string): Promise<void> {
  const { error } = await supabase.from('team_listings').delete().eq('id', listingId);
  if (error) throw new Error(error.message);
}

export async function listTeamJoinRequests(): Promise<TeamJoinRequest[]> {
  const { data, error } = await supabase
    .from('team_join_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  if (!Array.isArray(data)) throw new Error('Unexpected response while loading requests.');
  return data as TeamJoinRequest[];
}

export async function requestToJoin(listingId: string, message: string): Promise<TeamJoinRequest> {
  const { data, error } = await supabase.rpc('request_to_join', { p_listing_id: listingId, p_message: message });
  if (error) throw new Error(error.message);
  if (!data || typeof data !== 'object' || !('id' in data)) throw new Error('Unexpected response while requesting.');
  return data as TeamJoinRequest;
}

export async function respondToJoinRequest(requestId: string, status: Exclude<JoinRequestStatus, 'pending'>): Promise<void> {
  const { error } = await supabase.from('team_join_requests').update({ status }).eq('id', requestId);
  if (error) throw new Error(error.message);
}

export async function withdrawJoinRequest(requestId: string): Promise<void> {
  const { error } = await supabase.from('team_join_requests').delete().eq('id', requestId);
  if (error) throw new Error(error.message);
}
