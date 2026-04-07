ALTER TABLE volunteer_signups
  ADD COLUMN IF NOT EXISTS prayer_position TEXT CHECK (prayer_position IN ('opening', 'closing'));
