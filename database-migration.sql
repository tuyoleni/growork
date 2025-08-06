-- Database Migration Script
-- Run this script to update your existing database with the new fields

-- Add missing fields to profiles table if they don't exist
DO $$ 
BEGIN
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());
    END IF;

    -- Add website column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'website') THEN
        ALTER TABLE public.profiles ADD COLUMN website text;
    END IF;

    -- Add phone column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'phone') THEN
        ALTER TABLE public.profiles ADD COLUMN phone text;
    END IF;

    -- Add location column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'location') THEN
        ALTER TABLE public.profiles ADD COLUMN location text;
    END IF;

    -- Add profession column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'profession') THEN
        ALTER TABLE public.profiles ADD COLUMN profession text;
    END IF;

    -- Add experience_years column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'experience_years') THEN
        ALTER TABLE public.profiles ADD COLUMN experience_years integer;
    END IF;

    -- Add education column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'education') THEN
        ALTER TABLE public.profiles ADD COLUMN education text;
    END IF;

    -- Add skills column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'skills') THEN
        ALTER TABLE public.profiles ADD COLUMN skills text[];
    END IF;
END $$;

-- Create trigger for profiles updated_at if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_profiles_updated_at') THEN
        CREATE TRIGGER set_profiles_updated_at
        BEFORE UPDATE ON public.profiles
        FOR EACH ROW
        EXECUTE FUNCTION update_modified_column();
    END IF;
END $$;

-- Update existing profiles to have updated_at timestamp
UPDATE public.profiles 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON public.companies(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_status ON public.companies(status);

-- Add comments for documentation
COMMENT ON TABLE public.profiles IS 'User profile information with extended fields for professional and company profiles';
COMMENT ON COLUMN public.profiles.website IS 'User website URL';
COMMENT ON COLUMN public.profiles.phone IS 'User phone number';
COMMENT ON COLUMN public.profiles.location IS 'User location (city, country)';
COMMENT ON COLUMN public.profiles.profession IS 'User profession or company name for professional/company users';
COMMENT ON COLUMN public.profiles.experience_years IS 'Years of experience for professional users';
COMMENT ON COLUMN public.profiles.education IS 'Education background for professional users';
COMMENT ON COLUMN public.profiles.skills IS 'Array of skills for professional users';

COMMENT ON TABLE public.companies IS 'Company profiles associated with users';
COMMENT ON COLUMN public.companies.size IS 'Company size (e.g., 1-10, 11-50, 51-200)';
COMMENT ON COLUMN public.companies.founded_year IS 'Year the company was founded';
COMMENT ON COLUMN public.companies.status IS 'Company approval status (pending, approved, rejected)'; 