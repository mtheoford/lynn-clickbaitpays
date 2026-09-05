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

test("French welcome email uses French copy and localized site-management links", () => {
  const content = buildWelcomeEmail({
    name: "Camille Martin",
    publicUrl: "https://cbp.proneurs.org/fr/s/camille-martin",
    manageUrl: "https://cbp.proneurs.org/fr/manage",
    supportEmail: "support@proneurs.org",
    locale: "fr",
  });

  assert.equal(content.subject, "Votre site CBP personnel ProNeurs est prêt");
  assert.match(content.text, /Bonjour Camille Martin/);
  assert.match(content.text, /https:\/\/cbp\.proneurs\.org\/fr\/s\/camille-martin/);
  assert.match(content.text, /https:\/\/cbp\.proneurs\.org\/fr\/manage/);
  assert.match(content.text, /lien de connexion sécurisé et à usage unique/i);
  assert.match(content.html, /lang="fr"/);
  assert.match(content.html, /Voir votre site en ligne/);
  assert.match(content.html, /Enregistrer les modifications/);
});

test("German welcome email includes localized links, all setup instructions, and escaped personal data", () => {
  const content = buildWelcomeEmail({
    name: 'Max <Muster> & Partner',
    publicUrl: "https://cbp.proneurs.org/de/s/max-muster",
    manageUrl: "https://cbp.proneurs.org/de/manage",
    supportEmail: "support@proneurs.org",
    locale: "de",
  });
  assert.equal(content.subject, "Ihre persönliche CBP-Website von ProNeurs ist bereit");
  assert.match(content.text, /https:\/\/cbp\.proneurs\.org\/de\/s\/max-muster/);
  assert.match(content.text, /https:\/\/cbp\.proneurs\.org\/de\/manage/);
  assert.match(content.text, /beim Kauf verwendet/);
  assert.match(content.text, /einmalig verwendbaren Anmeldelink/);
  assert.match(content.text, /15 Minuten/);
  assert.match(content.text, /Änderungen speichern/);
  assert.match(content.text, /keine?s? Passwort/);
  assert.match(content.html, /lang="de"/);
  assert.match(content.html, /Max &lt;Muster&gt; &amp; Partner/);
  assert.match(content.html, /Ihre Website ansehen/);
  assert.match(content.html, /garantiert weder Besucherzahlen noch Empfehlungen, Teilnahmen oder Einnahmen/);
});
