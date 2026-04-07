ALTER TABLE volunteer_signups
ADD COLUMN IF NOT EXISTS schedule_status VARCHAR(20) DEFAULT 'unscheduled',
ADD COLUMN IF NOT EXISTS schedule_token VARCHAR(64),
ADD COLUMN IF NOT EXISTS schedule_email_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;

-- Status values: unscheduled, pending (email sent, awaiting response), approved, declined
