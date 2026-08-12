-- Fix: admin_users_view and admin_reports_view join auth.users but a plain VIEW
-- runs as the calling user, who cannot access the auth schema.
-- Recreate both views with security_invoker=off (the default) so they execute
-- as the view owner (postgres / superuser) who CAN read auth.users.
-- The WHERE public.is_admin(auth.uid()) clause still protects the data —
-- it calls is_admin() with the CALLER's uid, so only real admins see rows.

-- ── admin_users_view ─────────────────────────────────────────────────────────
DROP VIEW IF EXISTS public.admin_users_view;

CREATE VIEW public.admin_users_view
  WITH (security_invoker = off)   -- runs as view owner → can JOIN auth.users
AS
SELECT
  p.id,
  p.name,
  u.email,
  p.avatar_url,
  p.college,
  p.field,
  p.bio,
  p.created_at,
  p.updated_at,
  p.role,
  p.is_verified,
  p.is_onboarded
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE public.is_admin(auth.uid());   -- only rows visible when caller is admin

-- ── admin_reports_view ───────────────────────────────────────────────────────
DROP VIEW IF EXISTS public.admin_reports_view;

CREATE VIEW public.admin_reports_view
  WITH (security_invoker = off)
AS
SELECT
  r.id,
  r.reason,
  r.created_at,
  r.status,
  r.post_id,
  r.user_id,
  p.name   AS reporter_name,
  u.email  AS reporter_email,
  post.content    AS post_content,
  post.author_id  AS post_author_id
FROM public.feed_post_reports r
JOIN public.profiles  p    ON r.user_id = p.id
JOIN auth.users       u    ON r.user_id = u.id
JOIN public.feed_posts post ON r.post_id = post.id
WHERE public.is_admin(auth.uid());

-- Re-grant SELECT (DROP VIEW removes previous grants)
GRANT SELECT ON public.admin_users_view   TO authenticated;
GRANT SELECT ON public.admin_reports_view TO authenticated;
