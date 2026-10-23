# ProNeurs Personal CBP Sites

**Deployed October 13 referral update:** the shared sponsor template uses the October 6
overview supplied by the owner and models direct referrals as **10% of campaign
purchase price, excluding activation fees, credited at purchase**, including
repurchases. The new overview is used in English. French/German retain their
native-language overview recordings with adjacent referral corrections, as
requested by the owner. Calculator timing remains 12 click days plus a 7-day
hold. The guides and localized FAQs use the updated rule. See the
[release and verification record](docs/REFERRAL_PURCHASE_UPDATE_2026-10-13.md).

**Central owner hub — October 13, 2026:** [Proneurs Admin](https://admin.proneurs.org) combines CBP and Shift website accounts, sales reports and supported publication controls. It is a separate Worker using the existing protected admin hostname under `/hub/admin`; the CBP `/admin` application remains available. See the [hub README](../proneurs-admin/README.md), [launch verification](../proneurs-admin/docs/LAUNCH_2026-10-13.md), and [new company onboarding guide](../proneurs-admin/docs/NEW_COMPANY_ONBOARDING.md).

A multi-tenant subscription application for centrally managed, personalized
ClickBaitPays education and referral sites. Each subscriber uses the same maintained
template with their own sponsor identity, contact information, and official
ClickBaitPays referral link. The sales page offers **US $9/month or US $79/year**.

Start with the [ProNeurs project map](../PROJECT_MAP.md) for the relationship to
Shift AI and the other folders, or the [CBP documentation index](DOCS_INDEX.md)
for current references and historical plans.

## Project status — reviewed October 11, 2026

The source implements the replicated-site product, including signup and Stripe
Checkout, shared public sponsor pages, customer self-service, administration,
analytics, transactional email, and subscription/publication lifecycle handling.
English, French, and German share the same application and customer records.

The current production configuration targets the Cloudflare Worker
`proneurs-personal-cbp-sites` and D1 database `proneurs-cbp-production` at
`cbp.proneurs.org`. The [September 9 production incident record](docs/PURCHASE_BUTTON_INCIDENT_2026-09-09.md)
documents a deployment and browser checks at that domain. This distinguishes
implemented source and recorded production activity from a fresh verification of
today's deployment, customer accounts, or completed payments; those were not
checked during this documentation review.

## Implemented application architecture

- Next.js 16 and React 19
- Cloudflare Workers via OpenNext
- Cloudflare D1 with Drizzle migrations
- Cloudflare Queues for durable Stripe event processing
- Cloudflare Cron Triggers for billing-state enforcement
- Cloudflare Access plus an application-level administrator allowlist
- Application-owned email magic links for customer access
- Stripe Checkout, subscriptions, customer portal, and signed webhooks
- Resend transactional email
- GitHub Actions for CI, staging deployment, and protected production deployment

One application serves all surfaces. The configured production addresses are:

| Surface | Address | Purpose |
| --- | --- | --- |
| Marketing and signup | `https://cbp.proneurs.org/get-your-site` | Sell the website subscription; `/` redirects here |
| Customer site | `https://cbp.proneurs.org/s/{slug}` | Render the personalized ClickBaitPays sponsor page |
| Customer management | `https://cbp.proneurs.org/manage` | Edit profile/referral details, share the site, view activity, and open Stripe billing |
| Administration | `https://admin.cbp.proneurs.org/admin` | Search accounts, manage publication, and review signup/conversion activity |

French and German equivalents use `/fr` and `/de` prefixes, including
`/fr/s/{slug}` and `/de/s/{slug}`. Current source maps each language to its own
localized videos; English uses the updated overview. See the
[current referral/video release](docs/REFERRAL_PURCHASE_UPDATE_2026-10-13.md)
and the [earlier localized video record](docs/LOCALIZED_VIDEO_ROLLOUT.md).

`NEXT_PUBLIC_PRIMARY_DOMAIN=cbp.proneurs.org` is set in production configuration,
so generated customer links use `/s/{slug}`. `NEXT_PUBLIC_TENANT_BASE_DOMAIN`
remains available for resolving legacy tenant hosts. The original subdomain-first
plan is retained as [historical design context](docs/REPLICATED_SITE_PRODUCT_PLAN.md).

The earlier Lynn sponsor page at `https://mtheoford.github.io/lynn-clickbaitpays/`
is a historical public reference, not the address of this subscription platform.
The retired OpenAI Sites deployment must not be used as a public or rollback address.

## Local development

Run `nvm use` to select patched Node.js 22.23.4 from `.nvmrc`. Node 24.22.1+ or 26.12.1+ within those major release lines is also supported; `npm install` and `npm ci` reject older releases.

```bash
nvm use
cp .env.example .env.local
npm install
npm run dev
```

For a local Worker/D1 integration preview:

```bash
nvm use
npx wrangler d1 migrations apply proneurs-cbp-local --local
npm run preview
```

Useful verification commands:

```bash
npm run lint
npm run typecheck
npm test
npm run build:worker
```

After changing `db/schema.ts`, generate and inspect a forward-only migration:

```bash
npm run db:generate
```

Never place account secrets in `.env.example`, `wrangler.jsonc`, or GitHub-tracked
files.

## Historical initial Cloudflare bootstrap — August 2026

The instructions below preserve the initial setup plan. The current configuration
already names staging/production databases, queues, and routes; its staging host
is `proneurs-personal-cbp-sites-staging.mtheoford.workers.dev`. Use
[`wrangler.jsonc`](wrangler.jsonc) and the [deployment workflow](.github/workflows/deploy.yml)
for the current definitions. The placeholder-ID and `cbp-staging` route instructions
below describe the earlier plan, not the current configuration.

Add `proneurs.org` to the Cloudflare account and reproduce its existing DNS
records before changing the domain's authoritative nameservers. Workers routes
require the domain to be an active Cloudflare zone.

Create separate staging and production resources before the first deployment:

```bash
npx wrangler login
npx wrangler d1 create proneurs-cbp-staging
npx wrangler d1 create proneurs-cbp-production
npx wrangler queues create proneurs-cbp-billing-staging
npx wrangler queues create proneurs-cbp-billing-staging-dead-letter
npx wrangler queues create proneurs-cbp-billing-production
npx wrangler queues create proneurs-cbp-billing-production-dead-letter
```

Replace only the two non-local placeholder D1 IDs in `wrangler.jsonc` with the
IDs returned by Cloudflare. The GitHub workflow instead injects each environment's
`D1_DATABASE_ID` at deployment time, so committed placeholders are intentional.

In Cloudflare DNS, configure proxied records that cover `cbp`, `cbp-staging`, and
the corresponding wildcard tenant hosts. Worker routes are already declared for:

- `cbp.proneurs.org/*`
- `*.cbp.proneurs.org/*`
- `cbp-staging.proneurs.org/*`
- `*.cbp-staging.proneurs.org/*`

Create a Cloudflare Access self-hosted application for the admin route, then set
its audience (`CF_ACCESS_AUD`), team domain, and the explicit `ADMIN_EMAILS`
allowlist. Access authentication is verified again inside the application.

## GitHub deployment workflow

The checked-in workflow deploys staging after successful `main` CI and offers
manual staging/production dispatch. It verifies required Worker secret names,
applies D1 migrations, deploys, and runs purchase-entry smoke checks. The setup
checklist below records the original environment requirements; repository settings
and secret values must be inspected separately when operating a release.

Create `staging` and `production` GitHub environments. Put these values in each
environment, using test-mode Stripe values in staging and live values only after
all launch gates pass.

Environment variable:

- `D1_DATABASE_ID`

Environment secrets:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_MONTHLY`
- `STRIPE_PRICE_ANNUAL`
- `RESEND_API_KEY`
- `ADMIN_EMAILS`
- `CF_ACCESS_AUD`
- `CF_ACCESS_TEAM_DOMAIN`

Protect the production environment with required reviewers. CI runs on pull
requests and `main`; a successful `main` CI run deploys staging. Production is a
manual workflow dispatch and must pass the environment approval gate.

## Stripe and email

Configure one webhook per environment at:

`https://{environment-host}/api/stripe/webhook`

Subscribe to:

- `checkout.session.completed`
- `checkout.session.expired`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

The HTTP handler verifies Stripe's signature, persists the event, and enqueues
its ID. The queue consumer reconciles current Stripe state, making replay and
out-of-order delivery safe. A cron job enforces grace-period and paid-through
expiration every 15 minutes. The same cron permanently purges sites whose
administrator-scheduled 30-day deletion window has elapsed. Subscription
cancellation is managed in Stripe; deletion is a separate administrator action.

The project's recorded ProNeurs Stripe account policy uses one custom card retry
five days after the initial failure, for both CBP and Shift subscriptions.
Recovery emails are enabled
for card and bank-debit failures, using Stripe's hosted payment-update page. After
retry exhaustion, subscriptions and invoices remain past due so the CBP application
can finish its seven-day grace period. Stripe skips automatic retries for declines
that require a new payment method. This policy controls future failures; changing
it does not manually charge or reschedule an existing failed invoice.

For CBP, a failed subscription invoice creates a durable `billing_recovery` record
with the original grace deadline. Stripe handles the initial failure email. The
15-minute cron sends a localized reminder during the final 24 hours and a suspension
notice after the site is actually suspended. Both link to the hosted invoice and
the customer's `/manage` page for updating payment details. Before delivery, the
application verifies the latest open invoice and current subscription with Stripe;
paid invoices, superseded billing cycles, and administrator publication overrides
receive no further notices. Resend idempotency and persisted delivery timestamps
prevent duplicates, while temporary delivery failures retry on the next cron run.
Existing overdue CBP accounts enter this process on the next cron run with their
original deadline, after Stripe confirms their latest invoice is still unpaid.
Payment recovery clears the grace deadline and restores publication unless an
administrator override remains. Failed billing alone does not delete site data.
Shift inherits Stripe's retry and failure-email settings; its eventual site lifecycle
implementation should use the same seven-day reminder/suspension process.

Creating a Stripe Checkout Session also schedules one reminder for 30 minutes
later. Before sending it, the queue consumer verifies that the local site is
still pending, no subscription is connected, and the current Stripe Checkout
Session is still open. The reminder links directly to that hosted Checkout
Session. Resend idempotency and a non-personal audit record prevent duplicate
delivery; the 15-minute cron also recovers reminders that could not be queued.

Production/staging customer access uses application-owned email magic links;
administrator access uses Cloudflare Access and the application allowlist.
The code retains Sign in with ChatGPT compatibility for earlier pilot environments,
but disables that fallback in production and staging. Verify the Resend sending
domain and runtime configuration when operating transactional email.

## Operations and recovery

- Weekly Dependabot configuration covers npm packages and GitHub Actions.
  Repository alert/security-update settings require a separate operational check.
- `npm run audit:security` blocks new and critical advisories and enforces the
  expiration dates in `.github/security-audit-allowlist.json`. The current risk
  assessment and review procedure are in
  [`docs/DEPENDENCY_SECURITY.md`](docs/DEPENDENCY_SECURITY.md).
- D1 Time Travel provides point-in-time restore for accidental data changes;
  record the database bookmark before and after production migrations.
- Failed billing messages are retried five times and then moved to the configured
  dead-letter queue for manual inspection and replay.
- Worker observability is enabled in configuration. The original launch checklist
  called for alerting on webhook 5xx responses, queue failures, and elevated errors;
  this source review does not establish the current external alert configuration.
- Historical cutover guidance used GitHub Pages as the reference before Cloudflare
  acceptance. Current configured platform addresses are listed above.

## Original launch gates — historical checklist

These are the original launch requirements, retained for operational review.
The October 11 documentation review did not audit their completion and does not
reset the recorded Cloudflare production status to an undeployed pilot.

Do not enable live billing until branding permission, legal/claims review,
privacy and subscription policies, wildcard TLS, Stripe business approval,
transactional email, and end-to-end failure/replay testing are complete. Keep
the centrally managed income-strategy disclosures and supporting source material
current before selling or publishing replicated sites.

The fuller product and cutover checklist is in
[`docs/REPLICATED_SITE_PRODUCT_PLAN.md`](docs/REPLICATED_SITE_PRODUCT_PLAN.md).
