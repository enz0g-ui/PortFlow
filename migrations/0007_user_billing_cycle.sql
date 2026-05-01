-- Track whether a user is on monthly or yearly billing.
-- NULL = unknown / legacy row (will be backfilled lazily on next webhook event,
-- or via a one-shot UPDATE for users who paid before this migration).
ALTER TABLE users ADD COLUMN billing_cycle TEXT;
