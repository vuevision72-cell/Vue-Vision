
-- Create the table to store website content key-value pairs
CREATE TABLE public.website_content (
    id TEXT PRIMARY KEY,
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.website_content ENABLE ROW LEVEL SECURITY;

-- Create policies for the website_content table
-- 1. Allow public read access to everyone
CREATE POLICY "Allow public read access"
ON public.website_content
FOR SELECT
USING (true);

-- 2. Allow admin users to perform all operations
CREATE POLICY "Allow full access for admins"
ON public.website_content
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Create a helper function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;
