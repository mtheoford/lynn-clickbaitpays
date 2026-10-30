# Billing reliability: incident record and prioritized plan

Owner: ProNeurs operations. Opened October 30, 2026. This document is the
tracking record for the incidents, fixes, verification, and remaining work.
Production rollout results are recorded in `BILLING_RELIABILITY_RELEASE_2026-10-30.md`.

## Findings and customer impact

| ID | Evidence | Customer impact | Priority |
| --- | --- | --- | --- |
| BILL-001 | A live $9 monthly checkout and paid invoice arrived October 27 at 14:00 UTC. The checkout event remained `processing` after one attempt; the invoice remained `pending` with zero attempts. The site had no local subscription. Replaying the existing events October 30 restored the original subscription and site without another charge. | A paying customer waited about three days for access. | P0 |
| BILL-002 | 27 `invoice.paid` events ($733 total) and two `invoice.payment_failed` events failed on writes to `billing_recovery`, October 14–23. Migration `0008_billing_recovery.sql` was applied October 23 at 18:42:44 UTC, after the final failure at 16:11:01 UTC. Local deployment scripts omitted migration application; CI already applied migrations. | Internal failures after successful payments; delayed recovery notices for two $9 renewals. 26 paid accounts were active and one canceled when reviewed. | P0 |
| BILL-003 | Admin displayed “No subscription” for a paid account because it read only the local subscription join. Failed/stalled jobs had no owner alert or automatic rescue. | Payment and provisioning could disagree without staff knowing. | P1 |
| MAIL-001 | Welcome jobs used a provider idempotency key, but discarded the provider message ID and stored neither acceptance nor delivery status. | Staff could not distinguish queued, accepted, delivered, and failed mail. | P1 |
| OPS-001 | 29 historical failed invoice events remained after the table was repaired; one September 28 expired-checkout event remained pending. Initial read-only dead-letter peeks showed five copies: three of those failed paid-invoice events and the two already-recovered incident events. Later peeks returned other batches; the release record documents the verified cleanup. | Misleading operational backlog and unresolved audit history. | P2 |
| SEC-001 | The release audit found patched Undici/Zod issues and a remaining development-only esbuild advisory under Drizzle Kit. The latter is excluded from production and has a reviewed exception through November 6. | No live Worker exposure through this tooling path; recheck upstream before the exception expires. [Issue #49](https://github.com/mtheoford/lynn-clickbaitpays/issues/49). | P3 |

The exact reason BILL-001's original execution stopped is **not established**.
A stale processing checkpoint is evidence of incomplete execution, not proof of
a particular timeout, queue outage, or dead-letter result. The migration timing
and failed statements strongly support a schema/deployment mismatch for BILL-002;
the stored SQL error does not retain its original low-level database cause. The later dead-letter inspection establishes that the incident event copies reached that queue, but does not establish why their original processing stopped.

The two failed renewals were actual payment failures, separate from our processing
error. Their specific bank decline reasons are not present in saved invoice
notifications. No evidence establishes that these bugs caused a lost new sale or
the canceled account. This investigation did not measure checkout abandonment.

## Implementation order and acceptance criteria

1. **P0 — Recover paid accounts and stalled jobs (BILL-001).** Add bounded retries,
   processing leases, and independent checks of existing pending Checkout Sessions.
   Verify current Stripe state before provisioning. Test duplicate and concurrent
   delivery, interrupted processing, missing webhook delivery, transient Stripe
   failure, out-of-order events, and partial local writes.
2. **P0 — Gate releases on database compatibility (BILL-002).** Use one release
   command for local and CI deployment. Validate the complete committed migration
   chain, apply migrations before code publication, and verify the remote ledger,
   required columns, and indexes. A failed check must prevent deployment.
3. **P1 — Expose operational health (BILL-003).** Show paid-but-unactivated status
   separately from unconfirmed payment. Add a protected billing-health view and
   a deduplicated owner notification for overdue or exhausted system work.
   Ordinary card declines alone must not trigger system-failure alerts.
4. **P1 — Make welcome delivery durable and observable (MAIL-001).** Persist a
   frozen message and stable delivery ID before queueing. Record provider acceptance
   and message ID; distinguish acceptance from confirmed delivery or bounce.
   Retry safely within the provider's idempotency window. Escalate uncertain older
   sends for review rather than blindly resending. Do not mass-send old welcomes.
5. **P2 — Reconcile historical work (OPS-001).** Save the affected IDs and account
   state, replay only existing notifications, verify completion and unchanged
   entitlement/cancellation/override rules, and retain an auditable outcome. Remove only exact dead-letter message copies whose saved events have been verified completed; preserve all event/payment records.

6. **P3 — Recheck development tooling (SEC-001).** Review the supported upstream fix by November 6 and remove the temporary exception when a compatible patch is available. Preserve the audit gate.

## Boundaries that must remain intact

- No new customer charge, subscription, refund, cancellation, price, or billing cycle.
- Recover using the exact existing site, user, Checkout Session, customer, and
  subscription. Reject mismatches and preserve Shift's independent namespace.
- Unpaid/open checkouts do not publish sites. Existing grace periods are not reset.
- Administrative suspension/cancellation and deletion must survive late events.
- Recovering an account must not change its public content, referral links,
  language, media, pricing, analytics behavior, or access controls.
- A replay must not create duplicate local subscriptions or duplicate welcome mail.
- Provider acceptance is not represented as delivery. Older untracked welcome
  history remains explicitly unknown; an owner-requested resend creates a separate
  tracked delivery record.
- Automated owner alerts contain an authenticated admin link, not customer
  financial details, raw event payloads, tokens, or credentials.

## Verification and rollout

Run real SQLite migration/query integration tests with mocked Stripe/email
boundaries, existing unit and security checks, TypeScript, lint, Worker build,
and desktop/mobile purchase-flow tests. Production smoke tests do not submit
payments. Validate staging first, then production with additive migrations.

Before production changes, record a D1 Time Travel bookmark and targeted account/
event snapshots. After rollout, check public pages, checkout entry, admin access
protection, queue outcomes, event state, subscription uniqueness, paid-through
dates, publication overrides, overdue sites, and welcome outbox state. Observe a
scheduled recovery pass. Keep previous Worker version for code rollback; leave
additive schema in place when rolling code back.

## Tracking checklist

- [x] BILL-001: automatic recovery implemented and regression-tested
- [x] BILL-002: all supported releases apply and verify schema first
- [x] BILL-003: protected health page, accurate labels, owner alert configured
- [x] MAIL-001: durable outbox, acceptance/delivery distinction, safe retries
- [x] OPS-001: 29 historical invoice failures and expired-checkout record reconciled
- [x] Staging verification complete
- [x] Production verification and scheduled-pass observation complete
- [x] Release record records version, tests, rollback reference, and limitations
- [ ] SEC-001: recheck supported upstream fix by November 6 ([issue #49](https://github.com/mtheoford/lynn-clickbaitpays/issues/49))

Reopen the relevant ID if an incident recurs. Record timestamps, event/delivery
IDs, current provider state, customer impact, and the repair outcome; do not put
secrets, payment details, or complete webhook payloads in this document.
