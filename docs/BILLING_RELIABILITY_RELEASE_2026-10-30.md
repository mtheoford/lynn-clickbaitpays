# Billing reliability release — October 30, 2026

Status: production deployed, historical reconciliation complete, and scheduled recovery verified.

## Scope

Implements the prioritized [incident plan](BILLING_RELIABILITY_PLAN_2026-10-30.md): recover interrupted paid checkouts, enforce database-compatible deployment, expose billing health, track welcome delivery, and reconcile the reviewed historical backlog. See [operations](BILLING_OPERATIONS.md), [deployment guards](DEPLOYMENT_GUARDS.md), and [welcome delivery](WELCOME_EMAIL_DELIVERY.md).

Recovery uses existing Stripe records and current subscription state. It does not create payments or subscriptions. Publication overrides, deletion, original publication dates, and existing grace deadlines are retained. Public content, prices, referral destinations, videos, and localization are outside the change.

## Validation evidence

- [PR #48](https://github.com/mtheoford/lynn-clickbaitpays/pull/48) merged as `4c5d271295613ca5132ffb07ae671b75f216a42d`. Its Git tree matches the staging-tested source exactly.
- [CI](https://github.com/mtheoford/lynn-clickbaitpays/actions/runs/41091983984) passed 235 unit/integration tests and 77 browser tests. One keyboard-only test is intentionally skipped on mobile.
- [Staging release](https://github.com/mtheoford/lynn-clickbaitpays/actions/runs/41092510391) repeated all validation, verified 11 migrations, deployed Worker `35bac298-d556-4c44-bbf7-9e5c1a76be06`, and passed 29 live smoke tests. Staging had one existing welcome record seeded as legacy unknown, zero attempted/accepted messages, one active site and no pending work.
- The owner explicitly approved the queued [production release](https://github.com/mtheoford/lynn-clickbaitpays/actions/runs/41093199536) after staging passed. GitHub's existing required-reviewer gate was honored.
- Production repeated the full validation successfully: 235 unit/integration tests, 77 browser tests, 11 verified migrations, and 29 live smoke tests. Worker `f02bf9b9-f6a6-4b10-8b83-45a01a09e19e` deployed at 17:01:50 UTC; live smoke checks completed at 17:04:08 UTC.
- A local browser run stopped on confirmed disk exhaustion before any migration/deployment. German playback assertions passed in one failed test; teardown failed writing traces. The unchanged complete suite passed on GitHub. Only this task's generated dependency/build caches were removed, restoring about 1.1 GiB; source and diagnostic evidence were retained.

- Integration tests exercise the full SQLite migration chain with mocked Stripe and email boundaries, including duplicate/concurrent processing, stale leases, missing webhooks, replacement-session races, overdue accounts, canceled/deleted overrides, email acceptance/delivery distinctions, and migration deployment gates.
- The release command requires security audit, lint, TypeScript, the complete unit/integration suite, Worker build, desktop Chromium and mobile WebKit tests, remote migrations/schema verification, deployment, and public smoke tests.
- Minimal dependency patches: Undici 7.30.1 and transitive Zod 4.6.7. The existing development-only esbuild exception was freshly reviewed and expires November 6; see [dependency review](DEPENDENCY_SECURITY.md).
- Private before/after evidence is retained under the operator checkout's ignored `outputs/billing-reliability/` directory. It is not committed with customer records.

## Production safeguards and rollback

Before rollout, saved a D1 Time Travel bookmark and a narrow snapshot of 114 site/subscription rows, the 30 unresolved events, and recovery records. Previous production Worker version: `fe84e187-a153-4e29-b41f-685d4fd2f590` (October 23).

If code rollback is needed, use the known previous Worker version and keep additive migrations 0009/0010. Do not restore the database merely to roll back code: a database restore can erase legitimate later customer activity. Resume manual billing monitoring while the old Worker is active.

## Outcome

- All 30 reviewed events completed between 17:05:00 and 17:05:35 UTC on one additional processing attempt: 27 paid invoices, two failed-payment invoices, and one expired checkout. The database now contains 401 completed events and no unfinished events. Three ten-message queue batches completed with no error logs or exceptions under the new Worker.
- All 114 existing account rows are identical across the 14 captured identity, subscription, billing-date, publication, and override fields. There are no duplicate site, subscription, or Checkout Session associations. Publication remains 106 active, three past due, two suspended, and three canceled. All five payment-recovery records are unchanged, including the two closed suspension notices.
- The welcome ledger contains 114 historical `legacy_unknown` records and no new send attempts. No new charges, subscriptions, or welcome emails were created by reconciliation.
- Initial nonleasing dead-letter peeks showed five old event-message copies; subsequent peeks returned different batches. Only exact reviewed event IDs with a fresh completed/error-free database record were eligible for deletion. The two remaining incident copies were purged by their individual opaque references. Subsequent peeks were empty and both main/dead-letter queue metrics reported zero backlog. Application event and payment history was retained.
- Six production pages returned HTTP 200 with identical visible text, links, video sources, and media settings compared with the saved baseline. The two suspended pages retained their unavailable messages. The baseline did not save HTTP status codes, so code equality is not claimed.
- Protected administrator URLs redirect unauthenticated visitors to Cloudflare Access. Alternate public/staging admin-health URLs expose no data. The owner-alert secret is configured; healthy state sends no alert.
- At 17:15:49 UTC, the scheduled recovery invocation completed under the new production Worker with outcome `ok`, no error logs, and no exceptions. A subsequent snapshot confirmed unchanged event, account, and recovery records, 401 completed events, zero unfinished work/duplicates/pending sites/leases, and no new welcome sends.

## Known limits and follow-up

- The original interrupted checkout's exact runtime cause remains unknown; leases and independent reconciliation address the observed failure mode.
- The two genuine failed renewal invoices remain billing/customer issues; system repair cannot make a bank approve a payment. Specific decline reasons were not present in saved notifications.
- Historical welcome emails have no reliable provider-message ledger. They remain explicitly `legacy_unknown`; rollout does not resend them in bulk. New mail distinguishes provider acceptance from delivery evidence.
- Authenticated administrator rendering and actual inbox delivery were not verified in this rollout. Authentication boundaries, health queries, provider-state distinctions, and alert deduplication were tested. No live charge was submitted as a test.
- The operator Mac remains critically low on free space despite task-cache cleanup; production runs independently on Cloudflare. Source, snapshots, summaries, screenshots, and release logs were retained; disposable local trace archives and generated build outputs were removed.
- Automatic event recovery is bounded at 10 events plus 10 pending sessions per scheduled pass and 12 event attempts. Welcome sends are bounded at 6 attempts within 23 hours. Exhausted/ambiguous work needs operator review.
- Recheck the development-only esbuild advisory and upstream Drizzle dependency by November 6; tracked in [issue #49](https://github.com/mtheoford/lynn-clickbaitpays/issues/49). This tooling is excluded from the production Worker.
