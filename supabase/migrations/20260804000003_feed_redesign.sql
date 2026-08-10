-- Add tags to feed_posts
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::TEXT[];

-- Create trigger function to extract hashtags from content on insert/update
CREATE OR REPLACE FUNCTION public.extract_hashtags()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  matches TEXT[];
BEGIN
  -- Extract all hashtags (words starting with # containing alphanumeric chars)
  SELECT ARRAY(
    SELECT DISTINCT SUBSTRING(match[1] FROM 2)
    FROM regexp_matches(NEW.content, '#([A-Za-z0-9_]+)', 'g') AS match
  ) INTO matches;
  
  NEW.tags = COALESCE(matches, '{}'::TEXT[]);
  RETURN NEW;
END;
$$;

-- Apply trigger to feed_posts
DROP TRIGGER IF EXISTS feed_posts_extract_hashtags ON public.feed_posts;
CREATE TRIGGER feed_posts_extract_hashtags
  BEFORE INSERT OR UPDATE OF content ON public.feed_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.extract_hashtags();

-- Update get_feed_posts RPC to include tags
DROP FUNCTION IF EXISTS public.get_feed_posts(UUID, TEXT, INT, INT);

CREATE OR REPLACE FUNCTION public.get_feed_posts(
  p_user_id UUID, p_filter TEXT DEFAULT 'recent', p_limit INT DEFAULT 20, p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID, author_id UUID, type public.feed_post_type, content TEXT, media_url TEXT, community_id UUID,
  edited BOOLEAN, edited_at TIMESTAMPTZ, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, is_pinned BOOLEAN, tags TEXT[],
  author_name TEXT, author_avatar_url TEXT, author_field TEXT, author_college TEXT, author_is_verified BOOLEAN,
  like_count BIGINT, comment_count BIGINT, user_liked BOOLEAN, user_bookmarked BOOLEAN, feed_score FLOAT8
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT
    fp.id, fp.author_id, fp.type, fp.content, fp.media_url, fp.community_id, fp.edited, fp.edited_at, fp.created_at, fp.updated_at, COALESCE(fp.is_pinned, false) AS is_pinned, COALESCE(fp.tags, '{}'::TEXT[]) AS tags,
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


-- Create RPC for trending topics
CREATE OR REPLACE FUNCTION public.get_trending_topics(p_limit INT DEFAULT 5)
RETURNS TABLE (
  tag TEXT,
  count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT unnest(fp.tags) AS tag, COUNT(*) AS count
  FROM public.feed_posts fp
  WHERE fp.created_at > (now() - INTERVAL '7 days')
  GROUP BY tag
  ORDER BY count DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_trending_topics(INT) TO authenticated;

-- Create RPC for upcoming events
CREATE OR REPLACE FUNCTION public.get_upcoming_events(p_limit INT DEFAULT 3)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  type TEXT,
  location TEXT,
  date TIMESTAMPTZ,
  community_id UUID,
  creator_id UUID,
  attendee_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id, e.title, e.description, e.type, e.location, e.date, e.community_id, e.creator_id,
    COALESCE(ac.count, 0) AS attendee_count
  FROM public.events e
  LEFT JOIN (SELECT event_id, COUNT(*) as count FROM public.event_attendees GROUP BY event_id) ac ON ac.event_id = e.id
  WHERE e.date > now()
  ORDER BY e.date ASC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_upcoming_events(INT) TO authenticated;
