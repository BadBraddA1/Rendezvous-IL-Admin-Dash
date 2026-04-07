-- Link lesson bids to volunteer_signups instead of separate invites
-- Add lesson-related columns to volunteer_signups
ALTER TABLE volunteer_signups
ADD COLUMN IF NOT EXISTS lesson_bid_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS lesson_bid_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS claimed_lesson_id INTEGER REFERENCES lesson_topics(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS claimed_lesson_at TIMESTAMPTZ;

-- Generate tokens for existing "Presenting a lesson" volunteers
UPDATE volunteer_signups
SET lesson_bid_token = gen_random_uuid()::TEXT
WHERE volunteer_type ILIKE '%present%lesson%' AND lesson_bid_token IS NULL;

-- Create index for fast token lookups on the public pick page
CREATE INDEX IF NOT EXISTS volunteer_signups_lesson_token_idx ON volunteer_signups(lesson_bid_token) WHERE lesson_bid_token IS NOT NULL;
