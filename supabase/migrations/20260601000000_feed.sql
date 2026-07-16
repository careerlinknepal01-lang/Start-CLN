-- ============================================================
-- Feed System Migration
-- Tables: feed_posts, feed_post_likes, feed_post_comments,
--         feed_post_bookmarks, feed_post_reports
-- + Feed ranking Postgres function
-- + Notification triggers for likes & comments
-- ============================================================

-- 1. Extend notification_type enum
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'post_like';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'post_comment';

-- 2. Post type enum
DO $$ BEGIN
  CREATE TYPE public.feed_post_type AS ENUM (
    'achievement',
    'project_update',
    'opportunity',
    'general',
    'question'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Feed Posts table
CREATE TABLE IF NOT EXISTS public.feed_posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        public.feed_post_type NOT NULL DEFAULT 'general',
  content     TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 3000),
  media_url   TEXT,
  -- optional community association
  community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL,
  -- soft edit tracking
  edited      BOOLEAN NOT NULL DEFAULT false,
  edited_at   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_posts REPLICA IDENTITY FULL;

CREATE POLICY "Feed posts are viewable by authenticated users"
  ON public.feed_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create feed posts"
  ON public.feed_posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update their own feed posts"
  ON public.feed_posts FOR UPDATE TO authenticated
  USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete their own feed posts"
  ON public.feed_posts FOR DELETE TO authenticated
  USING (auth.uid() = author_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feed_posts_author
  ON public.feed_posts (author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_posts_created
  ON public.feed_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_posts_community
  ON public.feed_posts (community_id, created_at DESC);

-- Updated_at trigger
CREATE TRIGGER feed_posts_updated
  BEFORE UPDATE ON public.feed_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 4. Feed Post Likes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.feed_post_likes (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id  UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

ALTER TABLE public.feed_post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes viewable by authenticated users"
  ON public.feed_post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can like posts"
  ON public.feed_post_likes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts"
  ON public.feed_post_likes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_feed_post_likes_post
  ON public.feed_post_likes (post_id);
CREATE INDEX IF NOT EXISTS idx_feed_post_likes_user
  ON public.feed_post_likes (user_id);

-- ============================================================
-- 5. Feed Post Comments
-- ============================================================
CREATE TABLE IF NOT EXISTS public.feed_post_comments (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id   UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.feed_post_comments(id) ON DELETE CASCADE,
  content   TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feed_post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments viewable by authenticated users"
  ON public.feed_post_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can comment"
  ON public.feed_post_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update their comments"
  ON public.feed_post_comments FOR UPDATE TO authenticated
  USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete their comments"
  ON public.feed_post_comments FOR DELETE TO authenticated
  USING (auth.uid() = author_id);

CREATE INDEX IF NOT EXISTS idx_feed_post_comments_post
  ON public.feed_post_comments (post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_feed_post_comments_author
  ON public.feed_post_comments (author_id);

CREATE TRIGGER feed_post_comments_updated
  BEFORE UPDATE ON public.feed_post_comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 6. Feed Post Bookmarks
-- ============================================================
CREATE TABLE IF NOT EXISTS public.feed_post_bookmarks (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id  UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

ALTER TABLE public.feed_post_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bookmarks viewable by owner"
  ON public.feed_post_bookmarks FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can bookmark posts"
  ON public.feed_post_bookmarks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove bookmarks"
  ON public.feed_post_bookmarks FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_feed_post_bookmarks_user
  ON public.feed_post_bookmarks (user_id, created_at DESC);

-- ============================================================
-- 7. Feed Post Reports
-- ============================================================
CREATE TABLE IF NOT EXISTS public.feed_post_reports (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id  UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason   TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

ALTER TABLE public.feed_post_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can report posts"
  ON public.feed_post_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own reports"
  ON public.feed_post_reports FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 8. Notification trigger — likes
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_feed_post_like()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  liker_name TEXT;
  post_author UUID;
BEGIN
  SELECT name INTO liker_name FROM public.profiles WHERE id = NEW.user_id;
  SELECT author_id INTO post_author FROM public.feed_posts WHERE id = NEW.post_id;
  -- Don't notify yourself
  IF post_author IS NOT NULL AND post_author <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, content, related_id)
    VALUES (
      post_author,
      'post_like',
      COALESCE(liker_name, 'Someone') || ' liked your post',
      NEW.post_id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER feed_post_like_notify
  AFTER INSERT ON public.feed_post_likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_feed_post_like();

-- ============================================================
-- 9. Notification trigger — comments
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_feed_post_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  commenter_name TEXT;
  post_author UUID;
BEGIN
  SELECT name INTO commenter_name FROM public.profiles WHERE id = NEW.author_id;
  SELECT author_id INTO post_author FROM public.feed_posts WHERE id = NEW.post_id;
  IF post_author IS NOT NULL AND post_author <> NEW.author_id THEN
    INSERT INTO public.notifications (user_id, type, content, related_id)
    VALUES (
      post_author,
      'post_comment',
      COALESCE(commenter_name, 'Someone') || ' commented on your post',
      NEW.post_id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER feed_post_comment_notify
  AFTER INSERT ON public.feed_post_comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_feed_post_comment();

-- ============================================================
-- 10. Feed ranking function
-- Returns posts enriched with counts + user interaction state
-- + a feed_score for ordering
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_feed_posts(
  p_user_id  UUID,
  p_filter   TEXT DEFAULT 'recent',  -- 'recent' | 'trending'
  p_limit    INT  DEFAULT 20,
  p_offset   INT  DEFAULT 0
)
RETURNS TABLE (
  id            UUID,
  author_id     UUID,
  type          public.feed_post_type,
  content       TEXT,
  media_url     TEXT,
  community_id  UUID,
  edited        BOOLEAN,
  edited_at     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ,
  updated_at    TIMESTAMPTZ,
  -- author info
  author_name         TEXT,
  author_avatar_url   TEXT,
  author_field        TEXT,
  author_college      TEXT,
  author_is_verified  BOOLEAN,
  -- counts
  like_count    BIGINT,
  comment_count BIGINT,
  -- user state
  user_liked    BOOLEAN,
  user_bookmarked BOOLEAN,
  -- ranking
  feed_score    FLOAT8
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    fp.id,
    fp.author_id,
    fp.type,
    fp.content,
    fp.media_url,
    fp.community_id,
    fp.edited,
    fp.edited_at,
    fp.created_at,
    fp.updated_at,
    -- author
    pr.name        AS author_name,
    pr.avatar_url  AS author_avatar_url,
    pr.field       AS author_field,
    pr.college     AS author_college,
    COALESCE(pr.is_verified, false) AS author_is_verified,
    -- counts
    COALESCE(lk.like_count, 0)    AS like_count,
    COALESCE(cm.comment_count, 0) AS comment_count,
    -- user interaction
    (ul.user_id IS NOT NULL) AS user_liked,
    (ub.user_id IS NOT NULL) AS user_bookmarked,
    -- feed score
    (
      -- base recency score: hours since epoch / 1000 (normalised)
      EXTRACT(EPOCH FROM fp.created_at) / 3600000.0
      -- connection boost: authored by someone the user is connected to
      + CASE WHEN EXISTS (
          SELECT 1 FROM public.connections c
          WHERE c.status = 'accepted'
            AND ((c.requester_id = p_user_id AND c.addressee_id = fp.author_id)
                 OR (c.addressee_id = p_user_id AND c.requester_id = fp.author_id))
        ) THEN 0.05 ELSE 0 END
      -- community boost: posted in a community the user is a member of
      + CASE WHEN fp.community_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.community_members cm2
          WHERE cm2.community_id = fp.community_id AND cm2.user_id = p_user_id
        ) THEN 0.03 ELSE 0 END
      -- trending boost: likes + comments in last 48h (capped at 0.1)
      + LEAST(
          COALESCE(
            (SELECT COUNT(*) FROM public.feed_post_likes l2
             WHERE l2.post_id = fp.id
               AND l2.created_at > now() - INTERVAL '48 hours') * 0.005
            +
            (SELECT COUNT(*) FROM public.feed_post_comments c2
             WHERE c2.post_id = fp.id
               AND c2.created_at > now() - INTERVAL '48 hours') * 0.008,
            0
          ),
          0.1
        )
    )::FLOAT8 AS feed_score
  FROM public.feed_posts fp
  JOIN public.profiles pr ON pr.id = fp.author_id
  LEFT JOIN (
    SELECT post_id, COUNT(*) AS like_count
    FROM public.feed_post_likes
    GROUP BY post_id
  ) lk ON lk.post_id = fp.id
  LEFT JOIN (
    SELECT post_id, COUNT(*) AS comment_count
    FROM public.feed_post_comments
    GROUP BY post_id
  ) cm ON cm.post_id = fp.id
  LEFT JOIN public.feed_post_likes ul
    ON ul.post_id = fp.id AND ul.user_id = p_user_id
  LEFT JOIN public.feed_post_bookmarks ub
    ON ub.post_id = fp.id AND ub.user_id = p_user_id
  ORDER BY
    CASE WHEN p_filter = 'trending' THEN feed_score END DESC NULLS LAST,
    CASE WHEN p_filter = 'recent'   THEN fp.created_at END DESC NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_feed_posts(UUID, TEXT, INT, INT) TO authenticated;

-- Add feed_posts to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_post_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_post_comments;
