-- Production hardening: storage, messaging, indexes, policies

-- ─── Covers bucket (Profile cover uploads) ───
INSERT INTO storage.buckets (id, name, public)
VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Covers publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'covers');

CREATE POLICY "Users upload own cover"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own cover"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own cover"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Restore public read for avatars (direct URL access)
CREATE POLICY "Avatars publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- ─── Messages: only between accepted connections ───
DROP POLICY IF EXISTS "Users send messages" ON public.messages;

CREATE POLICY "Users send messages to accepted connections"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.connections c
      WHERE c.status = 'accepted'
        AND (
          (c.requester_id = sender_id AND c.addressee_id = receiver_id)
          OR (c.addressee_id = sender_id AND c.requester_id = receiver_id)
        )
    )
  );

-- ─── Notifications: explicit user filter in app; tighten UPDATE ───
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── Performance indexes ───
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_connections_requester_status
  ON public.connections (requester_id, status);

CREATE INDEX IF NOT EXISTS idx_connections_addressee_status
  ON public.connections (addressee_id, status);

CREATE INDEX IF NOT EXISTS idx_messages_receiver_read
  ON public.messages (receiver_id, read) WHERE read = false;

CREATE INDEX IF NOT EXISTS idx_profiles_name
  ON public.profiles (name);

-- ─── Revoke public execute on feed RPC ───
REVOKE EXECUTE ON FUNCTION public.get_feed_posts(UUID, TEXT, INT, INT) FROM PUBLIC, anon;

-- ─── Event RSVP cancel ───
CREATE POLICY "Users can cancel RSVP"
  ON public.event_attendees FOR DELETE
  USING (auth.uid() = user_id);

-- ─── Q&A: upvote + accept answer ───
CREATE POLICY "Post authors can update answers on their posts"
  ON public.qa_answers FOR UPDATE
  USING (auth.uid() IN (SELECT author_id FROM public.qa_posts WHERE id = post_id));

CREATE OR REPLACE FUNCTION public.increment_qa_post_upvotes(p_post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.qa_posts
  SET upvotes = COALESCE(upvotes, 0) + 1
  WHERE id = p_post_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_qa_post_upvotes(UUID) TO authenticated;
