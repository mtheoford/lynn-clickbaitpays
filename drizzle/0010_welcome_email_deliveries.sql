CREATE TABLE welcome_email_deliveries (
  id TEXT PRIMARY KEY NOT NULL,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  locale TEXT NOT NULL DEFAULT 'en',
  status TEXT NOT NULL DEFAULT 'pending',
  payload_json TEXT,
  provider_message_id TEXT,
  provider_event TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  first_attempt_at INTEGER,
  last_attempt_at INTEGER,
  next_attempt_at INTEGER,
  lease_token TEXT,
  lease_expires_at INTEGER,
  accepted_at INTEGER,
  delivered_at INTEGER,
  last_checked_at INTEGER,
  last_error TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_welcome_deliveries_due ON welcome_email_deliveries(status, next_attempt_at);
CREATE INDEX idx_welcome_deliveries_site ON welcome_email_deliveries(site_id, created_at);

-- Existing welcome messages have no trustworthy delivery ledger. Never resend
-- them automatically after the provider's 24-hour idempotency window expires.
-- A deliberate administrator resend gets a new delivery ID and a tracked row.
INSERT INTO welcome_email_deliveries (id, site_id, locale, status, created_at, updated_at)
SELECT 'welcome-' || s.id, s.id, 'en', 'legacy_unknown', unixepoch() * 1000, unixepoch() * 1000
FROM sites s
WHERE s.published_at IS NOT NULL OR EXISTS (SELECT 1 FROM subscriptions sub WHERE sub.site_id = s.id);
