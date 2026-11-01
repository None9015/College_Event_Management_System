export type UserRole = 'student' | 'organizer';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  roll_no: string;
  role: UserRole;
}
