-- Add columns for lesson title and scripture reading submission
ALTER TABLE volunteer_signups
ADD COLUMN IF NOT EXISTS lesson_title TEXT,
ADD COLUMN IF NOT EXISTS scripture_reading TEXT,
ADD COLUMN IF NOT EXISTS lesson_details_submitted_at TIMESTAMPTZ;
