-- Add drive-in pass tracking table
-- Drive-in passes are for families that are not doing lodging but need to track meals
-- Event dates: Mon dinner through Fri lunch

CREATE TABLE IF NOT EXISTS drivein_passes (
  id SERIAL PRIMARY KEY,
  family_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50),
  contact_email VARCHAR(255),
  -- Number of people
  num_adults INTEGER DEFAULT 0,
  num_children INTEGER DEFAULT 0,
  -- Meal selections (boolean for each meal - Mon dinner through Fri lunch)
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
  -- Notes
  notes TEXT,
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_drivein_passes_family_name ON drivein_passes(family_name);
