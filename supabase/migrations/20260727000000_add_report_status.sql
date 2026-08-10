-- Add status tracking to feed_post_reports for admin moderation
ALTER TABLE feed_post_reports
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

-- Index for filtering by status in the admin panel
CREATE INDEX IF NOT EXISTS idx_feed_post_reports_status ON feed_post_reports (status);
