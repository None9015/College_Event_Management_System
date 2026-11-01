/*
# Create profiles table with student and organizer roles

Plain-English summary: every person who signs up gets a profile row holding their full name, roll number and role. New sign-ups always start as students. Only the database itself can change a role, so nobody can promote themselves to organizer from the app.

1. New Tables
- `profiles`: id (same as the sign-in account id), email, full_name, roll_no, role ('student' or 'organizer'), created_at, updated_at.

2. Automation
- A trigger creates the profile automatically whenever a new account is created. It reads the full name and roll number supplied at sign-up and sets the role to 'student'.

3. Security
- Row Level Security is enabled on `profiles`.
- Signed-in users can read only their own profile.
- Signed-in users can edit only their full name and roll number. The role column is not writable by the app.
- The profile trigger function cannot be called directly by any app user.

4. Important Notes
- 4.1 To make someone an organizer, an administrator changes their role in the database.
- 4.2 Roll number and full name are required at sign-up.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 1 AND 120),
  roll_no text NOT NULL CHECK (char_length(roll_no) BETWEEN 1 AND 40),
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'organizer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON profiles FROM PUBLIC, anon;
GRANT SELECT ON profiles TO authenticated;
GRANT UPDATE (full_name, roll_no, updated_at) ON profiles TO authenticated;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  TO authenticated USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, roll_no, role)
  VALUES (
    NEW.id,
    lower(NEW.email),
    btrim(coalesce(NEW.raw_user_meta_data->>'full_name', '')),
    btrim(coalesce(NEW.raw_user_meta_data->>'roll_no', '')),
    'student'
  );
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
