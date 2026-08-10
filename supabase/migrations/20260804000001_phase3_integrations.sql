-- Phase 3: Notifications and Challenge Comments

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'study_partner_contact';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'challenge_new';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'challenge_comment';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'challenge_like';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'challenge_reminder';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'challenge_winner';

CREATE TABLE IF NOT EXISTS challenge_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID NOT NULL REFERENCES weekly_challenges(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE challenge_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read challenge comments" ON challenge_comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert challenge comments" ON challenge_comments
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete their challenge comments" ON challenge_comments
    FOR DELETE USING (auth.uid() = author_id);
