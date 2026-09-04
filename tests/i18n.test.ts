import assert from "node:assert/strict";
import test from "node:test";

import {
  isSiteLocale,
  localizedGrowthSignupUrl,
  localizedPath,
  sponsorSitePath,
} from "../lib/i18n.ts";

test("recognizes only supported public site locales", () => {
  assert.equal(isSiteLocale("en"), true);
  assert.equal(isSiteLocale("fr"), true);
  assert.equal(isSiteLocale("fr-FR"), false);
});

test("adds and removes the French route prefix without duplicating it", () => {
  assert.equal(localizedPath("fr", "/terms"), "/fr/terms");
  assert.equal(localizedPath("fr", "/fr/terms"), "/fr/terms");
  assert.equal(localizedPath("en", "/fr/terms"), "/terms");
  assert.equal(localizedPath("fr", "/"), "/fr");
});

test("builds locale routes that preserve the sponsor slug", () => {
  assert.equal(sponsorSitePath("en", "marie-dupont"), "/s/marie-dupont");
  assert.equal(sponsorSitePath("fr", "marie-dupont"), "/fr/s/marie-dupont");
  assert.equal(sponsorSitePath("en"), "/");
  assert.equal(sponsorSitePath("fr"), "/fr");
});

test("sends French growth traffic to the French signup path and keeps attribution", () => {
  const signupUrl = "https://cbp.proneurs.org/get-your-site?source=marie-dupont";

  assert.equal(localizedGrowthSignupUrl(signupUrl, "en"), signupUrl);
  assert.equal(
    localizedGrowthSignupUrl(signupUrl, "fr"),
    "https://cbp.proneurs.org/fr/get-your-site?source=marie-dupont",
  );
});
