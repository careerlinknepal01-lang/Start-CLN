-- ============================================================
-- Admin Authorization Migration
-- Adds an is_admin() helper and admin-bypass RLS policies for
-- the tables the Admin Panel needs to write to.
-- Additive only — does not modify or drop any existing policy.
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = uid AND role = 'admin'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;

-- profiles — admins can update any profile (Suspend/Unsuspend only;
-- no admin DELETE policy — full user deletion is a later phase,
-- via a service-role Edge Function, not a table policy).
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));

-- communities — no DELETE policy exists for anyone today.
CREATE POLICY "Admins can delete any community"
  ON public.communities FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- feed_posts — currently only the author can delete their own.
CREATE POLICY "Admins can delete any feed post"
  ON public.feed_posts FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- feed_post_reports — admins need to see ALL reports and resolve them.
-- Defensive: ensure `status` exists (AdminReports.tsx reads/writes it).
ALTER TABLE public.feed_post_reports
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

CREATE POLICY "Admins can view all reports"
  ON public.feed_post_reports FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update report status"
  ON public.feed_post_reports FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));
