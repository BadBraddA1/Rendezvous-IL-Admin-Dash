-- Add drive-in pass tracking table
-- Drive-in passes are for families that are not doing lodging but need to track meals

CREATE TABLE IF NOT EXISTS drivein_passes (
  id SERIAL PRIMARY KEY,
  family_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  contact_phone VARCHAR(50),
  contact_email VARCHAR(255),
  -- Meal selections (boolean for each meal)
  monday_dinner BOOLEAN DEFAULT FALSE,
  tuesday_breakfast BOOLEAN DEFAULT FALSE,
  tuesday_lunch BOOLEAN DEFAULT FALSE,
  tuesday_dinner BOOLEAN DEFAULT FALSE,
  wednesday_breakfast BOOLEAN DEFAULT FALSE,
  wednesday_lunch BOOLEAN DEFAULT FALSE,
  wednesday_dinner BOOLEAN DEFAULT FALSE,
  thursday_breakfast BOOLEAN DEFAULT FALSE,
  thursday_lunch BOOLEAN DEFAULT FALSE,
  thursday_dinner BOOLEAN DEFAULT FALSE,
  friday_breakfast BOOLEAN DEFAULT FALSE,
  friday_lunch BOOLEAN DEFAULT FALSE,
  -- Number of people for meal count
  num_people INTEGER DEFAULT 1,
  -- Cost tracking
  total_cost DECIMAL(10, 2) DEFAULT 0,
  -- Notes
  notes TEXT,
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_drivein_passes_family_name ON drivein_passes(family_name);
