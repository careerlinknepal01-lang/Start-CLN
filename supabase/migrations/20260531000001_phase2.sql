-- Phase 2 Migration: Projects & Opportunities

-- 1. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  required_skills TEXT[] DEFAULT '{}'::TEXT[],
  team_size INTEGER DEFAULT 1,
  status TEXT DEFAULT 'open', -- open, in_progress, completed
  timeline TEXT,
  category TEXT,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Project Members Table
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- pending, accepted, rejected
  role TEXT DEFAULT 'member', -- member, owner (for creator)
  joined_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(project_id, user_id)
);

-- 3. Opportunities Table
CREATE TABLE IF NOT EXISTS public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- internship, gig, scholarship, job
  description TEXT NOT NULL,
  requirements TEXT[] DEFAULT '{}'::TEXT[],
  company_name TEXT,
  location TEXT,
  stipend TEXT,
  deadline TIMESTAMP WITH TIME ZONE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Opportunity Applications Table
CREATE TABLE IF NOT EXISTS public.opportunity_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- pending, reviewed, accepted, rejected
  resume_url TEXT,
  cover_letter TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(opportunity_id, user_id)
);

-- Set RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_applications ENABLE ROW LEVEL SECURITY;

-- Project Policies
CREATE POLICY "Projects are viewable by everyone" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Projects are insertable by authenticated users" ON public.projects FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Projects can be updated by creator" ON public.projects FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Projects can be deleted by creator" ON public.projects FOR DELETE USING (auth.uid() = creator_id);

-- Project Members Policies
CREATE POLICY "Project members are viewable by everyone" ON public.project_members FOR SELECT USING (true);
CREATE POLICY "Users can request to join projects" ON public.project_members FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IN (SELECT creator_id FROM public.projects WHERE id = project_id));
CREATE POLICY "Users can update their own status or project owners can update" ON public.project_members FOR UPDATE USING (auth.uid() = user_id OR auth.uid() IN (SELECT creator_id FROM public.projects WHERE id = project_id));
CREATE POLICY "Users can leave or owners can remove" ON public.project_members FOR DELETE USING (auth.uid() = user_id OR auth.uid() IN (SELECT creator_id FROM public.projects WHERE id = project_id));

-- Opportunities Policies
CREATE POLICY "Opportunities are viewable by everyone" ON public.opportunities FOR SELECT USING (true);
CREATE POLICY "Opportunities are insertable by authenticated users" ON public.opportunities FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Opportunities can be updated by creator" ON public.opportunities FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Opportunities can be deleted by creator" ON public.opportunities FOR DELETE USING (auth.uid() = creator_id);

-- Applications Policies
CREATE POLICY "Users can view their own apps and creators can view all" ON public.opportunity_applications FOR SELECT USING (auth.uid() = user_id OR auth.uid() IN (SELECT creator_id FROM public.opportunities WHERE id = opportunity_id));
CREATE POLICY "Users can apply" ON public.opportunity_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Creators can update status" ON public.opportunity_applications FOR UPDATE USING (auth.uid() IN (SELECT creator_id FROM public.opportunities WHERE id = opportunity_id) OR auth.uid() = user_id);
