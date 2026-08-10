-- ==========================================
-- TRENDING TOPICS SYSTEM
-- ==========================================

-- 1. Trending topics table
CREATE TABLE IF NOT EXISTS public.trending_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL,
  relevant_fields TEXT[] DEFAULT '{}'::TEXT[],
  trend_score FLOAT DEFAULT 0,
  article_count INT DEFAULT 0,
  source_diversity INT DEFAULT 0,
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '72 hours'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Supporting articles for each topic
CREATE TABLE IF NOT EXISTS public.trending_topic_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES public.trending_topics(id) ON DELETE CASCADE,
  source_name TEXT,
  article_title TEXT NOT NULL,
  article_url TEXT NOT NULL,
  article_published_at TIMESTAMPTZ,
  article_image_url TEXT,
  article_description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Pipeline run log
CREATE TABLE IF NOT EXISTS public.trending_topics_update_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'running',
  topics_processed INT DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trending_topics_slug ON public.trending_topics(slug);
CREATE INDEX IF NOT EXISTS idx_trending_topics_category ON public.trending_topics(category);
CREATE INDEX IF NOT EXISTS idx_trending_topics_expires ON public.trending_topics(expires_at);
CREATE INDEX IF NOT EXISTS idx_trending_topics_score ON public.trending_topics(trend_score DESC);
CREATE INDEX IF NOT EXISTS idx_trending_topic_articles_topic ON public.trending_topic_articles(topic_id);

-- RLS
ALTER TABLE public.trending_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trending_topic_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trending_topics_update_log ENABLE ROW LEVEL SECURITY;

-- Everyone can read trending topics
CREATE POLICY "Trending topics readable by authenticated" ON public.trending_topics
  FOR SELECT TO authenticated USING (true);

-- Everyone can read articles
CREATE POLICY "Trending articles readable by authenticated" ON public.trending_topic_articles
  FOR SELECT TO authenticated USING (true);

-- Only service role can write (Edge Function uses service role key)
-- No INSERT/UPDATE/DELETE policies for authenticated role = only service role can write

-- Log is readable by admins only
CREATE POLICY "Update log readable by admins" ON public.trending_topics_update_log
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ==========================================
-- PERSONALIZED TRENDING TOPICS RPC
-- ==========================================

CREATE OR REPLACE FUNCTION public.get_personalized_trending_topics(
  p_user_id UUID,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  topic_name TEXT,
  slug TEXT,
  description TEXT,
  category TEXT,
  relevant_fields TEXT[],
  trend_score FLOAT,
  article_count INT,
  source_diversity INT,
  first_seen_at TIMESTAMPTZ,
  last_updated_at TIMESTAMPTZ,
  personalized_score FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  u_field TEXT;
  u_skills TEXT[];
  u_interests TEXT[];
BEGIN
  -- Get user profile data
  SELECT p.field, p.skills, p.interests
  INTO u_field, u_skills, u_interests
  FROM public.profiles p
  WHERE p.id = p_user_id;

  RETURN QUERY
  SELECT 
    t.id,
    t.topic_name,
    t.slug,
    t.description,
    t.category,
    t.relevant_fields,
    t.trend_score,
    t.article_count,
    t.source_diversity,
    t.first_seen_at,
    t.last_updated_at,
    (
      t.trend_score
      -- Field relevance: boost if user's field matches any of the topic's relevant_fields
      * CASE 
        WHEN u_field IS NOT NULL AND u_field != '' AND (
          u_field = ANY(t.relevant_fields) OR
          t.topic_name ILIKE '%' || u_field || '%' OR
          t.category ILIKE '%' || u_field || '%'
        ) THEN 2.0
        ELSE 1.0
      END
      -- Interest relevance
      * CASE 
        WHEN u_interests IS NOT NULL AND array_length(u_interests, 1) > 0 AND EXISTS (
          SELECT 1 FROM unnest(u_interests) i
          WHERE t.topic_name ILIKE '%' || i || '%'
            OR t.category ILIKE '%' || i || '%'
            OR t.description ILIKE '%' || i || '%'
        ) THEN 1.5
        ELSE 1.0
      END
      -- Skill relevance
      * CASE 
        WHEN u_skills IS NOT NULL AND array_length(u_skills, 1) > 0 AND EXISTS (
          SELECT 1 FROM unnest(u_skills) s
          WHERE t.topic_name ILIKE '%' || s || '%'
            OR t.description ILIKE '%' || s || '%'
        ) THEN 1.3
        ELSE 1.0
      END
      -- Freshness: boost recently updated topics
      * CASE 
        WHEN t.last_updated_at > now() - INTERVAL '6 hours' THEN 1.2
        WHEN t.last_updated_at > now() - INTERVAL '24 hours' THEN 1.0
        ELSE 0.8
      END
    )::FLOAT AS personalized_score
  FROM public.trending_topics t
  WHERE t.expires_at > now()
  ORDER BY personalized_score DESC, t.trend_score DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_personalized_trending_topics(UUID, INT) TO authenticated;

-- Simple function to get a single topic by slug with its articles
CREATE OR REPLACE FUNCTION public.get_topic_by_slug(p_slug TEXT)
RETURNS TABLE (
  id UUID,
  topic_name TEXT,
  slug TEXT,
  description TEXT,
  category TEXT,
  relevant_fields TEXT[],
  trend_score FLOAT,
  article_count INT,
  source_diversity INT,
  first_seen_at TIMESTAMPTZ,
  last_updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id, t.topic_name, t.slug, t.description, t.category,
    t.relevant_fields, t.trend_score, t.article_count, t.source_diversity,
    t.first_seen_at, t.last_updated_at
  FROM public.trending_topics t
  WHERE t.slug = p_slug;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_topic_by_slug(TEXT) TO authenticated;
