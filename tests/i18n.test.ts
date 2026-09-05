import assert from "node:assert/strict";
import test from "node:test";

import {
  isSiteLocale,
  languageSwitchHref,
  localeFromPath,
  languageOptions,
  localizedGrowthSignupUrl,
  localizedPath,
  sponsorSitePath,
} from "../lib/i18n.ts";

test("recognizes only supported public site locales", () => {
  assert.equal(isSiteLocale("en"), true);
  assert.equal(isSiteLocale("fr"), true);
  assert.equal(isSiteLocale("de"), true);
  assert.equal(isSiteLocale("es"), false);
  assert.equal(isSiteLocale("fr-FR"), false);
});

test("German switches replace existing language prefixes and preserve tenant routes", () => {
  assert.equal(localizedPath("de", "/fr/get-your-site"), "/de/get-your-site");
  assert.equal(localizedPath("fr", "/de/get-your-site"), "/fr/get-your-site");
  assert.equal(localizedPath("en", "/de"), "/");
  assert.equal(localizedPath("de", "/de/s/hans-mueller"), "/de/s/hans-mueller");
  assert.equal(sponsorSitePath("de", "hans-mueller"), "/de/s/hans-mueller");
  assert.equal(sponsorSitePath("de"), "/de");
  assert.equal(localeFromPath("/de/manage"), "de");
  assert.equal(localeFromPath("/deutsch"), "en");
  assert.equal(localizedPath("en", "/de//example.com"), "/example.com");
  assert.equal(localizedPath("fr", "//example.com"), "/fr/example.com");
});

test("language links retain sponsor, marketing attribution and canceled checkout state", () => {
  assert.equal(
    languageSwitchHref("de", "/fr/get-your-site", "source=marie-dupont&utm_campaign=europe&checkout=canceled", "#details"),
    "/de/get-your-site?source=marie-dupont&utm_campaign=europe&checkout=canceled#details",
  );
  assert.equal(languageSwitchHref("fr", "/de/s/hans-mueller"), "/fr/s/hans-mueller");
});

test("language links do not propagate auth or payment secrets", () => {
  assert.equal(languageSwitchHref("de", "/fr/manage/confirm", "token=secret&source=alice&email=a%40example.com"), "/de/manage/sign-in?source=alice");
  assert.equal(languageSwitchHref("fr", "/de/get-your-site/success", "session_id=cs_secret"), "/fr/manage");
  assert.equal(languageSwitchHref("en", "/de/faq"), "/");
});

test("language registry includes the featured flags and native names", () => {
  assert.deepEqual(languageOptions.map(({ locale }) => locale), ["en", "fr", "de"]);
  assert.equal(languageOptions.find(({ locale }) => locale === "de")?.nativeName, "Deutsch");
});

test("growth links change languages without losing source attribution", () => {
  assert.equal(localizedGrowthSignupUrl("https://cbp.proneurs.org/fr/get-your-site?source=alice", "de"), "https://cbp.proneurs.org/de/get-your-site?source=alice");
  assert.equal(localizedGrowthSignupUrl("https://cbp.proneurs.org/de/get-your-site?source=alice", "en"), "https://cbp.proneurs.org/get-your-site?source=alice");
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
