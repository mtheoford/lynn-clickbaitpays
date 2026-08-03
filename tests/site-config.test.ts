import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeSiteSlug,
  siteUrl,
  slugFromHost,
  validateReferralUrl,
  validateSiteSlug,
} from "../lib/site-routing.ts";

test("normalizes customer names into safe tenant labels", () => {
  assert.equal(normalizeSiteSlug("  Lýnn  Theobald! "), "lynn-theobald");
  assert.equal(validateSiteSlug("admin"), "That site name is reserved. Please choose another.");
  assert.equal(validateSiteSlug("lynn-theobald"), null);
});

test("resolves nested production and legacy tenant hosts", () => {
  assert.equal(slugFromHost("lynn-theobald.cbp.proneurs.org"), "lynn-theobald");
  assert.equal(slugFromHost("cbp-lynn-theobald.proneurs.org"), "lynn-theobald");
  assert.equal(slugFromHost("cbp.proneurs.org"), null);
});

test("builds the configured tenant URL", () => {
  assert.equal(siteUrl("Lynn Theobald"), "https://lynn-theobald.cbp.proneurs.org");
});

test("builds a path-based tenant URL when the pilot host has no wildcard domain", () => {
  const originalTenantDomain = process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN;
  const originalPrimaryDomain = process.env.NEXT_PUBLIC_PRIMARY_DOMAIN;
  try {
    Reflect.deleteProperty(process.env, "NEXT_PUBLIC_TENANT_BASE_DOMAIN");
    process.env.NEXT_PUBLIC_PRIMARY_DOMAIN = "personal-sites.example.com";
    assert.equal(
      siteUrl("Lynn Theobald"),
      "https://personal-sites.example.com/s/lynn-theobald",
    );
  } finally {
    if (originalTenantDomain === undefined) {
      Reflect.deleteProperty(process.env, "NEXT_PUBLIC_TENANT_BASE_DOMAIN");
    } else {
      process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN = originalTenantDomain;
    }
    if (originalPrimaryDomain === undefined) {
      Reflect.deleteProperty(process.env, "NEXT_PUBLIC_PRIMARY_DOMAIN");
    } else {
      process.env.NEXT_PUBLIC_PRIMARY_DOMAIN = originalPrimaryDomain;
    }
  }
});

test("accepts only official ClickBaitPays referral links with a ref code", () => {
  assert.equal(validateReferralUrl("https://clickbaitpays.me/?ref=thinleo"), null);
  assert.match(validateReferralUrl("https://example.com/?ref=thinleo") ?? "", /official/);
  assert.match(validateReferralUrl("https://clickbaitpays.me/") ?? "", /referral code/);
});
