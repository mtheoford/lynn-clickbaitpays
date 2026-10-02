CREATE TABLE billing_recovery (
  invoice_id TEXT PRIMARY KEY NOT NULL,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'en',
  grace_ends_at INTEGER NOT NULL,
  reminder_sent_at INTEGER,
  suspension_sent_at INTEGER,
  closed_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_billing_recovery_open ON billing_recovery(closed_at, grace_ends_at);
CREATE INDEX idx_billing_recovery_subscription ON billing_recovery(stripe_subscription_id);
