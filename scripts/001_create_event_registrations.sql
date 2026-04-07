-- Create event_registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  event_name VARCHAR(255) NOT NULL,
  event_date DATE NOT NULL,
  num_attendees INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'pending',
  special_requirements TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_event_registrations_email ON event_registrations(email);

-- Create index on event_name for filtering
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_name ON event_registrations(event_name);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON event_registrations(status);

-- Insert sample data
INSERT INTO event_registrations (full_name, email, phone, event_name, event_date, num_attendees, status, special_requirements)
VALUES 
  ('John Smith', 'john.smith@example.com', '+1-555-0123', 'Annual Conference 2025', '2025-03-15', 2, 'confirmed', 'Vegetarian meal required'),
  ('Sarah Johnson', 'sarah.j@example.com', '+1-555-0456', 'Tech Workshop', '2025-02-28', 1, 'pending', NULL),
  ('Michael Brown', 'mbrown@example.com', '+1-555-0789', 'Annual Conference 2025', '2025-03-15', 3, 'confirmed', 'Wheelchair access needed'),
  ('Emily Davis', 'emily.davis@example.com', '+1-555-0321', 'Product Launch', '2025-04-10', 1, 'cancelled', NULL),
  ('David Wilson', 'dwilson@example.com', '+1-555-0654', 'Tech Workshop', '2025-02-28', 2, 'confirmed', NULL);
