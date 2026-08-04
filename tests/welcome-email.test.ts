import assert from "node:assert/strict";
import test from "node:test";
import { buildWelcomeEmail } from "../lib/welcome-email.ts";

test("welcome email includes the live site, secure sign-in instructions, and support path", () => {
  const content = buildWelcomeEmail({
    name: "Taylor Customer",
    publicUrl: "https://taylor.cbp.proneurs.org",
    manageUrl: "https://cbp.proneurs.org/manage",
    supportEmail: "support@proneurs.org",
  });

  assert.equal(content.subject, "Your ProNeurs Personal CBP Site is ready");
  assert.match(content.text, /https:\/\/taylor\.cbp\.proneurs\.org/);
  assert.match(content.text, /same email address you used during purchase/i);
  assert.match(content.text, /single-use sign-in link/i);
  assert.match(content.text, /Save changes/);
  assert.match(content.text, /support@proneurs\.org/);
  assert.match(content.html, /View your live site/);
  assert.match(content.html, /How to edit your information/);
});

test("welcome email escapes customer-controlled HTML", () => {
  const content = buildWelcomeEmail({
    name: '<img src=x onerror="alert(1)">',
    publicUrl: "https://example.com/?a=1&b=2",
    manageUrl: "https://example.com/manage?a=1&b=2",
    supportEmail: "support+sites@example.com",
  });

  assert.doesNotMatch(content.html, /<img src=x/);
  assert.match(content.html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
  assert.match(content.html, /a=1&amp;b=2/);
});
