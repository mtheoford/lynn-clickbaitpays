# Welcome email delivery and recovery

This ledger covers the website-ready welcome email. It does not store login-link
tokens or change billing reminders, pricing, or the customer sign-in flow.

## What the statuses mean

| Status | Meaning |
| --- | --- |
| `pending` | A durable delivery request exists and is waiting for the worker. |
| `sending` | A worker holds a five-minute processing lease. |
| `accepted` | The email provider accepted the send request. This does not confirm inbox delivery. |
| `delivered` | The provider reported delivery, opening, or a link click. Delivery means the receiving server accepted it; it does not prove inbox placement or that the customer read it. |
| `bounced` | The provider reported a bounce. Automatic resend stops. |
| `complained` | The provider reported a spam complaint. Automatic resend stops. |
| `failed` | Sending failed or its outcome is uncertain; a bounded retry is scheduled. |
| `needs_review` | Automatic sending stopped because its retry limit/window was reached, the recipient changed, the provider rejected the idempotent payload, or a delivery problem needs review. |
| `canceled` | The site is no longer publishable, so the queued email saying it is live was not sent. |
| `legacy_unknown` | The account was already provisioned before tracking was introduced. Historical delivery must not be guessed. |

## Automatic behavior

The application records the complete welcome payload before publishing a queue
message. If publication fails, the regular billing cron recovers the durable row.
A bounded scan also recovers newly activated, non-demo accounts whose worker
stopped between activation and creating the initial welcome row. It requires a
linked subscription and a published site, and uses the same stable initial ID.
A canceled subscription qualifies only while its paid-through period is still
in the future and all site publication checks pass; an expired one does not.
Any existing welcome row prevents that scan from creating a second delivery.
This protects old accounts with legacy rows and accounts already recovered by an
administrator. Automatic checkout replays also reuse a prior tracked delivery.
A processing lease prevents concurrent queue and cron executions from sending
the same delivery simultaneously. Six send attempts are allowed, with increasing
delays from five minutes to one hour.

Retries preserve the recipient, sender, content, and provider idempotency key.
Resend retains idempotency results for 24 hours. To leave a safety margin, an
uncertain delivery is never automatically retried 23 hours or more after its first
send attempt. It becomes `needs_review` instead. Once acceptance is recorded,
that delivery ID is never sent again, even after the provider key expires.

Immediately before sending, the application checks that the site remains
published (`active` or `past_due` without a publication override) and the login
email still matches the frozen recipient. A new address requires review rather
than silently using the old key with different personal data.

Known provider message IDs are checked separately for delivery status. Polls are
bounded to ten records per cron run and at most once per six hours for seven days.
A read-permission rejection backs off for 24 hours. Lack of permission leaves the
status at `accepted`; it never causes another send or a false `delivered` label.
If the existing Resend credential has send-only access, delivery confirmation
requires a credential that can read sent-email status. Do not broaden access or
rotate credentials solely to resolve a single customer's request without the
normal credential-management process.

## Manual support

1. Inspect the customer's latest welcome delivery, provider message ID, status,
   and sanitized error in the protected admin area.
2. Check the provider record when available. A successful worker execution is
   evidence of the send path completing, not proof of inbox delivery.
3. For `needs_review` or `legacy_unknown`, verify the recipient and whether a
   previous email was accepted before deliberately resending.
4. Use the existing administrator **Resend welcome email** action only when a
   fresh email is intended. It creates a new delivery ID and therefore may send
   another email. The action is restricted to published sites and remains audited.

The migration records already-provisioned accounts as `legacy_unknown` using
their stable initial welcome IDs. It does not email existing customers, invent
provider IDs, or claim their old emails were delivered. A pending account with no
prior publication or linked subscription can still receive its first tracked
welcome email after recovery. A pending account that already had a subscription
before rollout is conservatively marked `legacy_unknown` and needs an explicit
support decision before resending.

## Verification

`tests/welcome-delivery-integration.test.ts` exercises the production outbox and
provider adapter against the actual SQLite migrations. Coverage includes lost
queue publication, concurrent consumers, expired leases, frozen retry payloads,
timeouts, bounded retries, the provider's idempotency window, changed recipients,
canceled sites, read-permission failure, acceptance versus delivery, bounces,
missing provider IDs, and migration compatibility.

References: [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys),
[retrieve sent-email status](https://resend.com/docs/api-reference/emails/retrieve-email).
