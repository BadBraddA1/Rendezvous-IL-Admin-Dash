-- Add checked_in column to track onsite check-in status
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS checked_in_by VARCHAR(255);

-- Add comment for documentation
COMMENT ON COLUMN registrations.checked_in IS 'Whether the family has been checked in onsite';
COMMENT ON COLUMN registrations.checked_in_at IS 'Timestamp when the family was checked in';
COMMENT ON COLUMN registrations.checked_in_by IS 'Email or name of admin who checked them in';
