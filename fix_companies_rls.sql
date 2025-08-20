-- Check current RLS policies on companies table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'companies';

-- Check if RLS is enabled on companies table
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'companies';

-- Create RLS policy to allow reading companies that are referenced in posts
-- This policy allows users to view companies that are mentioned in posts
CREATE POLICY "Allow reading companies referenced in posts" ON public.companies
    FOR SELECT
    USING (
        -- Allow if user owns the company
        auth.uid() = user_id
        OR
        -- Allow if company is approved (public companies)
        status = 'approved'
        OR
        -- Allow if company is referenced in any post (for display purposes)
        EXISTS (
            SELECT 1 FROM public.posts 
            WHERE criteria->>'companyId' = companies.id::text
        )
    );

-- Alternative: Create a more permissive policy for reading companies
-- This allows reading any company (useful for debugging)
CREATE POLICY "Allow reading all companies" ON public.companies
    FOR SELECT
    USING (true);

-- If you want to be more restrictive, you can drop the permissive policy and use this:
-- DROP POLICY IF EXISTS "Allow reading all companies" ON public.companies;

-- Enable RLS on companies table (if not already enabled)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT ON public.companies TO authenticated;
GRANT SELECT ON public.companies TO anon;
