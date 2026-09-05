import assert from "node:assert/strict";
import test from "node:test";

import { hashToken } from "../lib/token.ts";
import { buildMagicLinkEmail } from "../lib/magic-link-email.ts";
import { localizedCustomerError } from "../lib/customer-messages.ts";

test("hashes session and magic-link tokens deterministically without storing plaintext", async () => {
  const first = await hashToken("a-private-token");
  const again = await hashToken("a-private-token");
  const different = await hashToken("another-private-token");

  assert.equal(first, again);
  assert.notEqual(first, different);
  assert.match(first, /^[a-f0-9]{64}$/);
  assert.doesNotMatch(first, /private-token/);
});

test("German magic-link emails retain secure one-use instructions and the German return locale", () => {
  const email = buildMagicLinkEmail({
    name: '<script>alert("name")</script>',
    token: "test-token-only",
    origin: "https://cbp.proneurs.org",
    locale: "de",
  });
  const url = new URL(email.verifyUrl);
  assert.equal(url.pathname, "/auth/verify");
  assert.equal(url.searchParams.get("locale"), "de");
  assert.equal(url.searchParams.get("token"), "test-token-only");
  assert.match(email.subject, /Melden Sie sich an/);
  assert.match(email.text, /15 Minuten gültig und kann nur einmal verwendet werden/);
  assert.match(email.html, /lang="de"/);
  assert.match(email.html, /&lt;script&gt;/);
  assert.doesNotMatch(email.html, /<script>/);
});

test("English and French magic-link emails preserve their existing URL conventions", () => {
  for (const locale of ["en", "fr"] as const) {
    const email = buildMagicLinkEmail({ name: "Test", token: "test-token", origin: "https://cbp.proneurs.org", locale });
    assert.equal(new URL(email.verifyUrl).searchParams.get("locale"), locale === "en" ? null : "fr");
    assert.equal(email.subject, locale === "en" ? "Sign in to manage your ProNeurs site" : "Connectez-vous pour gérer votre site ProNeurs");
  }
});

test("German profile and checkout errors retain actionable detail without changing other locales", () => {
  assert.equal(localizedCustomerError("Enter a valid public email address.", "de"), "Geben Sie eine gültige öffentliche E-Mail-Adresse ein.");
  assert.match(localizedCustomerError("That email already manages max-muster. Sign in to update or reactivate the existing site.", "de"), /bereits max-muster/);
  assert.match(localizedCustomerError("Your ClickBaitPays link must include its referral code.", "de"), /Empfehlungscode/);
  for (const locale of ["en", "fr"] as const) {
    assert.equal(localizedCustomerError("Enter a valid public email address.", locale), "Enter a valid public email address.");
  }
});
