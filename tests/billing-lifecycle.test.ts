import assert from "node:assert/strict";
import test from "node:test";
import { billingLocale, checkoutLocalization, checkoutToResume, localizedPublicUrl } from "../lib/checkout-localization.ts";

import {
  accountDeletionDate,
  graceHasExpired,
  gracePeriodEnd,
  paidThroughHasExpired,
  siteStatusForSubscription,
  siteStatusWithPublicationOverride,
  stripeTimestamp,
  subscriptionAllowsDataDeletion,
} from "../lib/billing-lifecycle.ts";

const now = new Date("2026-08-03T12:00:00.000Z");

test("checkout language persists through Stripe and subscription metadata, referral attribution, and returns", () => {
  for (const locale of ["en", "fr", "de"] as const) {
    const settings = checkoutLocalization({
      origin: "https://cbp.proneurs.org",
      locale,
      slug: "max-muster",
      siteId: "site-test",
      userId: "user-test",
      plan: "annual",
      sourceSlug: "existing-sponsor",
    });
    const prefix = locale === "en" ? "" : `/${locale}`;
    assert.equal(settings.locale, locale === "en" ? "auto" : locale);
    assert.equal(settings.success_url, `https://cbp.proneurs.org${prefix}/get-your-site/success?session_id={CHECKOUT_SESSION_ID}`);
    assert.equal(settings.cancel_url, `https://cbp.proneurs.org${prefix}/get-your-site?checkout=canceled&site=max-muster&source=existing-sponsor`);
    assert.deepEqual(settings.metadata, {
      siteId: "site-test", userId: "user-test", plan: "annual", sourceSlug: "existing-sponsor", locale,
    });
    assert.deepEqual(settings.subscription_data.metadata, settings.metadata);
  }
});

test("billing language recovers German from stored metadata and defaults unknown legacy values safely", () => {
  assert.equal(billingLocale("de"), "de");
  assert.equal(billingLocale("fr"), "fr");
  assert.equal(billingLocale(undefined), "en");
  assert.equal(billingLocale("es"), "en");
  assert.equal(billingLocale({ locale: "de" }), "en");
  assert.equal(localizedPublicUrl("https://cbp.proneurs.org/s/max-muster", "de"), "https://cbp.proneurs.org/de/s/max-muster");
  assert.equal(localizedPublicUrl("https://max-muster.cbp.proneurs.org", "de"), "https://max-muster.cbp.proneurs.org/de");
  assert.equal(localizedPublicUrl("https://cbp.proneurs.org/s/max-muster", "en"), "https://cbp.proneurs.org/s/max-muster");
});

test("a language switch resumes the exact existing payable session without changing its billing metadata", () => {
  const metadata = { siteId: "site-1", userId: "user-1", plan: "annual", sourceSlug: "sponsor-1", locale: "fr" };
  const session = { status: "open", url: "https://checkout.stripe.com/c/pay/cs_existing", metadata };
  const resumed = checkoutToResume(session, {
    siteId: "site-1", userId: "user-1", plan: "annual", sourceSlug: "sponsor-1", locale: "de",
  });
  assert.deepEqual(resumed, { url: session.url, locale: "fr" });
  assert.deepEqual(session.metadata, metadata);
});

test("checkout resume never crosses accounts, plans, sponsors, or completed/expired payments", () => {
  const expected = { siteId: "site-1", userId: "user-1", plan: "annual" as const, sourceSlug: "sponsor-1", locale: "de" as const };
  const session = {
    status: "open", url: "https://checkout.stripe.com/c/pay/cs_existing",
    metadata: { siteId: "site-1", userId: "user-1", plan: "annual", sourceSlug: "sponsor-1", locale: "fr" },
  };
  for (const status of ["complete", "expired", null]) {
    assert.equal(checkoutToResume({ ...session, status }, expected), null);
  }
  for (const field of ["siteId", "userId", "plan", "sourceSlug"]) {
    assert.equal(checkoutToResume({ ...session, metadata: { ...session.metadata, [field]: "different" } }, expected), null);
  }
  assert.equal(checkoutToResume({ ...session, url: null }, expected), null);
  assert.equal(checkoutToResume({ ...session, metadata: null }, expected), null);
  assert.deepEqual(checkoutToResume(session, { ...expected, locale: "fr" }), { url: session.url, locale: "fr" });
});

test("cancel-return attribution survives another language selection and resumes the original payment", () => {
  const settings = checkoutLocalization({ origin: "https://cbp.proneurs.org", locale: "fr", slug: "max-muster", siteId: "site-1", userId: "user-1", plan: "annual", sourceSlug: "sponsor-1" });
  const cancelUrl = new URL(settings.cancel_url);
  assert.equal(cancelUrl.searchParams.get("source"), "sponsor-1");
  const session = { status: "open", url: "https://checkout.stripe.com/c/pay/cs_original", metadata: settings.metadata };
  for (const locale of ["fr", "de"] as const) {
    assert.deepEqual(checkoutToResume(session, {
      siteId: "site-1", userId: "user-1", plan: "annual", sourceSlug: cancelUrl.searchParams.get("source")!, locale,
    }), { url: session.url, locale: "fr" });
  }
});

test("maps Stripe lifecycle states to publishable site states", () => {
  assert.equal(siteStatusForSubscription("active", null, now), "active");
  assert.equal(siteStatusForSubscription("past_due", null, now), "past_due");
  assert.equal(siteStatusForSubscription("paused", null, now), "suspended");
  assert.equal(
    siteStatusForSubscription("canceled", new Date("2026-08-10T12:00:00.000Z"), now),
    "active",
  );
  assert.equal(
    siteStatusForSubscription("canceled", new Date("2026-08-02T12:00:00.000Z"), now),
    "canceled",
  );
});

test("keeps an administrator publication block across billing updates", () => {
  assert.equal(siteStatusWithPublicationOverride("active", "suspended"), "suspended");
  assert.equal(siteStatusWithPublicationOverride("active", "canceled"), "canceled");
  assert.equal(siteStatusWithPublicationOverride("past_due", null), "past_due");
});

test("computes Stripe timestamps and grace windows", () => {
  assert.equal(stripeTimestamp(1_785_758_400)?.toISOString(), "2026-08-03T12:00:00.000Z");
  assert.equal(gracePeriodEnd(now).toISOString(), "2026-08-10T12:00:00.000Z");
  assert.equal(graceHasExpired(new Date("2026-08-03T11:59:59.000Z"), now), true);
  assert.equal(paidThroughHasExpired(new Date("2026-08-04T00:00:00.000Z"), now), false);
});

test("uses a reversible 30-day account data retention window", () => {
  assert.equal(
    accountDeletionDate(now).toISOString(),
    "2026-09-02T12:00:00.000Z",
  );
  assert.equal(subscriptionAllowsDataDeletion("active", "monthly"), false);
  assert.equal(subscriptionAllowsDataDeletion("active", "complimentary"), true);
  assert.equal(
    subscriptionAllowsDataDeletion(
      "canceled",
      "annual",
      new Date("2026-08-10T12:00:00.000Z"),
      now,
    ),
    false,
  );
  assert.equal(
    subscriptionAllowsDataDeletion(
      "canceled",
      "annual",
      new Date("2026-08-02T12:00:00.000Z"),
      now,
    ),
    true,
  );
  assert.equal(subscriptionAllowsDataDeletion(null, null), true);
});
