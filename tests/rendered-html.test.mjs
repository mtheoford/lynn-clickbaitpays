import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/", headers = {}) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html", ...headers },
    }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("renders the default sponsor site with the growth CTA", async () => {
  const response = await render("/");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Join ClickBaitPays with Lynn Theobald/);
  assert.match(html, /Get Your Personal CBP Site/);
  assert.match(html, /source=lynn-theobald/);
  assert.match(html, /Independent affiliate site/);
});

test("renders the marketing and signup page", async () => {
  const response = await render("/get-your-site?source=lynn-theobald");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Your own CBP page/);
  assert.match(html, /Ready to share/);
  assert.match(html, /Actual personalized ClickBaitPays replicated website/);
  assert.match(html, /Personalized with your information/);
  assert.match(html, /Your referral link/);
  assert.match(html, /Continue with \$9\/month/);
  assert.match(html, /Secure billing through Stripe/i);
});

test("renders a replicated site through the pilot path route", async () => {
  const response = await render("/s/lynn-theobald");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Join ClickBaitPays with Lynn Theobald/);
  assert.match(html, /Get Your Personal CBP Site/);
});

test("does not publish an unknown replicated path", async () => {
  const response = await render("/s/unknown-customer");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /This page is not currently available/);
});

test("does not publish an unknown replicated subdomain", async () => {
  const response = await render("/", { host: "unknown.cbp.proneurs.org" });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /This page is not currently available/);
  assert.doesNotMatch(html, /Advertise\.\s*<!-- -->Participate/);
});

test("renders a safe administrator sign-in prompt without hosted identity", async () => {
  const response = await render("/admin");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Sign in with an administrator account/);
});
