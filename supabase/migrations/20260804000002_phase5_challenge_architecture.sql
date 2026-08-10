-- Migration for Weekly Challenge Architecture Modification
-- 1. Modify constraints and add new columns

-- Convert active -> published, voting -> closed, completed -> archived, upcoming -> draft
UPDATE weekly_challenges SET status = 'draft' WHERE status = 'upcoming';
UPDATE weekly_challenges SET status = 'published' WHERE status = 'active';
UPDATE weekly_challenges SET status = 'closed' WHERE status = 'voting';
UPDATE weekly_challenges SET status = 'archived' WHERE status = 'completed';

ALTER TABLE weekly_challenges
ADD COLUMN category TEXT CHECK (category IN ('Programming', 'Design', 'Business', 'Writing', 'AI', 'Marketing')),
ADD COLUMN difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
ADD COLUMN rules TEXT,
ADD COLUMN cover_image_url TEXT,
ADD COLUMN required_submission_fields TEXT[] DEFAULT '{"url", "description"}'::TEXT[];

-- Update constraint on status
-- Drop existing constraint if it exists (assuming it doesn't since we checked schema earlier, it was just TEXT)
ALTER TABLE weekly_challenges ADD CONSTRAINT weekly_challenges_status_check CHECK (status IN ('draft', 'published', 'closed', 'archived'));

-- Ensure RLS correctly applies
-- Only admins can create/update/delete.
-- Drop old policies to replace them.
DROP POLICY IF EXISTS "Weekly challenges are viewable by everyone" ON weekly_challenges;
DROP POLICY IF EXISTS "Admins can manage weekly challenges" ON weekly_challenges;

CREATE POLICY "Everyone can view published, closed, archived challenges"
ON weekly_challenges FOR SELECT
TO public
USING (status IN ('published', 'closed', 'archived') OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Admins can insert weekly challenges"
ON weekly_challenges FOR INSERT
TO public
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Admins can update weekly challenges"
ON weekly_challenges FOR UPDATE
TO public
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Admins can delete weekly challenges"
ON weekly_challenges FOR DELETE
TO public
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Protect challenge submissions
-- Ensure users cannot submit to non-published challenges
-- Users can only insert submissions if challenge is published and before deadline.
CREATE OR REPLACE FUNCTION check_challenge_submission_validity()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM weekly_challenges 
        WHERE id = NEW.challenge_id 
        AND status = 'published' 
        AND now() <= end_date
    ) THEN
        RAISE EXCEPTION 'Challenge is not currently accepting submissions.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_challenge_submission ON challenge_submissions;
CREATE TRIGGER trigger_check_challenge_submission
BEFORE INSERT OR UPDATE ON challenge_submissions
FOR EACH ROW
EXECUTE FUNCTION check_challenge_submission_validity();
