-- Migration: Add get_recommended_events RPC for personalized upcoming events

CREATE OR REPLACE FUNCTION public.get_recommended_events(p_user_id UUID, p_limit INT DEFAULT 3)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  type TEXT,
  location TEXT,
  date TIMESTAMPTZ,
  community_id UUID,
  creator_id UUID,
  attendee_count BIGINT,
  user_status TEXT,
  match_score FLOAT8
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
  SELECT field, skills, interests INTO u_field, u_skills, u_interests
  FROM public.profiles
  WHERE id = p_user_id;

  RETURN QUERY
  WITH event_stats AS (
    SELECT e.id AS event_id, COUNT(ea2.id) AS attendee_count
    FROM public.events e
    LEFT JOIN public.event_attendees ea2 ON ea2.event_id = e.id AND ea2.status = 'going'
    GROUP BY e.id
  )
  SELECT 
    e.id, 
    e.title, 
    e.description, 
    e.type, 
    e.location, 
    e.date, 
    e.community_id, 
    e.creator_id,
    COALESCE(es.attendee_count, 0) AS attendee_count,
    COALESCE(ea.status, 'none') AS user_status,
    (
      -- priority 1: going (add large weight so it sorts first)
      CASE WHEN ea.status = 'going' THEN 1000.0 ELSE 0 END +
      -- priority 2: interested
      CASE WHEN ea.status = 'interested' THEN 500.0 ELSE 0 END +
      -- priority 3: suggested (match field/type/skills/interests)
      CASE WHEN u_field IS NOT NULL AND u_field != '' AND (e.title ILIKE '%' || u_field || '%' OR e.description ILIKE '%' || u_field || '%') THEN 10.0 ELSE 0 END +
      CASE WHEN u_interests IS NOT NULL AND array_length(u_interests, 1) > 0 AND EXISTS (SELECT 1 FROM unnest(u_interests) i WHERE e.title ILIKE '%' || i || '%' OR e.description ILIKE '%' || i || '%') THEN 8.0 ELSE 0 END +
      CASE WHEN u_skills IS NOT NULL AND array_length(u_skills, 1) > 0 AND EXISTS (SELECT 1 FROM unnest(u_skills) s WHERE e.title ILIKE '%' || s || '%' OR e.description ILIKE '%' || s || '%') THEN 5.0 ELSE 0 END +
      CASE WHEN e.community_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.community_members cm WHERE cm.community_id = e.community_id AND cm.user_id = p_user_id) THEN 15.0 ELSE 0 END
    ) AS match_score
  FROM public.events e
  LEFT JOIN public.event_attendees ea ON ea.event_id = e.id AND ea.user_id = p_user_id
  LEFT JOIN event_stats es ON es.event_id = e.id
  WHERE e.date > now()
  ORDER BY 
    match_score DESC,
    e.date ASC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_recommended_events(UUID, INT) TO authenticated;
