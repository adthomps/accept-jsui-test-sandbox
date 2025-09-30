-- Drop the insecure policy that allows unrestricted public access
DROP POLICY IF EXISTS "Allow all access to customer profiles" ON public.customer_profiles;

-- Create a secure policy that denies all direct client access
-- Only backend services using service_role key can access this table
CREATE POLICY "Deny all direct client access to customer profiles"
ON public.customer_profiles
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);

-- Note: Edge functions using SUPABASE_SERVICE_ROLE_KEY will bypass RLS
-- and can still access the table, which is the intended behavior