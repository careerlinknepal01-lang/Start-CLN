-- 1. Update the signup trigger to stop writing to the email column.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, college, field)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'college', ''),
    COALESCE(NEW.raw_user_meta_data->>'field', '')
  );
  RETURN NEW;
END;
$$;

-- 2. Drop the email column from the public.profiles table
ALTER TABLE public.profiles DROP COLUMN email;

-- 3. Create a secure view for Admins to view users along with their secure emails
CREATE OR REPLACE VIEW public.admin_users_view AS
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
WHERE public.is_admin(auth.uid());

-- 4. Create a secure view for Admins to view post reports along with reporter emails
CREATE OR REPLACE VIEW public.admin_reports_view AS
SELECT 
  r.id, 
  r.reason, 
  r.created_at, 
  r.status, 
  r.post_id,
  r.user_id,
  p.name AS reporter_name, 
  u.email AS reporter_email,
  post.content AS post_content, 
  post.author_id AS post_author_id
FROM public.feed_post_reports r
JOIN public.profiles p ON r.user_id = p.id
JOIN auth.users u ON r.user_id = u.id
JOIN public.feed_posts post ON r.post_id = post.id
WHERE public.is_admin(auth.uid());

-- 5. Grant access to authenticated users (RLS is bypassed by SECURITY DEFINER views, 
-- but the WHERE is_admin() protects it)
GRANT SELECT ON public.admin_users_view TO authenticated;
GRANT SELECT ON public.admin_reports_view TO authenticated;
