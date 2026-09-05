import assert from "node:assert/strict";
import test from "node:test";
import { buildCheckoutReminderEmail } from "../lib/checkout-reminder-email.ts";

test("checkout reminder links back to the open Stripe Checkout session", () => {
  const content = buildCheckoutReminderEmail({
    name: "Jamie Rivera",
    siteAddress: "cbp.proneurs.org/jamie-rivera",
    checkoutUrl: "https://checkout.stripe.com/c/pay/cs_test_example",
    supportEmail: "support@proneurs.org",
  });

  assert.match(content.subject, /finish setting up/i);
  assert.match(content.text, /checkout is not complete/i);
  assert.match(content.text, /https:\/\/checkout\.stripe\.com\/c\/pay\/cs_test_example/);
  assert.match(content.text, /reserved for 24 hours/i);
  assert.match(content.html, /Finish secure checkout/);
});

test("checkout reminder escapes customer-controlled HTML", () => {
  const content = buildCheckoutReminderEmail({
    name: '<img src=x onerror="alert(1)">',
    siteAddress: "cbp.proneurs.org/example&more",
    checkoutUrl: 'https://checkout.stripe.com/example?value="unsafe"&next=1',
    supportEmail: "support+sites@proneurs.org",
  });

  assert.doesNotMatch(content.html, /<img src=x/);
  assert.match(content.html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
  assert.match(content.html, /example&amp;more/);
  assert.match(content.html, /value=&quot;unsafe&quot;&amp;next=1/);
});

test("French checkout reminder uses French copy and localized account links", () => {
  const content = buildCheckoutReminderEmail({
    name: "Camille Martin",
    siteAddress: "cbp.proneurs.org/fr/s/camille-martin",
    checkoutUrl: "https://checkout.stripe.com/c/pay/cs_test_fr",
    manageUrl: "https://cbp.proneurs.org/fr/manage/sign-in",
    supportEmail: "support@proneurs.org",
    locale: "fr",
  });

  assert.equal(
    content.subject,
    "Terminez la configuration de votre site CBP personnel ProNeurs",
  );
  assert.match(content.text, /Bonjour Camille Martin/);
  assert.match(content.text, /cbp\.proneurs\.org\/fr\/s\/camille-martin/);
  assert.match(content.text, /https:\/\/cbp\.proneurs\.org\/fr\/manage\/sign-in/);
  assert.match(content.text, /paiement sécurisé avec Stripe/i);
  assert.match(content.html, /lang="fr"/);
  assert.match(content.html, /Terminer le paiement sécurisé/);
  assert.match(content.html, /vous connecter pour gérer votre site/);
});

test("German checkout reminder preserves the Stripe session, reservation terms, and account return", () => {
  const content = buildCheckoutReminderEmail({
    name: "Max <Muster>",
    siteAddress: "cbp.proneurs.org/de/s/max-muster",
    checkoutUrl: "https://checkout.stripe.com/c/pay/cs_test_de?one=1&two=2",
    manageUrl: "https://cbp.proneurs.org/de/manage/sign-in",
    supportEmail: "support@proneurs.org",
    locale: "de",
  });
  assert.match(content.subject, /Schließen Sie die Einrichtung/);
  assert.match(content.text, /https:\/\/checkout\.stripe\.com\/c\/pay\/cs_test_de\?one=1&two=2/);
  assert.match(content.text, /https:\/\/cbp\.proneurs\.org\/de\/manage\/sign-in/);
  assert.match(content.text, /24 Stunden lang reserviert/);
  assert.match(content.text, /automatisch aktiviert/);
  assert.match(content.html, /lang="de"/);
  assert.match(content.html, /Max &lt;Muster&gt;/);
  assert.match(content.html, /one=1&amp;two=2/);
  assert.match(content.html, /Sichere Zahlung abschließen/);
  assert.match(content.html, /anmelden und Ihre Website verwalten/);
});

test("German checkout reminder remains useful without an optional management link", () => {
  const content = buildCheckoutReminderEmail({
    name: "Max Muster",
    siteAddress: "cbp.proneurs.org/de/s/max-muster",
    checkoutUrl: "https://checkout.stripe.com/c/pay/cs_test_de",
    supportEmail: "support@proneurs.org",
    locale: "de",
  });
  assert.match(content.text, /können Sie diese E-Mail ignorieren/);
  assert.doesNotMatch(content.html, /undefined/);
});
