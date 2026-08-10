-- ============================================================
-- CAREERLINK NEPAL - MASTER PRODUCTION SCHEMA
-- ============================================================
-- Execute this entire file in the Supabase SQL Editor.
-- It will safely create all ENUMs, Tables, Functions, Triggers,
-- and RLS policies for a fresh production setup.
-- ============================================================

-- 1. ENUMS
DO $$ BEGIN CREATE TYPE public.connection_status AS ENUM ('pending', 'accepted', 'rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.notification_type AS ENUM ('message', 'connection_request', 'connection_accepted', 'post_like', 'post_comment'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.feed_post_type AS ENUM ('achievement', 'project_update', 'opportunity', 'general', 'question'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- 3. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  college TEXT NOT NULL DEFAULT '',
  field TEXT NOT NULL DEFAULT '',
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  cover_image TEXT,
  skills TEXT[] DEFAULT '{}'::TEXT[],
  interests TEXT[] DEFAULT '{}'::TEXT[],
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  is_verified BOOLEAN DEFAULT false,
  role TEXT DEFAULT 'student',
  website_url TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  location TEXT,
  year_semester TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS profiles_updated ON public.profiles;
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. CONNECTIONS
CREATE TABLE IF NOT EXISTS public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.connection_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(requester_id, addressee_id),
  CHECK (requester_id <> addressee_id)
);
DROP TRIGGER IF EXISTS connections_updated ON public.connections;
CREATE TRIGGER connections_updated BEFORE UPDATE ON public.connections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_pair ON public.messages (sender_id, receiver_id, created_at);

-- 6. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type public.notification_type NOT NULL,
  content TEXT NOT NULL,
  related_id UUID,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  xp_reward INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.profile_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id, achievement_id)
);

-- 8. COMMUNITIES
CREATE TABLE IF NOT EXISTS public.communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  avatar_url TEXT,
  cover_url TEXT,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS communities_updated ON public.communities;
CREATE TRIGGER communities_updated BEFORE UPDATE ON public.communities FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(community_id, user_id)
);

-- 9. EVENTS
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  location TEXT,
  date TIMESTAMPTZ NOT NULL,
  community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS events_updated ON public.events;
CREATE TRIGGER events_updated BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'going',
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- 10. FEED SYSTEM
CREATE TABLE IF NOT EXISTS public.feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type public.feed_post_type NOT NULL DEFAULT 'general',
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 3000),
  media_url TEXT,
  community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL,
  edited BOOLEAN NOT NULL DEFAULT false,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS feed_posts_updated ON public.feed_posts;
CREATE TRIGGER feed_posts_updated BEFORE UPDATE ON public.feed_posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_feed_posts_author ON public.feed_posts (author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_posts_created ON public.feed_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_posts_community ON public.feed_posts (community_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.feed_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_feed_post_likes_post ON public.feed_post_likes (post_id);
CREATE INDEX IF NOT EXISTS idx_feed_post_likes_user ON public.feed_post_likes (user_id);

CREATE TABLE IF NOT EXISTS public.feed_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.feed_post_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS feed_post_comments_updated ON public.feed_post_comments;
CREATE TRIGGER feed_post_comments_updated BEFORE UPDATE ON public.feed_post_comments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_feed_post_comments_post ON public.feed_post_comments (post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_feed_post_comments_author ON public.feed_post_comments (author_id);

CREATE TABLE IF NOT EXISTS public.feed_post_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.feed_post_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_post_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_post_reports ENABLE ROW LEVEL SECURITY;

-- Clean existing policies safely
DO $$ 
DECLARE row RECORD; 
BEGIN 
  FOR row IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' 
  LOOP 
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', row.policyname, row.tablename); 
  END LOOP; 
END $$;

-- Profiles
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Connections
CREATE POLICY "View connections" ON public.connections FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Create connections" ON public.connections FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Update connections" ON public.connections FOR UPDATE USING (auth.uid() = addressee_id OR auth.uid() = requester_id);
CREATE POLICY "Delete connections" ON public.connections FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Messages
CREATE POLICY "View messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Update messages" ON public.messages FOR UPDATE USING (auth.uid() = receiver_id);

-- Notifications
CREATE POLICY "View notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Update notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Insert notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Communities
CREATE POLICY "View communities" ON public.communities FOR SELECT USING (true);
CREATE POLICY "Create communities" ON public.communities FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Update communities" ON public.communities FOR UPDATE USING (auth.uid() = creator_id);

-- Community Members
CREATE POLICY "View community members" ON public.community_members FOR SELECT USING (true);
CREATE POLICY "Join communities" ON public.community_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Leave communities" ON public.community_members FOR DELETE USING (auth.uid() = user_id);

-- Events
CREATE POLICY "View events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Create events" ON public.events FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Update events" ON public.events FOR UPDATE USING (auth.uid() = creator_id);

-- Event Attendees
CREATE POLICY "View event attendees" ON public.event_attendees FOR SELECT USING (true);
CREATE POLICY "RSVP to events" ON public.event_attendees FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update RSVP" ON public.event_attendees FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Delete RSVP" ON public.event_attendees FOR DELETE USING (auth.uid() = user_id);

-- Feed Posts
CREATE POLICY "View feed posts" ON public.feed_posts FOR SELECT USING (true);
CREATE POLICY "Create feed posts" ON public.feed_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Update feed posts" ON public.feed_posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Delete feed posts" ON public.feed_posts FOR DELETE USING (auth.uid() = author_id);

-- Post Likes
CREATE POLICY "View post likes" ON public.feed_post_likes FOR SELECT USING (true);
CREATE POLICY "Like posts" ON public.feed_post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Unlike posts" ON public.feed_post_likes FOR DELETE USING (auth.uid() = user_id);

-- Post Comments
CREATE POLICY "View post comments" ON public.feed_post_comments FOR SELECT USING (true);
CREATE POLICY "Comment on posts" ON public.feed_post_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Update comments" ON public.feed_post_comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Delete comments" ON public.feed_post_comments FOR DELETE USING (auth.uid() = author_id);

-- Bookmarks
CREATE POLICY "View bookmarks" ON public.feed_post_bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Create bookmarks" ON public.feed_post_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Delete bookmarks" ON public.feed_post_bookmarks FOR DELETE USING (auth.uid() = user_id);

-- Reports
CREATE POLICY "View reports" ON public.feed_post_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Create reports" ON public.feed_post_reports FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================

-- Auth User Creation Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, college, field)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'college', ''),
    COALESCE(NEW.raw_user_meta_data->>'field', '')
  );
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Connection Notifications
CREATE OR REPLACE FUNCTION public.handle_connection_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  requester_name TEXT;
  addressee_name TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT name INTO requester_name FROM public.profiles WHERE id = NEW.requester_id;
    INSERT INTO public.notifications (user_id, type, content, related_id)
    VALUES (NEW.addressee_id, 'connection_request', COALESCE(requester_name, 'Someone') || ' sent you a connection request', NEW.id);
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status <> 'accepted' THEN
    SELECT name INTO addressee_name FROM public.profiles WHERE id = NEW.addressee_id;
    INSERT INTO public.notifications (user_id, type, content, related_id)
    VALUES (NEW.requester_id, 'connection_accepted', COALESCE(addressee_name, 'Someone') || ' accepted your connection request', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS connection_notify ON public.connections;
CREATE TRIGGER connection_notify AFTER INSERT OR UPDATE ON public.connections FOR EACH ROW EXECUTE FUNCTION public.handle_connection_change();

-- Message Notifications
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sender_name TEXT;
BEGIN
  SELECT name INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;
  INSERT INTO public.notifications (user_id, type, content, related_id)
  VALUES (NEW.receiver_id, 'message', COALESCE(sender_name, 'Someone') || ': ' || LEFT(NEW.content, 80), NEW.id);
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS message_notify ON public.messages;
CREATE TRIGGER message_notify AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.handle_new_message();

-- Like Notifications
CREATE OR REPLACE FUNCTION public.handle_feed_post_like()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE liker_name TEXT; post_author UUID;
BEGIN
  SELECT name INTO liker_name FROM public.profiles WHERE id = NEW.user_id;
  SELECT author_id INTO post_author FROM public.feed_posts WHERE id = NEW.post_id;
  IF post_author IS NOT NULL AND post_author <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, content, related_id)
    VALUES (post_author, 'post_like', COALESCE(liker_name, 'Someone') || ' liked your post', NEW.post_id);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS feed_post_like_notify ON public.feed_post_likes;
CREATE TRIGGER feed_post_like_notify AFTER INSERT ON public.feed_post_likes FOR EACH ROW EXECUTE FUNCTION public.handle_feed_post_like();

-- Comment Notifications
CREATE OR REPLACE FUNCTION public.handle_feed_post_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE commenter_name TEXT; post_author UUID;
BEGIN
  SELECT name INTO commenter_name FROM public.profiles WHERE id = NEW.author_id;
  SELECT author_id INTO post_author FROM public.feed_posts WHERE id = NEW.post_id;
  IF post_author IS NOT NULL AND post_author <> NEW.author_id THEN
    INSERT INTO public.notifications (user_id, type, content, related_id)
    VALUES (post_author, 'post_comment', COALESCE(commenter_name, 'Someone') || ' commented on your post', NEW.post_id);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS feed_post_comment_notify ON public.feed_post_comments;
CREATE TRIGGER feed_post_comment_notify AFTER INSERT ON public.feed_post_comments FOR EACH ROW EXECUTE FUNCTION public.handle_feed_post_comment();

-- Realtime Configuration
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.connections REPLICA IDENTITY FULL;
ALTER TABLE public.feed_posts REPLICA IDENTITY FULL;

-- Get Feed Posts Function
CREATE OR REPLACE FUNCTION public.get_feed_posts(
  p_user_id UUID, p_filter TEXT DEFAULT 'recent', p_limit INT DEFAULT 20, p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID, author_id UUID, type public.feed_post_type, content TEXT, media_url TEXT, community_id UUID,
  edited BOOLEAN, edited_at TIMESTAMPTZ, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ,
  author_name TEXT, author_avatar_url TEXT, author_field TEXT, author_college TEXT, author_is_verified BOOLEAN,
  like_count BIGINT, comment_count BIGINT, user_liked BOOLEAN, user_bookmarked BOOLEAN, feed_score FLOAT8
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT
    fp.id, fp.author_id, fp.type, fp.content, fp.media_url, fp.community_id, fp.edited, fp.edited_at, fp.created_at, fp.updated_at,
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
  ORDER BY CASE WHEN p_filter = 'trending' THEN feed_score END DESC NULLS LAST, CASE WHEN p_filter = 'recent' THEN fp.created_at END DESC NULLS LAST
  LIMIT p_limit OFFSET p_offset;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_feed_posts(UUID, TEXT, INT, INT) TO authenticated;

-- ============================================================
-- STORAGE CONFIGURATION
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES 
('avatars', 'avatars', true),
('covers', 'covers', true),
('post-images', 'post-images', true),
('community-images', 'community-images', true)
ON CONFLICT (id) DO NOTHING;

-- Avatars
DROP POLICY IF EXISTS "Avatars publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own avatar" ON storage.objects;
CREATE POLICY "Avatars publicly readable" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own avatar" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Covers
DROP POLICY IF EXISTS "Covers publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own cover" ON storage.objects;
DROP POLICY IF EXISTS "Users update own cover" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own cover" ON storage.objects;
CREATE POLICY "Covers publicly readable" ON storage.objects FOR SELECT USING (bucket_id = 'covers');
CREATE POLICY "Users upload own cover" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own cover" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own cover" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Post Images
DROP POLICY IF EXISTS "Post images publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own post images" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own post images" ON storage.objects;
CREATE POLICY "Post images publicly readable" ON storage.objects FOR SELECT USING (bucket_id = 'post-images');
CREATE POLICY "Users upload own post images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own post images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Community Images
DROP POLICY IF EXISTS "Community images publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Users upload community images" ON storage.objects;
CREATE POLICY "Community images publicly readable" ON storage.objects FOR SELECT USING (bucket_id = 'community-images');
CREATE POLICY "Users upload community images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'community-images');
- -   A d d   t a g s   t o   f e e d _ p o s t s  
 A L T E R   T A B L E   p u b l i c . f e e d _ p o s t s   A D D   C O L U M N   I F   N O T   E X I S T S   t a g s   T E X T [ ]   D E F A U L T   ' { } ' : : T E X T [ ] ;  
  
 - -   C r e a t e   t r i g g e r   f u n c t i o n   t o   e x t r a c t   h a s h t a g s   f r o m   c o n t e n t   o n   i n s e r t / u p d a t e  
 C R E A T E   O R   R E P L A C E   F U N C T I O N   p u b l i c . e x t r a c t _ h a s h t a g s ( )  
 R E T U R N S   T R I G G E R  
 L A N G U A G E   p l p g s q l  
 S E C U R I T Y   D E F I N E R  
 S E T   s e a r c h _ p a t h   =   p u b l i c  
 A S   $ $  
 D E C L A R E  
     m a t c h e s   T E X T [ ] ;  
 B E G I N  
     - -   E x t r a c t   a l l   h a s h t a g s   ( w o r d s   s t a r t i n g   w i t h   #   c o n t a i n i n g   a l p h a n u m e r i c   c h a r s )  
     S E L E C T   A R R A Y (  
         S E L E C T   D I S T I N C T   S U B S T R I N G ( m a t c h [ 1 ]   F R O M   2 )  
         F R O M   r e g e x p _ m a t c h e s ( N E W . c o n t e n t ,   ' # ( [ A - Z a - z 0 - 9 _ ] + ) ' ,   ' g ' )   A S   m a t c h  
     )   I N T O   m a t c h e s ;  
      
     N E W . t a g s   =   C O A L E S C E ( m a t c h e s ,   ' { } ' : : T E X T [ ] ) ;  
     R E T U R N   N E W ;  
 E N D ;  
 $ $ ;  
  
 - -   A p p l y   t r i g g e r   t o   f e e d _ p o s t s  
 D R O P   T R I G G E R   I F   E X I S T S   f e e d _ p o s t s _ e x t r a c t _ h a s h t a g s   O N   p u b l i c . f e e d _ p o s t s ;  
 C R E A T E   T R I G G E R   f e e d _ p o s t s _ e x t r a c t _ h a s h t a g s  
     B E F O R E   I N S E R T   O R   U P D A T E   O F   c o n t e n t   O N   p u b l i c . f e e d _ p o s t s  
     F O R   E A C H   R O W  
     E X E C U T E   F U N C T I O N   p u b l i c . e x t r a c t _ h a s h t a g s ( ) ;  
  
 - -   U p d a t e   g e t _ f e e d _ p o s t s   R P C   t o   i n c l u d e   t a g s  
 D R O P   F U N C T I O N   I F   E X I S T S   p u b l i c . g e t _ f e e d _ p o s t s ( U U I D ,   T E X T ,   I N T ,   I N T ) ;  
  
 C R E A T E   O R   R E P L A C E   F U N C T I O N   p u b l i c . g e t _ f e e d _ p o s t s (  
     p _ u s e r _ i d   U U I D ,   p _ f i l t e r   T E X T   D E F A U L T   ' r e c e n t ' ,   p _ l i m i t   I N T   D E F A U L T   2 0 ,   p _ o f f s e t   I N T   D E F A U L T   0  
 )  
 R E T U R N S   T A B L E   (  
     i d   U U I D ,   a u t h o r _ i d   U U I D ,   t y p e   p u b l i c . f e e d _ p o s t _ t y p e ,   c o n t e n t   T E X T ,   m e d i a _ u r l   T E X T ,   c o m m u n i t y _ i d   U U I D ,  
     e d i t e d   B O O L E A N ,   e d i t e d _ a t   T I M E S T A M P T Z ,   c r e a t e d _ a t   T I M E S T A M P T Z ,   u p d a t e d _ a t   T I M E S T A M P T Z ,   i s _ p i n n e d   B O O L E A N ,   t a g s   T E X T [ ] ,  
     a u t h o r _ n a m e   T E X T ,   a u t h o r _ a v a t a r _ u r l   T E X T ,   a u t h o r _ f i e l d   T E X T ,   a u t h o r _ c o l l e g e   T E X T ,   a u t h o r _ i s _ v e r i f i e d   B O O L E A N ,  
     l i k e _ c o u n t   B I G I N T ,   c o m m e n t _ c o u n t   B I G I N T ,   u s e r _ l i k e d   B O O L E A N ,   u s e r _ b o o k m a r k e d   B O O L E A N ,   f e e d _ s c o r e   F L O A T 8  
 )   L A N G U A G E   p l p g s q l   S E C U R I T Y   D E F I N E R   S E T   s e a r c h _ p a t h   =   p u b l i c   A S   $ $  
 B E G I N  
     R E T U R N   Q U E R Y  
     S E L E C T  
         f p . i d ,   f p . a u t h o r _ i d ,   f p . t y p e ,   f p . c o n t e n t ,   f p . m e d i a _ u r l ,   f p . c o m m u n i t y _ i d ,   f p . e d i t e d ,   f p . e d i t e d _ a t ,   f p . c r e a t e d _ a t ,   f p . u p d a t e d _ a t ,   C O A L E S C E ( f p . i s _ p i n n e d ,   f a l s e )   A S   i s _ p i n n e d ,   C O A L E S C E ( f p . t a g s ,   ' { } ' : : T E X T [ ] )   A S   t a g s ,  
         p r . n a m e   A S   a u t h o r _ n a m e ,   p r . a v a t a r _ u r l   A S   a u t h o r _ a v a t a r _ u r l ,   p r . f i e l d   A S   a u t h o r _ f i e l d ,   p r . c o l l e g e   A S   a u t h o r _ c o l l e g e ,   C O A L E S C E ( p r . i s _ v e r i f i e d ,   f a l s e )   A S   a u t h o r _ i s _ v e r i f i e d ,  
         C O A L E S C E ( l k . l i k e _ c o u n t ,   0 )   A S   l i k e _ c o u n t ,   C O A L E S C E ( c m . c o m m e n t _ c o u n t ,   0 )   A S   c o m m e n t _ c o u n t ,  
         ( u l . u s e r _ i d   I S   N O T   N U L L )   A S   u s e r _ l i k e d ,   ( u b . u s e r _ i d   I S   N O T   N U L L )   A S   u s e r _ b o o k m a r k e d ,  
         (  
             ( E X T R A C T ( E P O C H   F R O M   f p . c r e a t e d _ a t )   /   3 6 0 0 0 0 0 . 0 )   +  
             C A S E   W H E N   E X I S T S   ( S E L E C T   1   F R O M   p u b l i c . c o n n e c t i o n s   c   W H E R E   c . s t a t u s   =   ' a c c e p t e d '   A N D   ( ( c . r e q u e s t e r _ i d   =   p _ u s e r _ i d   A N D   c . a d d r e s s e e _ i d   =   f p . a u t h o r _ i d )   O R   ( c . a d d r e s s e e _ i d   =   p _ u s e r _ i d   A N D   c . r e q u e s t e r _ i d   =   f p . a u t h o r _ i d ) ) )   T H E N   0 . 0 5   E L S E   0   E N D   +  
             C A S E   W H E N   f p . c o m m u n i t y _ i d   I S   N O T   N U L L   A N D   E X I S T S   ( S E L E C T   1   F R O M   p u b l i c . c o m m u n i t y _ m e m b e r s   c m 2   W H E R E   c m 2 . c o m m u n i t y _ i d   =   f p . c o m m u n i t y _ i d   A N D   c m 2 . u s e r _ i d   =   p _ u s e r _ i d )   T H E N   0 . 0 3   E L S E   0   E N D   +  
             L E A S T ( C O A L E S C E ( ( S E L E C T   C O U N T ( * )   F R O M   p u b l i c . f e e d _ p o s t _ l i k e s   l 2   W H E R E   l 2 . p o s t _ i d   =   f p . i d   A N D   l 2 . c r e a t e d _ a t   >   n o w ( )   -   I N T E R V A L   ' 4 8   h o u r s ' )   *   0 . 0 0 5   +   ( S E L E C T   C O U N T ( * )   F R O M   p u b l i c . f e e d _ p o s t _ c o m m e n t s   c 2   W H E R E   c 2 . p o s t _ i d   =   f p . i d   A N D   c 2 . c r e a t e d _ a t   >   n o w ( )   -   I N T E R V A L   ' 4 8   h o u r s ' )   *   0 . 0 0 8 ,   0 ) ,   0 . 1 )  
         ) : : F L O A T 8   A S   f e e d _ s c o r e  
     F R O M   p u b l i c . f e e d _ p o s t s   f p  
     J O I N   p u b l i c . p r o f i l e s   p r   O N   p r . i d   =   f p . a u t h o r _ i d  
     L E F T   J O I N   ( S E L E C T   p o s t _ i d ,   C O U N T ( * )   A S   l i k e _ c o u n t   F R O M   p u b l i c . f e e d _ p o s t _ l i k e s   G R O U P   B Y   p o s t _ i d )   l k   O N   l k . p o s t _ i d   =   f p . i d  
     L E F T   J O I N   ( S E L E C T   p o s t _ i d ,   C O U N T ( * )   A S   c o m m e n t _ c o u n t   F R O M   p u b l i c . f e e d _ p o s t _ c o m m e n t s   G R O U P   B Y   p o s t _ i d )   c m   O N   c m . p o s t _ i d   =   f p . i d  
     L E F T   J O I N   p u b l i c . f e e d _ p o s t _ l i k e s   u l   O N   u l . p o s t _ i d   =   f p . i d   A N D   u l . u s e r _ i d   =   p _ u s e r _ i d  
     L E F T   J O I N   p u b l i c . f e e d _ p o s t _ b o o k m a r k s   u b   O N   u b . p o s t _ i d   =   f p . i d   A N D   u b . u s e r _ i d   =   p _ u s e r _ i d  
     O R D E R   B Y    
         f p . i s _ p i n n e d   D E S C ,  
         C A S E   W H E N   p _ f i l t e r   =   ' t r e n d i n g '   T H E N   f e e d _ s c o r e   E N D   D E S C   N U L L S   L A S T ,    
         C A S E   W H E N   p _ f i l t e r   =   ' r e c e n t '   T H E N   f p . c r e a t e d _ a t   E N D   D E S C   N U L L S   L A S T  
     L I M I T   p _ l i m i t   O F F S E T   p _ o f f s e t ;  
 E N D ;  
 $ $ ;  
  
 G R A N T   E X E C U T E   O N   F U N C T I O N   p u b l i c . g e t _ f e e d _ p o s t s ( U U I D ,   T E X T ,   I N T ,   I N T )   T O   a u t h e n t i c a t e d ;  
  
  
 - -   C r e a t e   R P C   f o r   t r e n d i n g   t o p i c s  
 C R E A T E   O R   R E P L A C E   F U N C T I O N   p u b l i c . g e t _ t r e n d i n g _ t o p i c s ( p _ l i m i t   I N T   D E F A U L T   5 )  
 R E T U R N S   T A B L E   (  
     t a g   T E X T ,  
     c o u n t   B I G I N T  
 )  
 L A N G U A G E   p l p g s q l  
 S E C U R I T Y   D E F I N E R  
 S E T   s e a r c h _ p a t h   =   p u b l i c  
 A S   $ $  
 B E G I N  
     R E T U R N   Q U E R Y  
     S E L E C T   u n n e s t ( f p . t a g s )   A S   t a g ,   C O U N T ( * )   A S   c o u n t  
     F R O M   p u b l i c . f e e d _ p o s t s   f p  
     W H E R E   f p . c r e a t e d _ a t   >   ( n o w ( )   -   I N T E R V A L   ' 7   d a y s ' )  
     G R O U P   B Y   t a g  
     O R D E R   B Y   c o u n t   D E S C  
     L I M I T   p _ l i m i t ;  
 E N D ;  
 $ $ ;  
  
 G R A N T   E X E C U T E   O N   F U N C T I O N   p u b l i c . g e t _ t r e n d i n g _ t o p i c s ( I N T )   T O   a u t h e n t i c a t e d ;  
  
 - -   C r e a t e   R P C   f o r   u p c o m i n g   e v e n t s  
 C R E A T E   O R   R E P L A C E   F U N C T I O N   p u b l i c . g e t _ u p c o m i n g _ e v e n t s ( p _ l i m i t   I N T   D E F A U L T   3 )  
 R E T U R N S   T A B L E   (  
     i d   U U I D ,  
     t i t l e   T E X T ,  
     d e s c r i p t i o n   T E X T ,  
     t y p e   T E X T ,  
     l o c a t i o n   T E X T ,  
     d a t e   T I M E S T A M P T Z ,  
     c o m m u n i t y _ i d   U U I D ,  
     c r e a t o r _ i d   U U I D ,  
     a t t e n d e e _ c o u n t   B I G I N T  
 )  
 L A N G U A G E   p l p g s q l  
 S E C U R I T Y   D E F I N E R  
 S E T   s e a r c h _ p a t h   =   p u b l i c  
 A S   $ $  
 B E G I N  
     R E T U R N   Q U E R Y  
     S E L E C T    
         e . i d ,   e . t i t l e ,   e . d e s c r i p t i o n ,   e . t y p e ,   e . l o c a t i o n ,   e . d a t e ,   e . c o m m u n i t y _ i d ,   e . c r e a t o r _ i d ,  
         C O A L E S C E ( a c . c o u n t ,   0 )   A S   a t t e n d e e _ c o u n t  
     F R O M   p u b l i c . e v e n t s   e  
     L E F T   J O I N   ( S E L E C T   e v e n t _ i d ,   C O U N T ( * )   a s   c o u n t   F R O M   p u b l i c . e v e n t _ a t t e n d e e s   G R O U P   B Y   e v e n t _ i d )   a c   O N   a c . e v e n t _ i d   =   e . i d  
     W H E R E   e . d a t e   >   n o w ( )  
     O R D E R   B Y   e . d a t e   A S C  
     L I M I T   p _ l i m i t ;  
 E N D ;  
 $ $ ;  
  
 G R A N T   E X E C U T E   O N   F U N C T I O N   p u b l i c . g e t _ u p c o m i n g _ e v e n t s ( I N T )   T O   a u t h e n t i c a t e d ;  
 