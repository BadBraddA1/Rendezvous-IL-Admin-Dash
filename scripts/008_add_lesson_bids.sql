-- Lesson topics (up to 12 titles the admin creates)
CREATE TABLE IF NOT EXISTS lesson_topics (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  -- Assignment fields (filled in by admin after bids come in)
  assigned_presenter_name TEXT,
  assigned_registration_id INTEGER REFERENCES registrations(id) ON DELETE SET NULL,
  assigned_day TEXT,
  assigned_session TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lesson bid invites — one row per person invited
CREATE TABLE IF NOT EXISTS lesson_bids (
  id SERIAL PRIMARY KEY,
  registration_id INTEGER REFERENCES registrations(id) ON DELETE CASCADE,
  invitee_name TEXT NOT NULL,
  invitee_email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  -- Up to 3 ranked picks (topic IDs)
  pick_1 INTEGER REFERENCES lesson_topics(id) ON DELETE SET NULL,
  pick_2 INTEGER REFERENCES lesson_topics(id) ON DELETE SET NULL,
  pick_3 INTEGER REFERENCES lesson_topics(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast token lookups on the public pick page
CREATE UNIQUE INDEX IF NOT EXISTS lesson_bids_token_idx ON lesson_bids(token);
