-- Enable Row Level Security for the website_images table
ALTER TABLE public.website_images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to ensure a clean slate
DROP POLICY IF EXISTS "Allow admin full access to website images" ON public.website_images;

-- Create a policy that gives users with the 'admin' role full access
CREATE POLICY "Allow admin full access to website images"
ON public.website_images
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
