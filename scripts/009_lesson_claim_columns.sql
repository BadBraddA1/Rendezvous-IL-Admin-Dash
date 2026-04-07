-- Add claim columns to lesson_topics for atomic first-come-first-served claiming
ALTER TABLE lesson_topics
  ADD COLUMN IF NOT EXISTS claimed_by_bid_id INTEGER REFERENCES lesson_bids(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

-- Add single pick column to lesson_bids (replaces pick_1/pick_2/pick_3)
ALTER TABLE lesson_bids
  ADD COLUMN IF NOT EXISTS claimed_topic_id INTEGER REFERENCES lesson_topics(id) ON DELETE SET NULL;

-- Index for fast claim lookups
CREATE INDEX IF NOT EXISTS lesson_topics_claimed_idx ON lesson_topics(claimed_by_bid_id);
