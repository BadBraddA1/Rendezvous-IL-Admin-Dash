-- Add scheduling fields to volunteer_signups table
ALTER TABLE volunteer_signups 
ADD COLUMN IF NOT EXISTS assigned_date DATE,
ADD COLUMN IF NOT EXISTS time_slot VARCHAR(20), -- 'morning' or 'evening'
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update existing rows to have NULL for new columns (they can be assigned later)
UPDATE volunteer_signups 
SET assigned_date = NULL, time_slot = NULL, notes = NULL 
WHERE assigned_date IS NULL;
