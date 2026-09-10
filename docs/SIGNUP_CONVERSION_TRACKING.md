# Signup conversion tracking

The admin dashboard charts signup traffic, form activity, checkout outcomes, and initial sales. Week shows the last seven Denver calendar days; Month shows the last 30; Lifetime begins at the earliest retained observation. Today is partial. Histories over 90 days use monthly points; shorter histories use daily points. Existing calendar-range filters remain available.

## Count definitions

- Visitors are distinct browser identifiers. Form opens and demo clicks count events. Browsers returning on multiple days count once in the period total, so daily counts need not sum to that total.
- Forms started count distinct browser-tab sessions with a form edit. Form submissions count requests that passed native browser validation. Validation issues and checkout errors count affected sessions. The error breakdown counts raw events, including browser and server observations.
- Stripe checkouts count created sessions; browser redirect events describe redirect intent, not proof that Stripe loaded.
- Paid signups count the first positive payment for a subscription. Checkout completion, delayed-payment success, and the initial paid invoice share a subscription deduplication key. Renewals, free checkouts, unpaid sessions, and unrelated Stripe events are excluded.
- Sites activated count distinct sites activated through the tracked lifecycle. Payment failures cover correlated initial invoices and delayed-payment failures, not every uncorrelated card decline. Expired checkouts count sessions Stripe reported as expired.

These are events within a time window, not a cohort conversion rate. One customer's form submission and later payment can fall in different windows. Source, device, and language breakdowns are descriptive; browsers can appear in more than one category.

## History and reliability

Existing visitor/click records remain intact. Signed Stripe events retained in the application database provide historical paid signups without rewriting past rows. Earlier unrecorded form, checkout, error, and activation activity appears as gaps rather than zero. The first covered day or month can be partial. Lifetime means available retained history.

Random browser and tab-session identifiers are hashed before durable storage. Analytics records only allowed event types, coarse device groups, supported locales, source/referrer host, plan, and safe error/field categories. Entered names, emails, phones, referral usernames, and raw exception messages are not added to analytics. Browser storage or transport failures do not interrupt signup. Server analytics writes are caught and bounded; request handlers defer them until after the response. Browser-submitted events cannot claim server payment or activation outcomes.

## Release and verification

Use the GitHub Deploy Cloudflare Worker workflow, which applies additive D1 migration `0007_conversion_funnel.sql` before deploying the Worker. The migration adds optional event dimensions and the `conversion_v2` start timestamp; it preserves previous rows and billing state. Verify the exact reviewed main revision through staging before production.

Release checks cover security policy, lint, TypeScript, unit tests, SQLite migration/history/date handling, Worker build, and desktop Chromium/mobile WebKit purchase and tracking flows. Browser tests use local mocked checkout endpoints. Native beacon delivery is checked with a local receiver. Chart fixtures have no public route or admin bypass. Deployed smoke checks open purchase dialogs without submitting purchases.
