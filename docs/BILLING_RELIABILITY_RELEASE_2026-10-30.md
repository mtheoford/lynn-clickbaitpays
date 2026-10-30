# Billing reliability release — October 30, 2026

Status: staging validation in progress; production rollout not yet complete.

## Scope

Implements the prioritized [incident plan](BILLING_RELIABILITY_PLAN_2026-10-30.md): recover interrupted paid checkouts, enforce database-compatible deployment, expose billing health, track welcome delivery, and reconcile the reviewed historical backlog. See [operations](BILLING_OPERATIONS.md), [deployment guards](DEPLOYMENT_GUARDS.md), and [welcome delivery](WELCOME_EMAIL_DELIVERY.md).

Recovery uses existing Stripe records and current subscription state. It does not create payments or subscriptions. Publication overrides, deletion, original publication dates, and existing grace deadlines are retained. Public content, prices, referral destinations, videos, and localization are outside the change.

## Validation evidence

- Integration tests exercise the full SQLite migration chain with mocked Stripe and email boundaries, including duplicate/concurrent processing, stale leases, missing webhooks, replacement-session races, overdue accounts, canceled/deleted overrides, email acceptance/delivery distinctions, and migration deployment gates.
- The release command requires security audit, lint, TypeScript, the complete unit/integration suite, Worker build, desktop Chromium and mobile WebKit tests, remote migrations/schema verification, deployment, and public smoke tests.
- Minimal dependency patches: Undici 7.30.1 and transitive Zod 4.6.7. The existing development-only esbuild exception was freshly reviewed and expires November 6; see [dependency review](DEPENDENCY_SECURITY.md).
- Private before/after evidence is retained under the operator checkout's ignored `outputs/billing-reliability/` directory. It is not committed with customer records.

## Production safeguards and rollback

Before rollout, saved a D1 Time Travel bookmark and a narrow snapshot of 114 site/subscription rows, the 30 unresolved events, and recovery records. Previous production Worker version: `fe84e187-a153-4e29-b41f-685d4fd2f590` (October 23).

If code rollback is needed, use the known previous Worker version and keep additive migrations 0009/0010. Do not restore the database merely to roll back code: a database restore can erase legitimate later customer activity. Resume manual billing monitoring while the old Worker is active.

## Outcome

Pending staging and production verification.

## Known limits and follow-up

- The original interrupted checkout's exact runtime cause remains unknown; leases and independent reconciliation address the observed failure mode.
- The two genuine failed renewal invoices remain billing/customer issues; system repair cannot make a bank approve a payment. Specific decline reasons were not present in saved notifications.
- Historical welcome emails have no reliable provider-message ledger. They remain explicitly `legacy_unknown`; rollout does not resend them in bulk. New mail distinguishes provider acceptance from delivery evidence.
- Automatic event recovery is bounded at 10 events plus 10 pending sessions per scheduled pass and 12 event attempts. Welcome sends are bounded at 6 attempts within 23 hours. Exhausted/ambiguous work needs operator review.
- Recheck the development-only esbuild advisory and upstream Drizzle dependency by November 6. This tooling is excluded from the production Worker.
