-- Add checkin_qr_code column to registrations table
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS checkin_qr_code VARCHAR(10) UNIQUE;

-- Generate random 10-digit codes for existing registrations
UPDATE registrations 
SET checkin_qr_code = LPAD(FLOOR(RANDOM() * 10000000000)::TEXT, 10, '0')
WHERE checkin_qr_code IS NULL;

-- Create index for faster QR code lookups
CREATE INDEX IF NOT EXISTS idx_registrations_checkin_qr_code ON registrations(checkin_qr_code);
