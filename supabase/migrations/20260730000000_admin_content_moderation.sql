-- ============================================================
-- Admin Content Moderation Authorization
-- Adds additive admin-bypass DELETE policies for content tables.
-- ============================================================

CREATE POLICY "Admins can delete any project"
  ON public.projects FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete any opportunity"
  ON public.opportunities FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete any event"
  ON public.events FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete any QA post"
  ON public.qa_posts FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete any QA answer"
  ON public.qa_answers FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));
