-- Add room_keys column to registrations for storing motel room key numbers
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS room_keys TEXT[];

-- Add checked_in column if it doesn't exist
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT FALSE;

-- Add checked_in_at timestamp
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP;
