export const EVENT_CATEGORIES = [
  'Technical',
  'Cultural',
  'Sports',
  'Workshops',
  'Hackathons',
  'Seminars',
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export interface EventRecord {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  event_date: string;
  start_time: string;
  end_time: string | null;
  venue: string;
  capacity: number;
  created_at: string;
  updated_at: string;
}

export interface EventRow extends EventRecord {
  registered_count: number;
}

export interface EventWithCount extends EventRecord {
  registeredCount: number;
}

export type EventInput = Omit<EventRecord, 'id' | 'created_at' | 'updated_at'>;

export interface Registration {
  id: string;
  event_id: string;
  student_name: string;
  student_email: string;
  roll_no: string;
  created_at: string;
  checked_in_at: string | null;
}

export interface RegistrationWithEvent extends Registration {
  events: EventRecord | null;
}

export type EventStatus = 'upcoming' | 'completed';

export interface TeamListing {
  id: string;
  event_id: string;
  owner_id: string;
  owner_name: string;
  title: string;
  tech_stack: string;
  skills_needed: string;
  created_at: string;
}

export type JoinRequestStatus = 'pending' | 'accepted' | 'declined';

export interface TeamJoinRequest {
  id: string;
  listing_id: string;
  requester_id: string;
  requester_name: string;
  message: string;
  status: JoinRequestStatus;
  created_at: string;
}
