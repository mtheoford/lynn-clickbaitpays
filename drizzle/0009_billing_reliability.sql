ALTER TABLE stripe_events ADD COLUMN processing_token TEXT;
ALTER TABLE stripe_events ADD COLUMN lease_expires_at INTEGER;
ALTER TABLE stripe_events ADD COLUMN last_attempt_at INTEGER;
ALTER TABLE stripe_events ADD COLUMN next_attempt_at INTEGER;
CREATE INDEX idx_stripe_events_recovery ON stripe_events(status, next_attempt_at);
CREATE INDEX idx_stripe_events_lease ON stripe_events(lease_expires_at);

CREATE TABLE billing_work_leases (
  resource_key TEXT PRIMARY KEY NOT NULL,
  token TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

ALTER TABLE sites ADD COLUMN checkout_payment_status TEXT;
ALTER TABLE sites ADD COLUMN checkout_completed_at INTEGER;
ALTER TABLE sites ADD COLUMN checkout_last_checked_at INTEGER;
ALTER TABLE sites ADD COLUMN checkout_next_check_at INTEGER;
ALTER TABLE sites ADD COLUMN checkout_recovery_error TEXT;
CREATE INDEX idx_sites_checkout_recovery ON sites(status, checkout_next_check_at);
