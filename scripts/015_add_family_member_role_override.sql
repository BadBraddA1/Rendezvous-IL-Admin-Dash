-- Optional manual override of how a family member is categorized on the
-- attendees report. NULL = use age-based default (>=18 adult, <18 child).
-- TRUE  = force this person to appear under PARENTS.
-- FALSE = force this person to appear under CHILDREN.
ALTER TABLE family_members
  ADD COLUMN IF NOT EXISTS is_adult_override BOOLEAN;
