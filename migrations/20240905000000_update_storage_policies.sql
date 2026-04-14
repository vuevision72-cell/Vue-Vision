-- Grant all privileges on the 'public_uploads' bucket to authenticated users.
-- This policy allows any authenticated user to perform select, insert, update, and delete operations.
-- The 'public' role is a special role in PostgreSQL that includes all users.
-- In Supabase, this effectively applies to any logged-in user.
-- This is a broad permission set suitable for a development or trusted environment.
-- For production, you might want to restrict this further based on user roles.

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can manage uploads" ON storage.objects;

-- Create the new policy for the 'public_uploads' bucket
CREATE POLICY "Authenticated users can manage uploads"
ON storage.objects
FOR ALL
TO authenticated
USING ( bucket_id = 'public_uploads' )
WITH CHECK ( bucket_id = 'public_uploads' );
