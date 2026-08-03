import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeSiteSlug,
  siteUrl,
  slugFromHost,
  validateReferralUrl,
  validateSiteSlug,
} from "../lib/site-routing.ts";

function withEnvironment(
  values: Record<string, string | undefined>,
  callback: () => void,
) {
  const originals = Object.fromEntries(
    Object.keys(values).map((key) => [key, process.env[key]]),
  );

  try {
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined) Reflect.deleteProperty(process.env, key);
      else process.env[key] = value;
    }
    callback();
  } finally {
    for (const [key, value] of Object.entries(originals)) {
      if (value === undefined) Reflect.deleteProperty(process.env, key);
      else process.env[key] = value;
    }
  }
}

test("normalizes customer names into safe tenant labels", () => {
  assert.equal(normalizeSiteSlug("  Lýnn  Theobald! "), "lynn-theobald");
  assert.equal(validateSiteSlug("admin"), "That site name is reserved. Please choose another.");
  assert.equal(validateSiteSlug("lynn-theobald"), null);
});

test("resolves nested production and legacy tenant hosts", () => {
  withEnvironment(
    { NEXT_PUBLIC_TENANT_BASE_DOMAIN: "cbp.proneurs.org" },
    () => {
      assert.equal(
        slugFromHost("lynn-theobald.cbp.proneurs.org"),
        "lynn-theobald",
      );
      assert.equal(
        slugFromHost("cbp-lynn-theobald.proneurs.org"),
        "lynn-theobald",
      );
      assert.equal(slugFromHost("cbp.proneurs.org"), null);
    },
  );
});

test("builds the configured tenant URL", () => {
  withEnvironment(
    { NEXT_PUBLIC_TENANT_BASE_DOMAIN: "cbp.proneurs.org" },
    () => {
      assert.equal(
        siteUrl("Lynn Theobald"),
        "https://lynn-theobald.cbp.proneurs.org",
      );
    },
  );
});

test("builds a path-based tenant URL when the pilot host has no wildcard domain", () => {
  withEnvironment(
    {
      NEXT_PUBLIC_TENANT_BASE_DOMAIN: undefined,
      NEXT_PUBLIC_PRIMARY_DOMAIN: "personal-sites.example.com",
    },
    () => {
      assert.equal(
        siteUrl("Lynn Theobald"),
        "https://personal-sites.example.com/s/lynn-theobald",
      );
    },
  );
});

test("accepts only official ClickBaitPays referral links with a ref code", () => {
  assert.equal(validateReferralUrl("https://clickbaitpays.me/?ref=thinleo"), null);
  assert.match(validateReferralUrl("https://example.com/?ref=thinleo") ?? "", /official/);
  assert.match(validateReferralUrl("https://clickbaitpays.me/") ?? "", /referral code/);
});
