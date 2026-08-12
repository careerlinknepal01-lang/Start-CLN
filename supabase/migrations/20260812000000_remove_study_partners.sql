-- Remove Study Partner feature
-- Drop indexes first
DROP INDEX IF EXISTS idx_study_partners_subjects_gin;
DROP INDEX IF EXISTS idx_study_partners_bio_gin;

-- Drop RLS policies
DROP POLICY IF EXISTS "Study partners are viewable by everyone" ON study_partners;
DROP POLICY IF EXISTS "Users can manage their own study partner profile" ON study_partners;

-- Drop the table
DROP TABLE IF EXISTS study_partners;

-- Note: PostgreSQL does not support removing enum values from an existing type.
-- The 'study_partner_contact' value in notification_type enum will remain in the DB
-- but is no longer used by the application. If you need to remove it, you must
-- recreate the enum type without that value (requires a full migration of all
-- dependent columns).
