-- Create or update enum types for the database

-- Create post_type enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'post_type') THEN
        CREATE TYPE post_type AS ENUM ('news', 'job');
    END IF;
END $$;

-- Create ad_status enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ad_status') THEN
        CREATE TYPE ad_status AS ENUM ('active', 'paused', 'completed');
    END IF;
END $$;

-- Create application_status enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN
        CREATE TYPE application_status AS ENUM ('pending', 'reviewed', 'accepted', 'rejected');
    END IF;
END $$;

-- Create document_type enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_type') THEN
        CREATE TYPE document_type AS ENUM ('cv', 'cover_letter', 'certificate', 'other');
    END IF;
END $$;

-- Create user_type enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type') THEN
        CREATE TYPE user_type AS ENUM ('business', 'user');
    END IF;
END $$;

-- Add industry field to posts table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'industry') THEN
        ALTER TABLE public.posts ADD COLUMN industry text;
    END IF;
END $$;

-- Create a function to update the updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to update the updated_at timestamp automatically for posts
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_posts_updated_at') THEN
        CREATE TRIGGER set_posts_updated_at
        BEFORE UPDATE ON public.posts
        FOR EACH ROW
        EXECUTE FUNCTION update_modified_column();
    END IF;
END $$;

-- Create a bookmarks table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  post_id uuid,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT bookmarks_pkey PRIMARY KEY (id),
  CONSTRAINT bookmarks_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE,
  CONSTRAINT bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT bookmarks_unique UNIQUE (user_id, post_id)
);

-- Create a comment_likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  comment_id uuid,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT comment_likes_pkey PRIMARY KEY (id),
  CONSTRAINT comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE,
  CONSTRAINT comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT comment_likes_unique UNIQUE (user_id, comment_id)
);

-- Add ON DELETE CASCADE to existing foreign keys for better data integrity
ALTER TABLE public.likes DROP CONSTRAINT IF EXISTS likes_post_id_fkey;
ALTER TABLE public.likes ADD CONSTRAINT likes_post_id_fkey 
  FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

ALTER TABLE public.likes DROP CONSTRAINT IF EXISTS likes_user_id_fkey;
ALTER TABLE public.likes ADD CONSTRAINT likes_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_post_id_fkey;
ALTER TABLE public.comments ADD CONSTRAINT comments_post_id_fkey 
  FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_user_id_fkey;
ALTER TABLE public.comments ADD CONSTRAINT comments_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update applications table foreign keys
ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_user_id_fkey;
ALTER TABLE public.applications ADD CONSTRAINT applications_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_post_id_fkey;
ALTER TABLE public.applications ADD CONSTRAINT applications_post_id_fkey 
  FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_cover_letter_id_fkey;
ALTER TABLE public.applications ADD CONSTRAINT applications_cover_letter_id_fkey 
  FOREIGN KEY (cover_letter_id) REFERENCES public.documents(id) ON DELETE SET NULL;

ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_resume_id_fkey;
ALTER TABLE public.applications ADD CONSTRAINT applications_resume_id_fkey 
  FOREIGN KEY (resume_id) REFERENCES public.documents(id) ON DELETE SET NULL;

-- Update ads table foreign keys
ALTER TABLE public.ads DROP CONSTRAINT IF EXISTS ads_user_id_fkey;
ALTER TABLE public.ads ADD CONSTRAINT ads_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.ads DROP CONSTRAINT IF EXISTS ads_post_id_fkey;
ALTER TABLE public.ads ADD CONSTRAINT ads_post_id_fkey 
  FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

-- Update ad_impressions table foreign keys
ALTER TABLE public.ad_impressions DROP CONSTRAINT IF EXISTS ad_impressions_ad_id_fkey;
ALTER TABLE public.ad_impressions ADD CONSTRAINT ad_impressions_ad_id_fkey 
  FOREIGN KEY (ad_id) REFERENCES public.ads(id) ON DELETE CASCADE;

ALTER TABLE public.ad_impressions DROP CONSTRAINT IF EXISTS ad_impressions_user_id_fkey;
ALTER TABLE public.ad_impressions ADD CONSTRAINT ad_impressions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update documents table foreign keys
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_user_id_fkey;
ALTER TABLE public.documents ADD CONSTRAINT documents_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add unique constraint to prevent duplicate likes
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'likes_unique' AND conrelid = 'public.likes'::regclass
    ) THEN
        ALTER TABLE public.likes ADD CONSTRAINT likes_unique UNIQUE (user_id, post_id);
    END IF;
END $$;