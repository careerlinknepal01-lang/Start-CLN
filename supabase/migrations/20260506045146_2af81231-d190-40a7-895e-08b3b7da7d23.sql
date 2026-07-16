
-- Tighten notification insert policy
DROP POLICY "System inserts notifications" ON public.notifications;
CREATE POLICY "Users insert own notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Revoke execute from public/anon/authenticated on trigger functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_connection_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_message() FROM PUBLIC, anon, authenticated;

-- Remove broad listing on avatars; keep direct file access via public URLs
DROP POLICY "Avatars publicly readable" ON storage.objects;
