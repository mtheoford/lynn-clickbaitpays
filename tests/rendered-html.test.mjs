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
  assert.match(html, /Share ClickBaitPays with a page that feels like/);
  assert.match(html, /cbp-your-name\.proneurs\.org/);
  assert.match(html, /Continue with \$9\/month/);
  assert.match(html, /secure Stripe Checkout/i);
});

test("does not publish an unknown replicated subdomain", async () => {
  const response = await render("/", { host: "cbp-unknown.proneurs.org" });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /This page is not currently available/);
  assert.doesNotMatch(html, /Advertise\.\s*<!-- -->Participate/);
});
