-- Enable pg_trgm for advanced search using GIN indexes
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ==========================================
-- SAVED POSTS
-- ==========================================
CREATE TABLE saved_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, post_id)
);

ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own saved posts" ON saved_posts FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- STUDY PARTNERS
-- ==========================================
CREATE TABLE study_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    subjects TEXT[] NOT NULL DEFAULT '{}',
    availability TEXT[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE study_partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Study partners are viewable by everyone" ON study_partners FOR SELECT USING (true);
CREATE POLICY "Users can manage their own study partner profile" ON study_partners FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- WEEKLY CHALLENGES
-- ==========================================
CREATE TABLE weekly_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'voting', 'completed')),
    winner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE weekly_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Weekly challenges are viewable by everyone" ON weekly_challenges FOR SELECT USING (true);
CREATE POLICY "Admins can manage weekly challenges" ON weekly_challenges FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- ==========================================
-- CHALLENGE SUBMISSIONS
-- ==========================================
CREATE TABLE challenge_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID NOT NULL REFERENCES weekly_challenges(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    submission_url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(challenge_id, user_id)
);

ALTER TABLE challenge_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Challenge submissions are viewable by everyone" ON challenge_submissions FOR SELECT USING (true);
CREATE POLICY "Users can insert their own submissions" ON challenge_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own submissions" ON challenge_submissions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own submissions" ON challenge_submissions FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- CHALLENGE VOTES
-- ==========================================
CREATE TABLE challenge_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID NOT NULL REFERENCES weekly_challenges(id) ON DELETE CASCADE,
    submission_id UUID NOT NULL REFERENCES challenge_submissions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(submission_id, user_id),
    UNIQUE(challenge_id, user_id)
);

ALTER TABLE challenge_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Challenge votes are viewable by everyone" ON challenge_votes FOR SELECT USING (true);
CREATE POLICY "Users can vote once per challenge" ON challenge_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their vote" ON challenge_votes FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- SEARCH INDEXES
-- ==========================================
CREATE INDEX idx_profiles_name_gin ON profiles USING GIN (name gin_trgm_ops);
CREATE INDEX idx_profiles_bio_gin ON profiles USING GIN (bio gin_trgm_ops);
CREATE INDEX idx_profiles_skills_gin ON profiles USING GIN (skills);

CREATE INDEX idx_feed_posts_content_gin ON feed_posts USING GIN (content gin_trgm_ops);

CREATE INDEX idx_communities_name_gin ON communities USING GIN (name gin_trgm_ops);
CREATE INDEX idx_communities_description_gin ON communities USING GIN (description gin_trgm_ops);

CREATE INDEX idx_events_title_gin ON events USING GIN (title gin_trgm_ops);
CREATE INDEX idx_events_description_gin ON events USING GIN (description gin_trgm_ops);

CREATE INDEX idx_study_partners_subjects_gin ON study_partners USING GIN (subjects);
CREATE INDEX idx_study_partners_bio_gin ON study_partners USING GIN (bio gin_trgm_ops);

CREATE INDEX idx_weekly_challenges_title_gin ON weekly_challenges USING GIN (title gin_trgm_ops);
