# Billing recovery operations

This runbook covers the CBP application's payment-to-publication processing and welcome-email delivery. Stripe remains the source of current subscription state. A failed application event is not itself a failed customer payment.

## Interpret the records correctly

| Record | Meaning | What it does not establish |
| --- | --- | --- |
| `invoice.paid` | Stripe reported the invoice paid. Check `amount_paid` when distinguishing a collected payment from a zero-dollar invoice. | Successful local processing, current subscription status, or absence of a later refund. |
| `invoice.payment_failed` | Stripe reported an unsuccessful invoice payment attempt. | The specific decline reason, permanent nonpayment, or whether a later attempt succeeded. |
| `stripe_events.status = failed` | The application did not finish processing that event. | A credit-card decline. The event may be an already-paid invoice. |
| `processing` with an expired lease | A previous processing claim did not finish. | That a Worker is still running, or that the message is in the dead-letter queue. |
| `attempts` | Application processing claims. | Cloudflare delivery attempts, card-charge attempts, or number of customers affected. |
| Missing local subscription | No subscription row is connected to the site. | That the customer did not pay. Check the exact Checkout Session and Stripe records. |

Invoice processing updates the local subscription and site before updating payment-recovery bookkeeping. A later database failure can therefore leave a failed event alongside an already-correct, active account. Verify the account before considering remediation.

The original paid-checkout stall that prompted this work was observed after one processing claim, without a persisted error. Its precise runtime cause remains unknown. The implementation recovers that failure mode; it does not establish whether the original execution stopped because of network I/O, runtime termination, or a failed status write.

## Automatic recovery

The production billing queue is `proneurs-cbp-billing-production`. Its normal consumer and the 15-minute scheduled task use the same event processor.

- Each event claim is a conditional database update with a unique token and a five-minute lease. A duplicate webhook does not replace the saved payload, reset attempts, or steal an active claim.
- Processing different events for one Stripe subscription uses a shared resource lease. Account writes check the current lease token inside their SQL statements. Completion and failure updates also require the event's token.
- A busy resource defers the event for one minute without consuming an application attempt. Genuine failures use exponential backoff starting at one minute, capped at six hours. Queue redelivery before the due time does not bypass backoff; the cron can perform the later attempt.
- Automatic event processing stops at **12 total attempts**. Exhausted events remain failed and visible for operator review. Legacy failures with fewer attempts are eligible after the underlying problem is fixed.
- One recovery pass selects at most **10 events and 10 pending Checkout Sessions**. Stripe requests use a 10-second timeout and one network retry. These are bounded batches, not a promise that every account is recovered within one cron interval.
- Pending-session reconciliation works even when no webhook was saved. It retrieves the site's existing Checkout Session, verifies its exact site/user/session identity, and retrieves the current subscription. It does not fabricate a signed Stripe event or create a new checkout, subscription, invoice, or charge.
- Publication requires a completed session with `payment_status = paid`, or a completed zero-dollar session with `no_payment_required` and `amount_total = 0`. An unpaid completion stays pending; asynchronous success or a later reconciliation can activate it.
- Pending checks rotate by last-check time. Recent reservations and known settled checkouts are checked every 15 minutes; older unconfirmed reservations back off for one hour. The next-check time is saved before network I/O so interrupted scans do not monopolize every run.
- Recovery runs before reservation cleanup. Cleanup, expiration, payment reminders, welcome delivery, welcome-status polling, scheduled deletion, and operational alerts run as independently guarded sections. A failure in one section is logged and does not suppress the others.

Current Stripe state governs replay. A historical paid invoice cannot restore an expired canceled subscription. Canceled subscriptions that remain paid through a future date retain the application's existing paid-through access behavior. Publication overrides and scheduled/deleted account states are preserved. Existing publication timestamps and grace deadlines are retained. If an overdue subscription lacks a stored deadline, the current outstanding invoice's verified finalization/creation time supplies the original seven-day deadline; an unverifiable deadline does not invent a fresh grace period.

Checkout activation rejects a Stripe subscription already linked to another site. If a site's Checkout Session is replaced while a lookup is in flight, the old session cannot publish the replacement reservation.

## Monitor processing and email separately

Use the protected `/admin/billing` page on the administrator hostname. It reports unresolved events, completed checkouts awaiting activation, and welcome-email items needing attention. The account detail page separates subscription state from confirmed checkout payment and email state.

Processing or completed-checkout delays older than 30 minutes are attention items. Exhausted events and email review/bounce/complaint states also require attention. Completed-checkout timing uses its recorded completion timestamp, with the historical fallback documented in the health query, rather than assuming the reservation's creation time is the payment time.

Set `BILLING_ALERT_EMAIL` to one approved owner address in the appropriate Worker environment. For example, use the normal authenticated Wrangler interactive secret-entry workflow; do not commit an address or credential value to the repository:

```sh
npx wrangler secret put BILLING_ALERT_EMAIL --env production
```

An unset value disables owner email alerts. An invalid value causes a logged alert-step error. Existing `RESEND_API_KEY` and `EMAIL_FROM` configuration is required for sending. The health page remains the current source of operational counts regardless of email configuration.

When attention items exist, the scheduled task sends at most one alert per UTC day per environment. Its stable provider key and `billing.health_alert.sent` audit record prevent repeated notifications. The alert links to the protected page and contains no customer information. Inspect that audit record and provider acceptance when verifying alert setup; merely setting the variable is not a delivery test. The daily alert is not continuous paging, so inspect the page during an active incident.

### Welcome-email states

`pending` and `sending` describe work in progress. `accepted` means the provider accepted the send and a provider message ID was saved when available. `delivered` means provider delivery evidence was observed; it does not prove an inbox view. `bounced`, `complained`, and `needs_review` require review. A missing provider read permission leaves acceptance distinct from delivery and does not trigger another send.

Welcome requests persist an immutable payload and a stable delivery ID before queueing. Duplicate checkout replay reuses the same delivery record. A bounded scan also repairs a crash between site activation and creation of the initial email record. It excludes demo sites, publication overrides, scheduled deletion, and sites without a suitable linked subscription.

Welcome sends have five-minute leases, at most six attempts, and a 23-hour automatic retry window. Exponential retry delays begin at five minutes and cap at one hour. An uncertain send outside that window is held for review instead of reusing an expired provider idempotency window. Accepted messages are checked at most every six hours for seven days; a provider read-permission failure backs off for 24 hours. The status checker never sends mail.

Migration `0010` records preexisting published/linked accounts as `legacy_unknown` because the old code did not retain trustworthy message IDs. This means **not tracked before rollout**, not “not sent.” These rows must never be bulk-resent. Review purchases around the rollout boundary as well: a welcome queued under the old code may have unknown delivery when the new consumer starts. Compare provider evidence before a deliberate resend. The administrator's resend action creates a new tracked delivery ID and can send another email, so use it only after that review and appropriate authorization.

## Read-only diagnostics

Use the authenticated D1 tooling for the intended environment. Bind the reviewed identifiers where the client supports parameters; placeholders below are not real identifiers. Start with these narrow projections rather than dumping event or email payloads, which can contain customer information.

Confirm the migration ledger and actual schema:

```sql
SELECT name, applied_at
FROM d1_migrations
WHERE name IN ('0008_billing_recovery.sql', '0009_billing_reliability.sql', '0010_welcome_email_deliveries.sql')
ORDER BY name;
PRAGMA table_info(stripe_events);
PRAGMA table_info(billing_recovery);
PRAGMA table_info(welcome_email_deliveries);
```

Summarize application outcomes without labeling them payment declines:

```sql
SELECT event_type, status, COUNT(*) AS event_count,
       MIN(attempts) AS minimum_attempts, MAX(attempts) AS maximum_attempts,
       datetime(MIN(received_at) / 1000, 'unixepoch') AS first_received_utc,
       datetime(MAX(received_at) / 1000, 'unixepoch') AS last_received_utc
FROM stripe_events
WHERE received_at >= unixepoch('<review-start-date> 00:00:00') * 1000
GROUP BY event_type, status
ORDER BY event_type, status;
```

Inspect a reviewed event's processing state and linkage, without its full payload:

```sql
SELECT id, event_type, status, attempts, last_error,
       datetime(received_at / 1000, 'unixepoch') AS received_utc,
       datetime(last_attempt_at / 1000, 'unixepoch') AS last_attempt_utc,
       datetime(lease_expires_at / 1000, 'unixepoch') AS lease_expires_utc,
       datetime(next_attempt_at / 1000, 'unixepoch') AS next_attempt_utc,
       datetime(processed_at / 1000, 'unixepoch') AS processed_utc,
       json_extract(payload_json, '$.data.object.id') AS object_id,
       json_extract(payload_json, '$.data.object.metadata.siteId') AS checkout_site_id,
       json_extract(payload_json, '$.data.object.payment_status') AS checkout_payment_status,
       json_extract(payload_json, '$.data.object.amount_paid') AS invoice_amount_paid,
       COALESCE(json_extract(payload_json, '$.data.object.parent.subscription_details.subscription'),
                json_extract(payload_json, '$.data.object.subscription')) AS subscription_id
FROM stripe_events
WHERE id = '<event-id>';
```

Verify one site's current local state and uniqueness:

```sql
SELECT s.id, s.status, s.publication_override, s.deletion_scheduled_at,
       s.stripe_checkout_session_id, s.checkout_payment_status,
       s.checkout_completed_at, s.checkout_last_checked_at,
       s.checkout_next_check_at, s.checkout_recovery_error,
       s.published_at, s.reservation_expires_at,
       sub.id AS local_subscription_id, sub.stripe_subscription_id,
       sub.plan, sub.status AS subscription_status,
       sub.current_period_end, sub.grace_ends_at, sub.cancel_at_period_end
FROM sites s
LEFT JOIN subscriptions sub ON sub.site_id = s.id
WHERE s.id = '<site-id>';

SELECT COUNT(*) AS linked_rows
FROM subscriptions
WHERE site_id = '<site-id>' OR stripe_subscription_id = '<subscription-id>';
```

Inspect only the relevant welcome records and latest owner alert:

```sql
SELECT id, status, attempts, provider_message_id, provider_event,
       datetime(accepted_at / 1000, 'unixepoch') AS accepted_utc,
       datetime(delivered_at / 1000, 'unixepoch') AS delivery_observed_utc,
       datetime(next_attempt_at / 1000, 'unixepoch') AS next_attempt_utc,
       last_error
FROM welcome_email_deliveries
WHERE site_id = '<site-id>'
ORDER BY created_at DESC;

SELECT action, datetime(created_at / 1000, 'unixepoch') AS recorded_utc
FROM audit_logs
WHERE action = 'billing.health_alert.sent'
ORDER BY created_at DESC
LIMIT 1;
```

Cloudflare Worker logs can supplement the ledger. Filter the incident's UTC interval and exact event or delivery ID. Relevant log messages include `billing queue message failed`, `billing maintenance step failed`, `welcome email accepted`, and `welcome email retry failed`. An absent failure log is not proof of completion. Queue backlog/dead-letter metrics do not identify an individual event without matching message evidence; avoid pull/ack operations during a read-only investigation.

## Targeted replay after verification

1. Confirm environment, exact saved event, site/session/customer/subscription association, current Stripe state, and present publication/deletion settings. For apparent payment declines, inspect Stripe's actual failure and subsequent invoice history. Do not infer a decline from the application's `failed` label.
2. Verify the underlying processing problem is corrected, the required schema is present, and no unexpired event/resource lease is active. Save a narrow before snapshot and the reason for replay. Consider normal automatic recovery first.
3. Enqueue only the reviewed event through the existing authenticated Cloudflare billing queue. The consumer's JSON body is:

```json
{"stripeEventId":"<reviewed-event-id>"}
```

Use the queue API/client's documented JSON-body transport. Do not place an entire fabricated Stripe event, new Checkout Session, or payment request in the message. Requeueing a completed event is a no-op. Requeueing before backoff expires or after the attempt ceiling does not override those controls.

4. If recovering an unlinked paid checkout and its invoice, process the checkout event first. Verify the local subscription exists and the checkout event completed before enqueueing the related invoice. Invoice processing cannot create a missing checkout association by itself.
5. Verify `completed`, a cleared error/lease, the expected current local billing and publication state, exactly one matching subscription, and the existing public page. Confirm email acceptance/delivery separately. An event may complete while publication correctly remains canceled, suspended, or overridden.
6. If a matching dead-letter copy remains after successful recovery, inspect it with the nonleasing Queue `messages/peek` endpoint. Verify its exact stored event ID is completed before removing only that message through `messages/purge` using its opaque reference. Never purge the entire queue to clear an incident, and retain the application event/payment history.
7. Record the reviewed IDs, before/after outcomes, current Stripe basis, and any intentionally retained exception in a private operational record. Do not publicly paste customer payloads, credentials, or account emails.

Replay performs Stripe reads and local reconciliation, not a new charge. It can change local publication according to current billing and can queue the normal welcome or applicable recovery notices. Review those possible side effects before a manual replay.

### Exhausted or conflicted work

Do not bulk-reset `attempts`, clear all errors, delete events, remove leases, or activate sites merely to make a dashboard look healthy. Twelve failed claims require investigation. Identity conflicts, uncertain overdue deadlines, deletion/override decisions, and email ambiguity need a specific resolution rather than repeated retries.

If a verified infrastructure/configuration fault has been corrected and a particular exhausted event still needs another bounded attempt, an authorized operator may reset only that event's retry eligibility. Preserve the original attempts/error/timestamps and the reason in an audit record first. Use an atomic, conditional update against the reviewed failed state, with no active lease; preserve the original ID, event type, payload, and received time. Requeue the original ID and recheck the result. A stale snapshot or failed condition requires another read, not a broader update. Any reset starts a new reviewed retry budget and must remain auditable.

## Release and rollback

Use `npm run deploy:staging` and `npm run deploy:production`, or the GitHub deployment workflow, which share the guarded deployment script. The sequence is validation, required-secret-name verification, forward-only migrations, actual-schema/index verification, Worker deployment, and public smoke checks. A schema mismatch stops deployment. Avoid direct Worker deployment commands that bypass this sequence.

Before production operations, retain the approved revision, current Worker version, and a D1 recovery bookmark. Test additive migrations in staging first. Keep migrations `0009` and `0010` after a Worker rollback: older code tolerates extra columns/tables, while removing them would damage newer ledger evidence. Do not use an old database restore as an ordinary code rollback; it can discard legitimate customer activity since the bookmark. A code rollback also removes the new recovery/visibility behavior, so continue manual monitoring and reconcile any in-flight work deliberately.

After rollout, verify a healthy schema probe, scheduled invocation, protected health page, owner-alert configuration, and current public pages. Compare the reviewed affected accounts' publication state and billing dates before/after. Confirm existing canceled, suspended, overridden, demo, and deletion-scheduled accounts stayed within their intended lifecycle. Review the rollout-boundary welcome cases without automatically resending legacy records.
