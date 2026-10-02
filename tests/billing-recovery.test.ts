import assert from "node:assert/strict";
import test from "node:test";
import { dueBillingNotice, invoiceSubscriptionId, recoveryStillOutstanding } from "../lib/billing-recovery-policy.ts";
import { buildBillingRecoveryEmail } from "../lib/billing-recovery-email.ts";

const deadline = new Date("2026-10-09T14:00:00Z");
const record = { graceEndsAt: deadline, reminderSentAt: null, suspensionSentAt: null, closedAt: null };
const outstanding = {
  invoiceId: "in_current", subscriptionId: "sub_current", customerId: "cus_current",
  invoice: { id: "in_current", status: "open", amount_remaining: 900, customer: "cus_current",
    parent: { subscription_details: { subscription: "sub_current" } } },
  subscription: { id: "sub_current", status: "past_due", latest_invoice: "in_current", customer: "cus_current" },
};

test("Stripe handles the initial failure; the site reminder is due only in the last 24 hours", () => {
  for (const date of ["2026-10-02T14:00:00Z", "2026-10-06T14:00:00Z", "2026-10-08T13:59:59Z"]) {
    assert.equal(dueBillingNotice(record, "past_due", new Date(date)), null);
  }
  assert.equal(dueBillingNotice(record, "past_due", new Date("2026-10-08T14:00:00Z")), "reminder");
  assert.equal(dueBillingNotice({ ...record, reminderSentAt: new Date() }, "past_due", new Date("2026-10-08T15:00:00Z")), null);
});

test("a late cron sends the suspension notice only after suspension, without stale deadline reminders", () => {
  assert.equal(dueBillingNotice(record, "past_due", deadline), null);
  assert.equal(dueBillingNotice(record, "suspended", deadline), "suspension");
  assert.equal(dueBillingNotice({ ...record, suspensionSentAt: deadline }, "suspended", deadline), null);
  assert.equal(dueBillingNotice({ ...record, closedAt: deadline }, "suspended", deadline), null);
  assert.equal(dueBillingNotice(record, "active", new Date("2026-10-08T14:00:00Z")), null);
});

test("payment recovery requires the exact open invoice, customer, subscription and latest billing cycle", () => {
  assert.equal(recoveryStillOutstanding(outstanding), true);
  for (const status of ["paid", "void", "uncollectible", "draft"]) {
    assert.equal(recoveryStillOutstanding({ ...outstanding, invoice: { ...outstanding.invoice, status } }), false);
  }
  assert.equal(recoveryStillOutstanding({ ...outstanding, invoice: { ...outstanding.invoice, amount_remaining: 0 } }), false);
  for (const status of ["active", "canceled", "incomplete", "paused"]) {
    assert.equal(recoveryStillOutstanding({ ...outstanding, subscription: { ...outstanding.subscription, status } }), false);
  }
  for (const field of ["id", "customer", "latest_invoice"] as const) {
    assert.equal(recoveryStillOutstanding({ ...outstanding, subscription: { ...outstanding.subscription, [field]: "unrelated" } }), false);
  }
  assert.equal(recoveryStillOutstanding({ ...outstanding, invoice: { ...outstanding.invoice, customer: "unrelated" } }), false);
  assert.equal(invoiceSubscriptionId({ subscription: { id: "sub_legacy" } }), "sub_legacy");
  assert.equal(invoiceSubscriptionId({ parent: { subscription_details: { subscription: { id: "sub_current" } } } }), "sub_current");
  assert.equal(invoiceSubscriptionId({}), null);
});

test("deadline emails preserve Stripe payment and account links, escape personal data and use explicit UTC", () => {
  for (const locale of ["en", "fr", "de"] as const) {
    const content = buildBillingRecoveryEmail({ notice: "reminder", name: '<img src=x onerror="alert(1)">',
      siteAddress: "taylor.cbp.proneurs.org", graceEndsAt: deadline, paymentUrl: "https://invoice.stripe.com/i/example?a=1&b=2",
      manageUrl: `https://cbp.proneurs.org/${locale}/manage`, supportEmail: "support@proneurs.org", locale,
    });
    assert.match(content.text, /UTC/);
    assert.match(content.text, /https:\/\/invoice\.stripe\.com\/i\/example\?a=1&b=2/);
    assert.match(content.html, /a=1&amp;b=2/);
    assert.match(content.html, /&lt;img/);
    assert.doesNotMatch(content.html, /<img/);
    assert.match(content.html, new RegExp(`lang="${locale}"`));
  }
  const content = buildBillingRecoveryEmail({ notice: "suspension", name: "Taylor", siteAddress: "taylor.cbp.proneurs.org",
    graceEndsAt: deadline, paymentUrl: null, manageUrl: "https://cbp.proneurs.org/manage", supportEmail: "support@proneurs.org", locale: "en" });
  assert.match(content.text, /details are still saved/);
  assert.match(content.html, /href="https:\/\/cbp\.proneurs\.org\/manage"/);
  assert.doesNotMatch(content.text, /remains online|undefined|null/);
});
