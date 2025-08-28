-- Enable RLS on companies table
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Policy to allow all users to view all companies
CREATE POLICY "Enable read access for all users"
ON public.companies
FOR SELECT
TO authenticated, anon
USING (true);

-- Policy to allow authenticated users to create companies
-- Only allow users with user_type = 'business' to create companies
CREATE POLICY "Enable insert for business users"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'business'::user_type
  )
);

-- Policy to allow users to update their own companies
CREATE POLICY "Enable update for company owners"
ON public.companies
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
)
WITH CHECK (
  user_id = auth.uid()
);

-- Policy to allow users to delete their own companies
CREATE POLICY "Enable delete for company owners"
ON public.companies
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
);
