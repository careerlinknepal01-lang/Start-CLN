-- Add image_url columns to events and projects tables for media support

-- Add image_url to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add image_url to projects table  
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.events.image_url IS 'URL to event banner/image stored in Supabase Storage';
COMMENT ON COLUMN public.projects.image_url IS 'URL to project thumbnail/image stored in Supabase Storage';
