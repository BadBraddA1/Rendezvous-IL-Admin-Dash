-- Track partial payments collected from families who requested a scholarship.
-- Admins can record a contribution toward what would otherwise be a full scholarship,
-- which is deducted from the scholarship balance.
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS scholarship_amount_paid NUMERIC DEFAULT 0;
