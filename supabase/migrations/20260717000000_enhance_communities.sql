-- Add is_pinned to feed_posts
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

-- Create helper function for RLS
CREATE OR REPLACE FUNCTION public.is_community_admin(check_user_id UUID, check_community_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_members 
    WHERE user_id = check_user_id 
      AND community_id = check_community_id 
      AND role IN ('admin', 'owner', 'creator')
  ) OR EXISTS (
    SELECT 1 FROM public.communities
    WHERE id = check_community_id
      AND creator_id = check_user_id
  );
$$;

-- Update get_feed_posts RPC to include is_pinned
DROP FUNCTION IF EXISTS public.get_feed_posts(UUID, TEXT, INT, INT);

CREATE OR REPLACE FUNCTION public.get_feed_posts(
  p_user_id UUID, p_filter TEXT DEFAULT 'recent', p_limit INT DEFAULT 20, p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID, author_id UUID, type public.feed_post_type, content TEXT, media_url TEXT, community_id UUID,
  edited BOOLEAN, edited_at TIMESTAMPTZ, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, is_pinned BOOLEAN,
  author_name TEXT, author_avatar_url TEXT, author_field TEXT, author_college TEXT, author_is_verified BOOLEAN,
  like_count BIGINT, comment_count BIGINT, user_liked BOOLEAN, user_bookmarked BOOLEAN, feed_score FLOAT8
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT
    fp.id, fp.author_id, fp.type, fp.content, fp.media_url, fp.community_id, fp.edited, fp.edited_at, fp.created_at, fp.updated_at, COALESCE(fp.is_pinned, false) AS is_pinned,
    pr.name AS author_name, pr.avatar_url AS author_avatar_url, pr.field AS author_field, pr.college AS author_college, COALESCE(pr.is_verified, false) AS author_is_verified,
    COALESCE(lk.like_count, 0) AS like_count, COALESCE(cm.comment_count, 0) AS comment_count,
    (ul.user_id IS NOT NULL) AS user_liked, (ub.user_id IS NOT NULL) AS user_bookmarked,
    (
      (EXTRACT(EPOCH FROM fp.created_at) / 3600000.0) +
      CASE WHEN EXISTS (SELECT 1 FROM public.connections c WHERE c.status = 'accepted' AND ((c.requester_id = p_user_id AND c.addressee_id = fp.author_id) OR (c.addressee_id = p_user_id AND c.requester_id = fp.author_id))) THEN 0.05 ELSE 0 END +
      CASE WHEN fp.community_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.community_members cm2 WHERE cm2.community_id = fp.community_id AND cm2.user_id = p_user_id) THEN 0.03 ELSE 0 END +
      LEAST(COALESCE((SELECT COUNT(*) FROM public.feed_post_likes l2 WHERE l2.post_id = fp.id AND l2.created_at > now() - INTERVAL '48 hours') * 0.005 + (SELECT COUNT(*) FROM public.feed_post_comments c2 WHERE c2.post_id = fp.id AND c2.created_at > now() - INTERVAL '48 hours') * 0.008, 0), 0.1)
    )::FLOAT8 AS feed_score
  FROM public.feed_posts fp
  JOIN public.profiles pr ON pr.id = fp.author_id
  LEFT JOIN (SELECT post_id, COUNT(*) AS like_count FROM public.feed_post_likes GROUP BY post_id) lk ON lk.post_id = fp.id
  LEFT JOIN (SELECT post_id, COUNT(*) AS comment_count FROM public.feed_post_comments GROUP BY post_id) cm ON cm.post_id = fp.id
  LEFT JOIN public.feed_post_likes ul ON ul.post_id = fp.id AND ul.user_id = p_user_id
  LEFT JOIN public.feed_post_bookmarks ub ON ub.post_id = fp.id AND ub.user_id = p_user_id
  ORDER BY 
    fp.is_pinned DESC,
    CASE WHEN p_filter = 'trending' THEN feed_score END DESC NULLS LAST, 
    CASE WHEN p_filter = 'recent' THEN fp.created_at END DESC NULLS LAST
  LIMIT p_limit OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_feed_posts(UUID, TEXT, INT, INT) TO authenticated;

-- Update RLS for feed_posts
DROP POLICY IF EXISTS "Delete feed posts" ON public.feed_posts;
CREATE POLICY "Delete feed posts" ON public.feed_posts FOR DELETE USING (
  auth.uid() = author_id 
  OR 
  (community_id IS NOT NULL AND public.is_community_admin(auth.uid(), community_id))
);

DROP POLICY IF EXISTS "Update feed posts" ON public.feed_posts;
CREATE POLICY "Update feed posts" ON public.feed_posts FOR UPDATE USING (
  auth.uid() = author_id 
  OR 
  (community_id IS NOT NULL AND public.is_community_admin(auth.uid(), community_id))
);

-- Update RLS for feed_post_comments
DROP POLICY IF EXISTS "Delete comments" ON public.feed_post_comments;
CREATE POLICY "Delete comments" ON public.feed_post_comments FOR DELETE USING (
  auth.uid() = author_id 
  OR 
  (
    EXISTS (
      SELECT 1 FROM public.feed_posts fp 
      WHERE fp.id = feed_post_comments.post_id 
      AND fp.community_id IS NOT NULL 
      AND public.is_community_admin(auth.uid(), fp.community_id)
    )
  )
);

-- Update RLS for community_members
DROP POLICY IF EXISTS "Update community members" ON public.community_members;
CREATE POLICY "Update community members" ON public.community_members FOR UPDATE USING (
  public.is_community_admin(auth.uid(), community_id)
);

DROP POLICY IF EXISTS "Remove community members" ON public.community_members;
-- The old policy was "Leave communities" ON public.community_members FOR DELETE USING (auth.uid() = user_id);
-- We need to replace it so users can leave OR admins can remove.
DROP POLICY IF EXISTS "Leave communities" ON public.community_members;
CREATE POLICY "Leave or remove community members" ON public.community_members FOR DELETE USING (
  auth.uid() = user_id 
  OR 
  public.is_community_admin(auth.uid(), community_id)
);
