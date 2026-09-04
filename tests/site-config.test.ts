import assert from "node:assert/strict";
import test from "node:test";

import {
  DEMO_SITE_SLUG,
  isLegacyDemoSiteSlug,
  normalizeSiteSlug,
  siteUrl,
  slugFromHost,
  validateReferralUrl,
  validateSiteSlug,
} from "../lib/site-routing.ts";
import {
  formatPhoneForDisplay,
  generatedSponsorBio,
  localizeSponsorBio,
  phoneHref,
} from "../lib/site-presentation.ts";

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
  assert.equal(normalizeSiteSlug("  Demo  Sponsor! "), "demo-sponsor");
  assert.equal(validateSiteSlug("admin"), "That site name is reserved. Please choose another.");
  assert.equal(validateSiteSlug("demo-sponsor"), null);
});

test("identifies the legacy demo route", () => {
  assert.equal(DEMO_SITE_SLUG, "your-name");
  assert.equal(isLegacyDemoSiteSlug("Lynn Theobald"), true);
  assert.equal(isLegacyDemoSiteSlug("your-name"), false);
});

test("resolves nested production and legacy tenant hosts", () => {
  withEnvironment(
    { NEXT_PUBLIC_TENANT_BASE_DOMAIN: "cbp.proneurs.org" },
    () => {
      assert.equal(
        slugFromHost("demo-sponsor.cbp.proneurs.org"),
        "demo-sponsor",
      );
      assert.equal(
        slugFromHost("cbp-demo-sponsor.proneurs.org"),
        "demo-sponsor",
      );
      assert.equal(slugFromHost("cbp.proneurs.org"), null);
    },
  );
});

test("builds the configured tenant URL", () => {
  withEnvironment(
    {
      NEXT_PUBLIC_PRIMARY_DOMAIN: undefined,
      NEXT_PUBLIC_TENANT_BASE_DOMAIN: "cbp.proneurs.org",
    },
    () => {
      assert.equal(
        siteUrl("Demo Sponsor"),
        "https://demo-sponsor.cbp.proneurs.org",
      );
    },
  );
});

test("builds a path-based tenant URL when the pilot host has no wildcard domain", () => {
  withEnvironment(
    {
      NEXT_PUBLIC_TENANT_BASE_DOMAIN: "cbp.proneurs.org",
      NEXT_PUBLIC_PRIMARY_DOMAIN: "personal-sites.example.com",
    },
    () => {
      assert.equal(
        siteUrl("Demo Sponsor"),
        "https://personal-sites.example.com/s/demo-sponsor",
      );
    },
  );
});

test("accepts only official ClickBaitPays referral links with a ref code", () => {
  assert.equal(validateReferralUrl("https://clickbaitpays.me/?ref=thinleo"), null);
  assert.match(validateReferralUrl("https://example.com/?ref=thinleo") ?? "", /official/);
  assert.match(validateReferralUrl("https://clickbaitpays.me/") ?? "", /referral code/);
});

test("formats phone numbers for the page locale without damaging international tel links", () => {
  assert.equal(formatPhoneForDisplay("8017170563", "en"), "(801) 717-0563");
  assert.equal(formatPhoneForDisplay("06 12 34 56 78", "fr"), "06 12 34 56 78");
  assert.equal(formatPhoneForDisplay("+33 (0)6 12 34 56 78", "fr"), "+33 6 12 34 56 78");
  assert.equal(formatPhoneForDisplay("+33 6 12 34 56 78", "fr"), "+33 6 12 34 56 78");
  assert.equal(phoneHref("+33 (0)6 12 34 56 78"), "tel:+33612345678");
  assert.equal(phoneHref("0033 6 12 34 56 78"), "tel:+33612345678");
});

test("localizes only generated sponsor biographies while preserving authored copy", () => {
  const englishDefault = generatedSponsorBio("en", "Camille Martin");
  const frenchDefault = generatedSponsorBio("fr", "Camille Martin");

  assert.equal(localizeSponsorBio(englishDefault, "Camille Martin", "fr"), frenchDefault);
  assert.equal(localizeSponsorBio(frenchDefault, "Camille Martin", "en"), englishDefault);
  assert.equal(
    localizeSponsorBio(
      "Questions before joining? Lynn is here to help you find the facts and take the next step with confidence.",
      "Lynn Theobald",
      "fr",
    ),
    generatedSponsorBio("fr", "Lynn Theobald"),
  );

  const authoredBio = "Je travaille avec cette communauté depuis 2024 et je réponds personnellement à vos questions.";
  assert.equal(localizeSponsorBio(authoredBio, "Camille Martin", "en"), authoredBio);
  assert.equal(localizeSponsorBio(authoredBio, "Camille Martin", "fr"), authoredBio);
});
