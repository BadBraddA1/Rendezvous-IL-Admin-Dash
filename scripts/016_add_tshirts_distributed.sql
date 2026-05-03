-- Tracks whether t-shirts have been physically handed out at check-in.
-- NULL/false = not yet given, true = given.
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS tshirts_distributed BOOLEAN DEFAULT FALSE;
