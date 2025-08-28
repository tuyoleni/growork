-- Add unique constraint to prevent duplicate follows (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'company_follows_unique'
    ) THEN
        ALTER TABLE public.company_follows 
        ADD CONSTRAINT company_follows_unique UNIQUE (profile_id, company_id);
    END IF;
END $$;

-- Enable RLS on company_follows table
ALTER TABLE public.company_follows ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for own follows" ON public.company_follows;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.company_follows;
DROP POLICY IF EXISTS "Enable delete for own follows" ON public.company_follows;

-- Policy to allow users to view their own follows
CREATE POLICY "Enable read access for own follows"
ON public.company_follows
FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

-- Policy to allow users to create follows
CREATE POLICY "Enable insert for authenticated users"
ON public.company_follows
FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

-- Policy to allow users to delete their own follows
CREATE POLICY "Enable delete for own follows"
ON public.company_follows
FOR DELETE
TO authenticated
USING (profile_id = auth.uid());

-- Create additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_company_follows_profile ON public.company_follows(profile_id);
CREATE INDEX IF NOT EXISTS idx_company_follows_company ON public.company_follows(company_id);
CREATE INDEX IF NOT EXISTS idx_company_follows_profile_company ON public.company_follows(profile_id, company_id);
CREATE INDEX IF NOT EXISTS idx_company_follows_created_at ON public.company_follows(created_at DESC);
