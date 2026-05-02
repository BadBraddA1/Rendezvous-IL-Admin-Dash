-- Event settings table for feature toggles
CREATE TABLE IF NOT EXISTS event_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default adventure setting (enabled by default)
INSERT INTO event_settings (key, value) 
VALUES ('adventure_enabled', 'false')
ON CONFLICT (key) DO NOTHING;
