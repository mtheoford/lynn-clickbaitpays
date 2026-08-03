# ProNeurs Personal CBP Sites

A multi-tenant subscription application for centrally managed, personalized
ClickBaitPays education and referral sites.

## Production architecture

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

One application serves all surfaces:

| Surface | Production address |
| --- | --- |
| Marketing and signup | `https://cbp.proneurs.org` |
| Customer site | `https://{slug}.cbp.proneurs.org` |
| Customer management | `https://cbp.proneurs.org/manage` |
| Administration | `https://admin.cbp.proneurs.org/admin` |

The existing OpenAI Sites configuration remains in the repository as a rollback
path until Cloudflare production cutover is complete.

The hosted pilot uses `/s/{slug}` tenant addresses on its Sites hostname. When
`NEXT_PUBLIC_TENANT_BASE_DOMAIN` is configured in Cloudflare, the same records
automatically use `{slug}.cbp.proneurs.org` without changing customer data.

## Local development

Use Node.js 22.13 or newer.

```bash
cp .env.example .env.local
npm install
npm run dev
```

For a local Worker/D1 integration preview:

```bash
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

## Cloudflare bootstrap

Add `proneurs.org` to the Cloudflare account and reproduce its existing DNS
records before changing the domain's authoritative nameservers. Keep the current
Sites records in place during this step so the live preview is not interrupted.
Workers routes require the domain to be an active Cloudflare zone.

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

## GitHub environments

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
- `EMAIL_FROM`
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
expiration every 15 minutes.

Verify the Resend sending domain before testing welcome and magic-link email.
Until Resend is configured, the hosted pilot exposes Sign in with ChatGPT as a
customer and administrator fallback; the account email must match the purchase
or administrator allowlist email.

## Operations and recovery

- Weekly Dependabot checks cover npm packages and GitHub Actions. Enable
  Dependabot alerts and security updates in the GitHub repository settings after
  the branch is pushed.
- `npm run audit:security` blocks new and critical advisories and enforces the
  expiration dates in `.github/security-audit-allowlist.json`. The current risk
  assessment and review procedure are in
  [`docs/DEPENDENCY_SECURITY.md`](docs/DEPENDENCY_SECURITY.md).
- D1 Time Travel provides point-in-time restore for accidental data changes;
  record the database bookmark before and after production migrations.
- Failed billing messages are retried five times and then moved to the configured
  dead-letter queue for manual inspection and replay.
- Worker observability is enabled. Add alerting for webhook 5xx responses, queue
  failures, and elevated application errors before the pilot.
- Keep the previous Sites deployment and DNS values documented until production
  smoke tests and the pilot acceptance window have passed.

## Launch gates

Do not enable live billing until branding permission, legal/claims review,
privacy and subscription policies, wildcard TLS, Stripe business approval,
transactional email, and end-to-end failure/replay testing are complete. Keep
`ENABLE_APPROVED_INCOME_STRATEGY_CONTENT=false` unless the hidden simulator and
related claims receive explicit approval.

The fuller product and cutover checklist is in
[`docs/REPLICATED_SITE_PRODUCT_PLAN.md`](docs/REPLICATED_SITE_PRODUCT_PLAN.md).
