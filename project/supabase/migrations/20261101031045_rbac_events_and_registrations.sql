/*
# Lock events and registrations behind sign-in and roles

Plain-English summary: only signed-in organizers can create, change or delete events, and each organizer's events are recorded. Students register while signed in, and their registration is linked to their account automatically. Students can see only their own registrations and can cancel them. Organizers can see the participants of events. Visitors can still browse upcoming and past events.

1. Modified Tables
- `events`: adds `created_by` (the organizer who created it, filled automatically) and `registered_count` (kept up to date automatically, used for showing seats taken).
- `registrations`: adds `user_id` (the student's account), `roll_no` (copied from their profile at registration time).

2. New Functions
- `register_for_event(event_id)`: registers the signed-in student. Checks sign-in, profile completeness, that the event has not already taken place, duplicates and capacity, all while locking the event row.
- `cancel_registration(registration_id)`: lets a student cancel their own registration for an upcoming event.
- `sync_event_registered_count()`: trigger that keeps `registered_count` correct.
- The old registration function (which accepted typed-in name and email) is removed; registrations now come from the signed-in profile.

3. Security
- events: everyone (including visitors) can read. Only organizers can insert, update or delete, and only their own rows get created_by set. created_by and registered_count cannot be written by the app.
- registrations: students read only their own rows; organizers read all rows. Visitors cannot read registrations at all. Writes happen only through the functions above.
- Anonymous visitors lose all write access to events.

4. Important Notes
- 4.1 Existing events have no creator recorded, so they remain editable by any organizer.
- 4.2 The registrations table is empty at the time of this migration, so the new required columns are safe to add.
*/

ALTER TABLE events ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid();
ALTER TABLE events ADD COLUMN IF NOT EXISTS registered_count integer NOT NULL DEFAULT 0 CHECK (registered_count >= 0);

ALTER TABLE registrations ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS roll_no text NOT NULL DEFAULT '';

CREATE UNIQUE INDEX IF NOT EXISTS registrations_event_user_key ON registrations (event_id, user_id);
CREATE INDEX IF NOT EXISTS registrations_user_id_idx ON registrations (user_id);

CREATE OR REPLACE FUNCTION sync_event_registered_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE events SET registered_count = registered_count + 1 WHERE id = NEW.event_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE events SET registered_count = GREATEST(registered_count - 1, 0) WHERE id = OLD.event_id;
  END IF;
  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION sync_event_registered_count() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS registrations_sync_count ON registrations;
CREATE TRIGGER registrations_sync_count
  AFTER INSERT OR DELETE ON registrations
  FOR EACH ROW EXECUTE FUNCTION sync_event_registered_count();

UPDATE events e SET registered_count = (
  SELECT count(*) FROM registrations r WHERE r.event_id = e.id
);

REVOKE INSERT, UPDATE, DELETE ON events FROM anon, authenticated;
GRANT INSERT (title, description, category, event_date, start_time, end_time, venue, capacity) ON events TO authenticated;
GRANT UPDATE (title, description, category, event_date, start_time, end_time, venue, capacity, updated_at) ON events TO authenticated;
GRANT DELETE ON events TO authenticated;
GRANT SELECT ON events TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_events" ON events;
DROP POLICY IF EXISTS "anon_insert_events" ON events;
DROP POLICY IF EXISTS "anon_update_events" ON events;
DROP POLICY IF EXISTS "anon_delete_events" ON events;

DROP POLICY IF EXISTS "events_select_public" ON events;
CREATE POLICY "events_select_public" ON events FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "events_insert_organizer" ON events;
CREATE POLICY "events_insert_organizer" ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'organizer')
  );

DROP POLICY IF EXISTS "events_update_organizer" ON events;
CREATE POLICY "events_update_organizer" ON events FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'organizer'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'organizer'));

DROP POLICY IF EXISTS "events_delete_organizer" ON events;
CREATE POLICY "events_delete_organizer" ON events FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'organizer'));

REVOKE ALL ON registrations FROM anon;
REVOKE INSERT, UPDATE, DELETE ON registrations FROM authenticated;
GRANT SELECT ON registrations TO authenticated;

DROP POLICY IF EXISTS "anon_select_registrations" ON registrations;
DROP POLICY IF EXISTS "registrations_select_own" ON registrations;
CREATE POLICY "registrations_select_own" ON registrations FOR SELECT
  TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "registrations_select_organizer" ON registrations;
CREATE POLICY "registrations_select_organizer" ON registrations FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'organizer'));

DROP FUNCTION IF EXISTS register_for_event(uuid, text, text);

CREATE OR REPLACE FUNCTION register_for_event(p_event_id uuid)
RETURNS registrations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_profile profiles%ROWTYPE;
  v_event events%ROWTYPE;
  v_row registrations%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_profile FROM profiles WHERE id = v_uid;
  IF NOT FOUND OR v_profile.full_name = '' OR v_profile.roll_no = '' THEN
    RAISE EXCEPTION 'PROFILE_INCOMPLETE' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_event FROM events WHERE id = p_event_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'EVENT_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  IF v_event.event_date < current_date THEN
    RAISE EXCEPTION 'EVENT_CLOSED' USING ERRCODE = 'P0001';
  END IF;

  IF EXISTS (SELECT 1 FROM registrations WHERE event_id = p_event_id AND user_id = v_uid) THEN
    RAISE EXCEPTION 'ALREADY_REGISTERED' USING ERRCODE = 'P0001';
  END IF;

  IF v_event.registered_count >= v_event.capacity THEN
    RAISE EXCEPTION 'EVENT_FULL' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO registrations (event_id, user_id, student_name, student_email, roll_no)
  VALUES (p_event_id, v_uid, v_profile.full_name, v_profile.email, v_profile.roll_no)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION register_for_event(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION register_for_event(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION cancel_registration(p_registration_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_registration registrations%ROWTYPE;
  v_event_date date;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_registration FROM registrations
  WHERE id = p_registration_id AND user_id = v_uid
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'REGISTRATION_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  SELECT event_date INTO v_event_date FROM events WHERE id = v_registration.event_id;
  IF v_event_date < current_date THEN
    RAISE EXCEPTION 'EVENT_CLOSED' USING ERRCODE = 'P0001';
  END IF;

  DELETE FROM registrations WHERE id = v_registration.id;
END;
$$;

REVOKE EXECUTE ON FUNCTION cancel_registration(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION cancel_registration(uuid) TO authenticated;
