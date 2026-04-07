-- Add prayer_type column to distinguish Opening Prayer vs Closing Prayer
-- for volunteers with volunteer_type = 'Leading Prayer'
ALTER TABLE volunteer_signups
ADD COLUMN IF NOT EXISTS prayer_type VARCHAR(30);
