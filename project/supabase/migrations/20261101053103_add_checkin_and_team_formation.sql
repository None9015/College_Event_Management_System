/*
# Check-in, digital pass support, and hackathon team formation

1. Modified Tables
- `registrations`: adds `checked_in_at` (timestamptz, nullable) recording when an organizer checked the student in at the venue.

2. New Tables
- `team_listings`: an open "Looking for Teammates" post by one registered student for a hackathon event.
  - `id`, `event_id`, `owner_id` (defaults to the signed-in user), `owner_name`, `title`, `tech_stack`, `skills_needed`, `created_at`.
  - One listing per student per event.
- `team_join_requests`: a registered student asking to join a listing.
  - `id`, `listing_id`, `requester_id` (defaults to the signed-in user), `requester_name`, `message`, `status` (pending, accepted, declined), `created_at`.
  - One request per student per listing.

3. New Functions (SECURITY DEFINER, callable by signed-in users only)
- `check_in_registration(registration_id)`: organizers only; stamps `checked_in_at` once.
- `create_team_listing(event_id, title, tech_stack, skills_needed)`: the caller must be registered for a hackathon that has not yet taken place. The owner name is read from the caller's profile.
- `request_to_join(listing_id, message)`: the caller must be registered for the same event and must not own the listing. The requester name is read from the caller's profile.

4. Security
- Row level security is enabled on both new tables.
- Students can read team listings only for events they are registered for. Listing owners can read their own listings.
- Join requests are visible to the requester and to the listing owner.
- Only the listing owner can accept or decline a request (status column only). Requesters can withdraw their own request. Owners can delete their own listing.
- No direct insert is granted; creation goes through the functions above, which enforce registration and profile checks on the server.
- Column-level grants keep owner and requester identity fixed to the session.

5. Notes
- All statements are idempotent so the migration can be safely re-applied.
- Existing registrations, events, and profiles are not changed.
*/

ALTER TABLE registrations ADD COLUMN IF NOT EXISTS checked_in_at timestamptz;

CREATE OR REPLACE FUNCTION check_in_registration(p_registration_id uuid)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_checked_in_at timestamptz;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'organizer') THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED';
  END IF;

  UPDATE registrations
  SET checked_in_at = COALESCE(checked_in_at, now())
  WHERE id = p_registration_id
  RETURNING checked_in_at INTO v_checked_in_at;

  IF v_checked_in_at IS NULL THEN
    RAISE EXCEPTION 'REGISTRATION_NOT_FOUND';
  END IF;

  RETURN v_checked_in_at;
END;
$$;

REVOKE EXECUTE ON FUNCTION check_in_registration(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION check_in_registration(uuid) TO authenticated;

CREATE TABLE IF NOT EXISTS team_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_name text NOT NULL,
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 80),
  tech_stack text NOT NULL CHECK (char_length(tech_stack) BETWEEN 2 AND 200),
  skills_needed text NOT NULL CHECK (char_length(skills_needed) BETWEEN 2 AND 200),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, owner_id)
);

CREATE TABLE IF NOT EXISTS team_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES team_listings(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_name text NOT NULL,
  message text NOT NULL DEFAULT '' CHECK (char_length(message) <= 300),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, requester_id)
);

CREATE INDEX IF NOT EXISTS team_listings_event_id_idx ON team_listings (event_id);
CREATE INDEX IF NOT EXISTS team_join_requests_listing_id_idx ON team_join_requests (listing_id);

CREATE OR REPLACE FUNCTION create_team_listing(
  p_event_id uuid,
  p_title text,
  p_tech_stack text,
  p_skills_needed text
)
RETURNS team_listings
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_event events%ROWTYPE;
  v_name text;
  v_listing team_listings%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;

  SELECT * INTO v_event FROM events WHERE id = p_event_id;
  IF v_event.id IS NULL THEN
    RAISE EXCEPTION 'EVENT_NOT_FOUND';
  END IF;
  IF v_event.category <> 'Hackathons' THEN
    RAISE EXCEPTION 'TEAMS_NOT_AVAILABLE';
  END IF;
  IF v_event.event_date < current_date THEN
    RAISE EXCEPTION 'EVENT_CLOSED';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM registrations WHERE event_id = p_event_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'NOT_REGISTERED';
  END IF;

  SELECT full_name INTO v_name FROM profiles WHERE id = auth.uid();
  IF v_name IS NULL OR v_name = '' THEN
    RAISE EXCEPTION 'PROFILE_INCOMPLETE';
  END IF;

  INSERT INTO team_listings (event_id, owner_id, owner_name, title, tech_stack, skills_needed)
  VALUES (p_event_id, auth.uid(), v_name, trim(p_title), trim(p_tech_stack), trim(p_skills_needed))
  RETURNING * INTO v_listing;

  RETURN v_listing;
END;
$$;

CREATE OR REPLACE FUNCTION request_to_join(p_listing_id uuid, p_message text)
RETURNS team_join_requests
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_listing team_listings%ROWTYPE;
  v_name text;
  v_request team_join_requests%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;

  SELECT * INTO v_listing FROM team_listings WHERE id = p_listing_id;
  IF v_listing.id IS NULL THEN
    RAISE EXCEPTION 'LISTING_NOT_FOUND';
  END IF;
  IF v_listing.owner_id = auth.uid() THEN
    RAISE EXCEPTION 'OWN_LISTING';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM registrations WHERE event_id = v_listing.event_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'NOT_REGISTERED';
  END IF;

  SELECT full_name INTO v_name FROM profiles WHERE id = auth.uid();
  IF v_name IS NULL OR v_name = '' THEN
    RAISE EXCEPTION 'PROFILE_INCOMPLETE';
  END IF;

  IF EXISTS (SELECT 1 FROM team_join_requests WHERE listing_id = p_listing_id AND requester_id = auth.uid()) THEN
    RAISE EXCEPTION 'ALREADY_REQUESTED';
  END IF;

  INSERT INTO team_join_requests (listing_id, requester_id, requester_name, message)
  VALUES (p_listing_id, auth.uid(), v_name, trim(coalesce(p_message, '')))
  RETURNING * INTO v_request;

  RETURN v_request;
END;
$$;

REVOKE EXECUTE ON FUNCTION create_team_listing(uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION create_team_listing(uuid, text, text, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION request_to_join(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION request_to_join(uuid, text) TO authenticated;

ALTER TABLE team_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_join_requests ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON team_listings FROM PUBLIC, anon;
REVOKE ALL ON team_join_requests FROM PUBLIC, anon;

GRANT SELECT, DELETE ON team_listings TO authenticated;
GRANT SELECT, DELETE ON team_join_requests TO authenticated;
GRANT UPDATE (status) ON team_join_requests TO authenticated;

DROP POLICY IF EXISTS "team_listings_select_registered" ON team_listings;
CREATE POLICY "team_listings_select_registered" ON team_listings FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM registrations r
    WHERE r.event_id = team_listings.event_id AND r.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "team_listings_insert_none" ON team_listings;
CREATE POLICY "team_listings_insert_none" ON team_listings FOR INSERT
TO authenticated
WITH CHECK (false);

DROP POLICY IF EXISTS "team_listings_update_none" ON team_listings;
CREATE POLICY "team_listings_update_none" ON team_listings FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "team_listings_delete_owner" ON team_listings;
CREATE POLICY "team_listings_delete_owner" ON team_listings FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "team_join_requests_select_party" ON team_join_requests;
CREATE POLICY "team_join_requests_select_party" ON team_join_requests FOR SELECT
TO authenticated
USING (
  requester_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM team_listings l
    WHERE l.id = team_join_requests.listing_id AND l.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "team_join_requests_insert_none" ON team_join_requests;
CREATE POLICY "team_join_requests_insert_none" ON team_join_requests FOR INSERT
TO authenticated
WITH CHECK (false);

DROP POLICY IF EXISTS "team_join_requests_update_owner" ON team_join_requests;
CREATE POLICY "team_join_requests_update_owner" ON team_join_requests FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM team_listings l WHERE l.id = team_join_requests.listing_id AND l.owner_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM team_listings l WHERE l.id = team_join_requests.listing_id AND l.owner_id = auth.uid())
);

DROP POLICY IF EXISTS "team_join_requests_delete_requester" ON team_join_requests;
CREATE POLICY "team_join_requests_delete_requester" ON team_join_requests FOR DELETE
TO authenticated
USING (requester_id = auth.uid());
