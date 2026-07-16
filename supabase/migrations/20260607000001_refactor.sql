-- Major Refactor Migration: CareerLink Nepal
-- Run this in the Supabase SQL Editor.
-- These are idempotent operations (CREATE TABLE IF NOT EXISTS, etc.)

-- 1. Ensure `communities` table exists
CREATE TABLE IF NOT EXISTS public.communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  avatar_url TEXT,
  cover_url TEXT,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Ensure `community_members` table exists and has `joined_at`
CREATE TABLE IF NOT EXISTS public.community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- member, admin, creator
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(community_id, user_id)
);

-- 3. Ensure `events` table exists
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  image_url TEXT,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Ensure `event_attendees` table exists (RSVP style)
CREATE TABLE IF NOT EXISTS public.event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'going',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(event_id, user_id)
);

-- 5. Create new `event_applications` table (Formal applications)
CREATE TABLE IF NOT EXISTS public.event_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- pending, accepted, rejected
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(event_id, user_id)
);

-- 6. RLS Policies for new table
ALTER TABLE public.event_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own event applications" 
ON public.event_applications FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() IN (SELECT creator_id FROM public.events WHERE id = event_id));

CREATE POLICY "Users can apply to events" 
ON public.event_applications FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own applications" 
ON public.event_applications FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Event creators can update applications" 
ON public.event_applications FOR UPDATE 
USING (auth.uid() IN (SELECT creator_id FROM public.events WHERE id = event_id));

-- 7. Ensure `feed_posts` has `community_id` column for Community feeds
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE;

-- 8. Add Indexes to improve performance
CREATE INDEX IF NOT EXISTS idx_feed_posts_community_id ON public.feed_posts(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON public.community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user_id ON public.community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_events_community_id ON public.events(community_id);
CREATE INDEX IF NOT EXISTS idx_events_creator_id ON public.events(creator_id);
CREATE INDEX IF NOT EXISTS idx_event_applications_event_id ON public.event_applications(event_id);
CREATE INDEX IF NOT EXISTS idx_event_applications_user_id ON public.event_applications(user_id);

-- 9. Drop unused tables if desired (uncomment if you want to completely clear the old data)
-- DROP TABLE IF EXISTS public.qa_answers CASCADE;
-- DROP TABLE IF EXISTS public.qa_posts CASCADE;
-- DROP TABLE IF EXISTS public.opportunity_applications CASCADE;
-- DROP TABLE IF EXISTS public.opportunities CASCADE;
-- DROP TABLE IF EXISTS public.project_members CASCADE;
-- DROP TABLE IF EXISTS public.projects CASCADE;
