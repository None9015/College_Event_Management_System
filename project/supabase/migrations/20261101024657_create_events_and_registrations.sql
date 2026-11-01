/*
# Create events and registrations tables

Plain-English summary: adds the core data for the college event system. Organizers publish events; students register for them. Registration is handled by a database function that checks capacity and duplicates atomically, so two students cannot grab the last seat at the same time.

1. New Tables
- `events`: id, title, description, category (Technical, Cultural, Sports, Workshops, Hackathons, Seminars), event_date, start_time, end_time (optional), venue, capacity (must be at least 1), created_at, updated_at.
- `registrations`: id, event_id (foreign key to events, deleted together with the event), student_name, student_email, created_at. A student can register for an event only once (case-insensitive email).

2. New Functions
- `register_for_event(p_event_id, p_student_name, p_student_email)`: locks the event row, rejects duplicates and full events with clear messages, then inserts the registration and returns it.

3. Security
- Row Level Security is enabled on both tables.
- The app has no sign-in, so policies target the `anon` and `authenticated` roles.
- events: anyone can read, create, update and delete (the organizer dashboard is open).
- registrations: anyone can read; new registrations go through the registration function only, so direct inserts are not granted.
- The registration function is granted to `anon` and `authenticated` only.

4. Important Notes
- 4.1 Capacity and duplicates are enforced in the database, not only in the browser.
- 4.2 Deleting an event also deletes its registrations.
*/

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 150),
  description text NOT NULL DEFAULT '',
  category text NOT NULL CHECK (category IN ('Technical', 'Cultural', 'Sports', 'Workshops', 'Hackathons', 'Seminars')),
  event_date date NOT NULL,
  start_time time NOT NULL,
  end_time time,
  venue text NOT NULL CHECK (char_length(venue) BETWEEN 1 AND 150),
  capacity integer NOT NULL CHECK (capacity >= 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS events_event_date_idx ON events (event_date);

CREATE TABLE IF NOT EXISTS registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_name text NOT NULL CHECK (char_length(student_name) BETWEEN 1 AND 120),
  student_email text NOT NULL CHECK (char_length(student_email) BETWEEN 3 AND 255),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS registrations_event_email_key ON registrations (event_id, lower(student_email));
CREATE INDEX IF NOT EXISTS registrations_student_email_idx ON registrations (lower(student_email));

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON events TO anon, authenticated;
GRANT SELECT ON registrations TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_events" ON events;
CREATE POLICY "anon_select_events" ON events FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_events" ON events;
CREATE POLICY "anon_insert_events" ON events FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_events" ON events;
CREATE POLICY "anon_update_events" ON events FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_events" ON events;
CREATE POLICY "anon_delete_events" ON events FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_registrations" ON registrations;
CREATE POLICY "anon_select_registrations" ON registrations FOR SELECT
  TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION register_for_event(
  p_event_id uuid,
  p_student_name text,
  p_student_email text
)
RETURNS registrations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event events%ROWTYPE;
  v_count integer;
  v_name text := btrim(coalesce(p_student_name, ''));
  v_email text := lower(btrim(coalesce(p_student_email, '')));
  v_row registrations%ROWTYPE;
BEGIN
  IF char_length(v_name) < 1 OR char_length(v_name) > 120 THEN
    RAISE EXCEPTION 'INVALID_NAME' USING ERRCODE = 'P0001';
  END IF;

  IF v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR char_length(v_email) > 255 THEN
    RAISE EXCEPTION 'INVALID_EMAIL' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_event FROM events WHERE id = p_event_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'EVENT_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  IF EXISTS (
    SELECT 1 FROM registrations
    WHERE event_id = p_event_id AND lower(student_email) = v_email
  ) THEN
    RAISE EXCEPTION 'ALREADY_REGISTERED' USING ERRCODE = 'P0001';
  END IF;

  SELECT count(*) INTO v_count FROM registrations WHERE event_id = p_event_id;
  IF v_count >= v_event.capacity THEN
    RAISE EXCEPTION 'EVENT_FULL' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO registrations (event_id, student_name, student_email)
  VALUES (p_event_id, v_name, v_email)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION register_for_event(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION register_for_event(uuid, text, text) TO anon, authenticated;
