# ProNeurs Replicated CBP Site Product Plan

Status: production-stack implementation complete; account provisioning and launch validation pending
Last updated: 2026-08-03  
Working product name: **Personal CBP Site**

## Product objective

Turn the existing ClickBaitPays sponsor landing page into a small multi-tenant
subscription product. A customer supplies their contact details and official
ClickBaitPays referral URL, pays for a subscription, and receives a personalized
site at a ProNeurs subdomain such as:

`https://lynn-theobald.cbp.proneurs.org`

The product must use one centrally maintained application and template. It must
not copy, deploy, or maintain a separate codebase for each customer.

## Product surfaces

| Surface | Initial URL | Purpose |
| --- | --- | --- |
| Marketing and signup | `https://cbp.proneurs.org` | Sell the subscription and collect onboarding details |
| Replicated sponsor site | `https://{slug}.cbp.proneurs.org` | Personalized public ClickBaitPays education and referral page |
| Customer account | `https://cbp.proneurs.org/manage` | Edit site details, share the site, view basic analytics, and manage billing |
| Internal administration | `https://admin.cbp.proneurs.org/admin` | Manage users, sites, billing status, publication, and support actions |

The first deployment may use path-based equivalents while wildcard-domain and
custom-domain support are configured. The data model and host parser must remain
subdomain-ready.

## Customer journey

1. A prospect reaches the marketing page directly or through the centrally
   controlled "Get Your Personal CBP Site" link on an existing sponsor site.
2. The source sponsor slug is recorded for attribution.
3. The prospect enters their name, email, phone, desired site slug, and official
   ClickBaitPays referral link.
4. The application validates and temporarily reserves the slug.
5. Stripe Checkout collects payment for a monthly or annual subscription.
6. A verified `checkout.session.completed` webhook activates the site. The
   browser redirect alone never provisions service.
7. The customer receives a welcome email with the public site URL and a secure
   account-management link.
8. Subscription webhooks maintain access after renewals, failed payments, and
   cancellation.

## Public sponsor-site requirements

Every site is rendered from shared content plus a controlled customer profile:

- Display name, initials or profile photo
- Public email and phone, each independently hideable
- Short sponsor introduction
- Validated `clickbaitpays.me` referral URL
- Personalized metadata and social-sharing information
- Share actions and downloadable QR code in a later increment
- Basic privacy-preserving visit and referral-button click analytics
- Clear independent-affiliate and risk disclosures

Every sponsor site must also contain a visually distinct, centrally controlled
growth CTA:

> Want a page like this? Get your own personalized CBP sharing site in minutes.
> **Get Your Personal CBP Site**

The CTA links to the marketing flow with source attribution, for example:

`https://cbp.proneurs.org/signup?source=lynn-theobald`

This CTA cannot be edited or removed by subscribers. It must not be visually
confused with the sponsor's "Join ClickBaitPays" buttons.

## Subdomain rules

- DNS labels are lowercase and use ASCII letters, digits, and single hyphens.
- Customer URLs use a slug below the dedicated `cbp.proneurs.org` tenant zone.
- Spaces become hyphens; unsupported punctuation is removed.
- Reserved labels include `admin`, `api`, `billing`, `cbp`, `manage`, `support`,
  `www`, and infrastructure names.
- Slugs are unique and checked again on the server immediately before Checkout.
- A pending Checkout reservation expires after 24 hours.
- Unknown or inactive subdomains return a neutral unavailable page rather than
  leaking account state.

The production domain requires wildcard DNS and TLS for `*.cbp.proneurs.org`.
Creating a customer must not require an individual DNS change.

## Subscription and publication lifecycle

| Internal state | Public behavior | Administrative behavior |
| --- | --- | --- |
| `pending` | Not published | Checkout can be completed or reservation released |
| `active` | Published | Normal service |
| `past_due` | Published during grace period | Payment recovery messaging and Stripe portal link |
| `suspended` | Neutral unavailable page | Admin or automated billing suspension |
| `canceled` | Published until paid-through date, then unavailable | Data retained for reactivation window |
| `deleted` | Unavailable | Personal data removed under retention policy |

Initial grace period: seven days after a failed renewal. Exact cancellation and
retention language must match the final customer Terms of Service.

## Stripe integration

Use Stripe-hosted Checkout in `subscription` mode and Stripe's customer portal.
The application stores Stripe identifiers but never stores card data.

Minimum webhook events:

- `checkout.session.completed`
- `checkout.session.expired`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Webhook processing must verify the raw request signature, be idempotent by
Stripe event ID, and reconcile Stripe customer and subscription IDs with the
local user and site records.

Before live billing, ProNeurs must complete Stripe account activation and obtain
written comfort that this independently sold website service is supportable
under Stripe's restricted-business rules. The service must be represented
accurately and must not be described as selling ClickBaitPays traffic, earnings,
or participation.

## Customer access

The Cloudflare-hosted customer dashboard uses transactional-email magic links.
The signed-in email must match the email used to purchase the site. The flow
provides:

- Short-lived, single-use login links
- Hashed tokens stored in the database
- Secure, HTTP-only, same-site session cookies
- Generic responses that do not reveal whether an email has an account
- Per-account issuance rate limiting

The Sites-supported Sign in with ChatGPT path remains only as a temporary
compatibility fallback during cutover and should be removed after rollback is no
longer required.

Billing changes are delegated to Stripe's customer portal.

## Minimal internal admin

The initial admin is a protected surface for allowlisted ProNeurs administrators.
It includes:

- Summary counts for active, pending, past-due, suspended, and canceled sites
- Search by name, email, slug, or Stripe customer ID
- Customer and site detail views
- Open the public page and Stripe customer record
- Activate, suspend, or unpublish a site
- Correct customer contact and referral information
- Resend welcome or passwordless-login email
- Grant a documented complimentary period in a later billing increment
- View subscription state, last payment status, and simple site analytics
- Immutable audit entries for administrative changes

The admin must not display or edit payment-card details. Authentication identifies
the administrator, and authorization is enforced server-side through an explicit
email allowlist.

## Data model

Initial durable records:

- `users`: identity, contact information, and Stripe customer association
- `sites`: slug, public profile, referral URL, attribution, and publication state
- `subscriptions`: Stripe association, plan, state, renewal, and grace period
- `magic_link_tokens`: single-use customer authentication challenges
- `sessions`: revocable customer sessions
- `analytics_events`: privacy-limited visits and outbound referral clicks
- `stripe_events`: idempotency record for webhook processing
- `audit_logs`: administrative and security-relevant changes

Uploaded profile images are deferred. When introduced, image bytes belong in R2
and ownership metadata belongs in D1.

## Compliance and content controls

- Confirm permission to use ClickBaitPays names, marks, videos, and documents.
- Clearly identify every page as an independent affiliate site.
- Put an affiliate disclosure near the first referral CTA.
- Keep centrally managed disclosures and official-resource links versioned.
- Do not allow subscribers to publish arbitrary earnings claims.
- Do not collect ClickBaitPays passwords, wallet keys, balances, or account access.
- Keep the existing earnings/referral simulator out of the replicated product
  until its assumptions, substantiation, and presentation receive legal review.
- Validate referral destinations against an explicit host allowlist and block
  unsafe URL schemes and open redirects.
- Publish privacy, subscription, cancellation, refund, and acceptable-use terms
  before accepting live subscriptions.

## Domain and account setup

Observed on 2026-08-03:

- `proneurs.org` is managed in GoDaddy DNS.
- Existing Sites custom-domain records use
  `custom-domains.chatgpt.site` plus a `_cf-custom-hostname` verification record.
- Stripe account activation is complete.
- A test-mode Stripe product named `ProNeurs Personal CBP Site` is configured
  with `$9/month` and `$79/year` recurring prices.
- The Stripe-hosted customer portal is configured for subscription management,
  payment-method updates, invoices, and cancellation.
- A test-mode signed webhook named `ProNeurs Personal CBP Sites (Test)` sends
  the six required lifecycle events to
  `https://lynn-clickbaitpays.theoford.chatgpt.site/api/stripe/webhook`.
- The Stripe test secret, webhook signing secret, and both test price IDs are
  stored as protected Sites runtime values and are not committed to source.
- Sites runtime changes require deployment of the saved application version
  before hosted Checkout and webhook handling use the new configuration.

Do not add wildcard DNS until the production hosting destination and required
verification value are known. Repeat the product, prices, webhook, and runtime
configuration in Stripe live mode only after the remaining launch gates are
complete.

## Delivery increments

### Increment 1 — foundation

- Convert hardcoded sponsor identity into a tenant/site configuration.
- Add the mandatory growth CTA with source attribution.
- Add the D1 schema and initial Lynn site seed.
- Add a marketing/signup page with subdomain preview.
- Add a protected, read-focused admin dashboard and safe publication actions.
- Add Checkout and webhook endpoints that remain inactive until environment
  variables are configured.

### Increment 2 — customer self-service

- Sites-supported customer login and site editing for the pilot.
- Optional transactional-email magic links from a verified ProNeurs sender
  domain before general availability.
- Stripe customer-portal access.
- QR code and expanded social-sharing actions.

### Increment 3 — launch readiness

- Wildcard custom-domain configuration and end-to-end host routing.
- Stripe test-mode product, prices, portal, and signed webhook.
- Subscription lifecycle and failure-path tests.
- Privacy, terms, cancellation, refund, and acceptable-use pages.
- Admin search, detail view, attribution reporting, and audit review.
- Invite-only pilot with five customers before general availability.

## Launch gates

Do not accept live subscriptions until all of these are complete:

1. ClickBaitPays branding/content permission is documented.
2. Legal and claims review is complete.
3. Stripe activation and business-model review are complete.
4. Terms, privacy, cancellation, refund, and acceptable-use policies are public.
5. Wildcard domain and certificate behavior are verified.
6. Payment success, failed renewal, cancellation, webhook replay, login-link,
   duplicate-slug, and admin-authorization paths have been tested.
7. Transactional email authentication and delivery are verified.
