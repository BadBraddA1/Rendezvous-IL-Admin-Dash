-- App-wide settings table for feature flags
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default: schedule is NOT published
INSERT INTO app_settings (key, value)
VALUES ('schedule_published', 'false')
ON CONFLICT (key) DO NOTHING;
