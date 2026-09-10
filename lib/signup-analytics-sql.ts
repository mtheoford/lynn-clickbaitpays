// Paid signups use signed Stripe events retained before this tracking upgrade.
// The subscription ID matches the lifecycle writer, so retries and initial
// invoice/Checkout events cannot count a subscription twice. No PII is returned.
export const SIGNUP_EVENTS_CTE = `WITH stripe_payloads AS (
  SELECT event_type, CASE WHEN json_valid(payload_json) THEN payload_json ELSE '{}' END AS payload
  FROM stripe_events WHERE event_type IN ('checkout.session.completed','checkout.session.async_payment_succeeded','invoice.paid')
), historical_payments AS (
  SELECT json_extract(payload, '$.data.object.subscription') AS subscription_id,
    json_extract(payload, '$.created') * 1000 AS created_at
  FROM stripe_payloads
  WHERE event_type IN ('checkout.session.completed','checkout.session.async_payment_succeeded')
    AND json_extract(payload, '$.data.object.mode') = 'subscription'
    AND json_extract(payload, '$.data.object.payment_status') = 'paid'
    AND json_extract(payload, '$.data.object.amount_total') > 0
    AND json_type(payload, '$.data.object.metadata.siteId') = 'text'
    AND json_extract(payload, '$.data.object.metadata.siteId') != ''
    AND json_type(payload, '$.data.object.subscription') = 'text'
    AND json_type(payload, '$.created') = 'integer'
    AND json_extract(payload, '$.created') > 0
  UNION ALL
  SELECT COALESCE(json_extract(payload, '$.data.object.parent.subscription_details.subscription'), json_extract(payload, '$.data.object.subscription')),
    json_extract(payload, '$.created') * 1000
  FROM stripe_payloads
  WHERE event_type = 'invoice.paid'
    AND json_extract(payload, '$.data.object.billing_reason') = 'subscription_create'
    AND json_extract(payload, '$.data.object.amount_paid') > 0
    AND COALESCE(json_type(payload, '$.data.object.parent.subscription_details.metadata.siteId'), json_type(payload, '$.data.object.subscription_details.metadata.siteId')) = 'text'
    AND COALESCE(json_extract(payload, '$.data.object.parent.subscription_details.metadata.siteId'), json_extract(payload, '$.data.object.subscription_details.metadata.siteId')) != ''
    AND COALESCE(json_type(payload, '$.data.object.parent.subscription_details.subscription'), json_type(payload, '$.data.object.subscription')) = 'text'
    AND json_type(payload, '$.created') = 'integer'
    AND json_extract(payload, '$.created') > 0
), paid_signups AS (
  SELECT id, MIN(created_at) AS created_at FROM (
    SELECT id, created_at FROM signup_page_events WHERE event_type = 'payment_completed'
    UNION ALL
    SELECT 'v2:payment_completed:' || subscription_id, created_at
    FROM historical_payments WHERE subscription_id != ''
  ) GROUP BY id
), events AS (
  SELECT id, CASE WHEN event_type IN ('checkout_failed', 'checkout_error') THEN 'checkout_issue' ELSE event_type END AS event_type,
    visitor_hash, journey_hash, created_at FROM signup_page_events WHERE event_type != 'payment_completed'
  UNION ALL
  SELECT id, 'payment_completed', NULL, NULL, created_at FROM paid_signups
)`;
