-- Create the profiles table to store user data linked to auth
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  role text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Stores role and profile information for each authenticated user.';
