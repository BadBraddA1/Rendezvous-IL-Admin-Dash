-- Add keys_returned column to track when motel keys are returned
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS keys_returned BOOLEAN DEFAULT FALSE;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS keys_returned_at TIMESTAMP;
