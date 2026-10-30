import assert from "node:assert/strict";
import { after, test, type TestContext } from "node:test";
import { mkdtemp, mkdir, readFile, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));
const HOUR = 60 * 60 * 1000;
const SITE = "fixture_site";
const DELIVERY = `welcome-${SITE}`;
type Service = typeof import("../lib/welcome-delivery.ts") & typeof import("../lib/transactional-email.ts") & typeof import("../lib/welcome-delivery-policy.ts") & { setFixture(value: object): void };
await mkdir(join(root, "outputs"), { recursive: true });
const bundleDir = await mkdtemp(join(root, "outputs", "welcome-test-"));
after(() => rm(bundleDir, { recursive: true, force: true }));
const mocks: Record<string, string> = {
  "welcome-test-fixture": "let fixture; export const setFixture = value => { fixture = value; }; export const getFixture = () => fixture;",
  "@/db": 'import {getFixture} from "welcome-test-fixture"; export const getDb = async () => getFixture().db;',
  "@/lib/runtime": 'import {getFixture} from "welcome-test-fixture"; export const getRuntimeEnv = async () => getFixture().env; export const runtimeValue = async name => getFixture().env[name] ?? "";',
  "@/lib/stripe": 'export const getStripe = async () => ({checkout:{sessions:{retrieve:async()=>({metadata:{locale:"en"}})}}});',
  "@/lib/site-config": 'export const siteUrl = slug => `https://cbp.proneurs.org/s/${slug}`;',
};
await build({
  stdin: { contents: 'export * from "./lib/welcome-delivery.ts";export * from "./lib/transactional-email.ts";export * from "./lib/welcome-delivery-policy.ts";export {setFixture} from "welcome-test-fixture";', resolveDir: root },
  outfile: join(bundleDir, "service.mjs"), bundle: true, platform: "node", format: "esm", packages: "external", tsconfig: join(root, "tsconfig.json"),
  plugins: [{ name: "welcome-test-ports", setup(builder) {
    builder.onResolve({ filter: /^(welcome-test-fixture|@\/)/ }, args => mocks[args.path] ? { path: args.path, namespace: "welcome-test" } : undefined);
    builder.onLoad({ filter: /.*/, namespace: "welcome-test" }, args => ({ contents: mocks[args.path], loader: "js" }));
  } }],
});
const service: Service = await import(pathToFileURL(join(bundleDir, "service.mjs")).href);
const migrations = await Promise.all((await readdir(join(root, "drizzle"))).filter(name => /^\d+_.*\.sql$/.test(name)).sort()
  .map(async name => ({ name, sql: await readFile(join(root, "drizzle", name), "utf8") })));

function fixture(t: TestContext, migrateWelcome = true) {
  const sqlite = new DatabaseSync(":memory:");
  t.after(() => sqlite.close());
  sqlite.exec("PRAGMA foreign_keys = ON");
  for (const migration of migrations) if (migrateWelcome || !migration.name.startsWith("0010_")) sqlite.exec(migration.sql);
  const now = Date.now();
  sqlite.prepare("INSERT INTO users (id,email,name,phone,created_at,updated_at) VALUES ('fixture_user','customer@example.test','Original Name','',?,?)").run(now, now);
  function addSite(id: string, status = "active", published = true) {
    sqlite.prepare("INSERT INTO sites (id,user_id,slug,display_name,initials,public_email,public_phone,bio,referral_url,status,published_at,created_at,updated_at) VALUES (?,'fixture_user',?,'Original Name','ON','','','','https://example.test/',?,?,?,?)")
      .run(id, id, status, published ? now : null, now, now);
  }
  addSite(SITE);
  const db = drizzle(async (sql, params, method) => {
    const statement = sqlite.prepare(sql);
    if (method === "run") { statement.run(...params as SQLInputValue[]); return { rows: [] }; }
    statement.setReturnArrays(true);
    return { rows: (method === "get" ? statement.get(...params as SQLInputValue[]) ?? [] : statement.all(...params as SQLInputValue[])) as unknown[] };
  });
  const queued: object[] = [];
  let queueFailure = false;
  const env: Record<string, unknown> = {
    APP_ENV: "production", RESEND_API_KEY: "fake_test_key", EMAIL_FROM: "ProNeurs <sites@mail.proneurs.org>",
    NEXT_PUBLIC_MARKETING_URL: "https://cbp.proneurs.org", NEXT_PUBLIC_SUPPORT_EMAIL: "support@proneurs.org",
    BILLING_QUEUE: { send: async (body: object) => { if (queueFailure) throw new Error("queue unavailable"); queued.push(body); } },
  };
  const requests: { url: string; init: RequestInit | undefined }[] = [];
  let responder: (url: string, init?: RequestInit) => Promise<Response> = async (url, init) =>
    Response.json(init?.method === "POST" ? { id: "email_fixture" } : { id: url.split("/").at(-1), last_event: "delivered" });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => { const url = String(input); requests.push({ url, init }); return responder(url, init); };
  t.after(() => { globalThis.fetch = originalFetch; });
  service.setFixture({ db, env });
  const row = (id = DELIVERY) => sqlite.prepare("SELECT * FROM welcome_email_deliveries WHERE id = ?").get(id);
  return { sqlite, row, env, queued, requests, addSite, setQueueFailure: (value: boolean) => { queueFailure = value; },
    setResponder: (value: typeof responder) => { responder = value; },
    welcomeMigration: () => sqlite.exec(migrations.find(item => item.name.startsWith("0010_"))!.sql),
  };
}

test("welcome outbox survives queue publication failure and cron records provider acceptance separately from delivery", async t => {
  const f = fixture(t);
  f.setQueueFailure(true);
  await assert.rejects(service.enqueueWelcomeEmail(SITE, DELIVERY, "en"), /queue unavailable/);
  assert.equal(f.row()?.status, "pending");
  assert.equal(f.requests.length, 0);
  assert.equal(await service.deliverDueWelcomeEmails(new Date()), 1);
  assert.equal(f.row()?.status, "accepted");
  assert.equal(f.row()?.provider_message_id, "email_fixture");
  assert.equal(f.row()?.delivered_at, null);
  const body = JSON.parse(String(f.requests[0].init?.body));
  assert.match(body.text, /https:\/\/cbp.proneurs.org\/s\/fixture_site/);
  assert.match(body.text, /https:\/\/cbp.proneurs.org\/manage/);
  assert.equal(await service.refreshWelcomeEmailStatuses(new Date()), 1);
  assert.equal(f.row()?.status, "delivered");
  assert.ok(f.row()?.delivered_at);
});

test("concurrent queue deliveries claim one lease and accepted emails never send again after key expiry", async t => {
  const f = fixture(t);
  await service.enqueueWelcomeEmail(SITE, DELIVERY, "en");
  let release!: (value: Response) => void;
  let entered!: () => void;
  const called = new Promise<void>(resolve => { entered = resolve; });
  f.setResponder(async () => { entered(); return new Promise(resolve => { release = resolve; }); });
  const first = service.processWelcomeDelivery(DELIVERY);
  await called;
  await service.processWelcomeDelivery(DELIVERY);
  assert.equal(f.requests.length, 1);
  release(Response.json({ id: "email_fixture" }));
  await first;
  await service.processWelcomeDelivery(DELIVERY, new Date(Date.now() + 48 * HOUR));
  await service.enqueueWelcomeEmail(SITE, DELIVERY, "en");
  assert.equal(f.requests.length, 1);
  assert.equal(f.row()?.attempts, 1);
});

test("timeout retries reuse the exact payload and provider key even when profile and sender change", async t => {
  const f = fixture(t);
  await service.enqueueWelcomeEmail(SITE, DELIVERY, "fr");
  f.setResponder(async () => { throw new DOMException("timed out", "TimeoutError"); });
  await assert.rejects(service.processWelcomeDelivery(DELIVERY), /email_request_unconfirmed/);
  assert.equal(f.row()?.status, "failed");
  const firstRequest = f.requests[0].init;
  assert.ok(firstRequest?.signal);
  f.sqlite.prepare("UPDATE users SET name='Changed Name' WHERE id='fixture_user'").run();
  f.env.EMAIL_FROM = "Changed <new@example.test>";
  f.setResponder(async () => Response.json({ id: "email_fixture" }));
  await service.processWelcomeDelivery(DELIVERY, new Date(Number(f.row()?.next_attempt_at)));
  assert.equal(f.requests[1].init?.body, firstRequest?.body);
  assert.deepEqual(f.requests[1].init?.headers, firstRequest?.headers);
  assert.equal(f.row()?.status, "accepted");
  assert.match(JSON.parse(String(firstRequest?.body)).subject, /Votre site/);
});

test("stale sending leases recover inside the key window but unknown older sends require review", async t => {
  const f = fixture(t);
  await service.enqueueWelcomeEmail(SITE, DELIVERY, "en");
  const now = new Date();
  f.sqlite.prepare("UPDATE welcome_email_deliveries SET status='sending',attempts=1,first_attempt_at=?,lease_token='dead_worker',lease_expires_at=? WHERE id=?")
    .run(now.getTime() - HOUR, now.getTime() - 1, DELIVERY);
  await service.deliverDueWelcomeEmails(now);
  assert.equal(f.row()?.status, "accepted");
  const oldId = "welcome-old-unknown";
  await service.enqueueWelcomeEmail(SITE, oldId, "en");
  f.sqlite.prepare("UPDATE welcome_email_deliveries SET status='sending',attempts=1,first_attempt_at=?,lease_expires_at=? WHERE id=?")
    .run(now.getTime() - 24 * HOUR, now.getTime() - 1, oldId);
  await service.deliverDueWelcomeEmails(now);
  assert.equal(f.row(oldId)?.status, "needs_review");
  assert.equal(f.requests.length, 1);
});

test("provider payload conflict immediately needs review and raw errors are not persisted", async t => {
  const f = fixture(t);
  await service.enqueueWelcomeEmail(SITE, DELIVERY, "en");
  f.setResponder(async () => Response.json({ name: "invalid_idempotent_request", message: "secret provider details customer@example.test" }, { status: 409 }));
  await assert.rejects(service.processWelcomeDelivery(DELIVERY), /email_idempotency_conflict/);
  assert.equal(f.row()?.status, "needs_review");
  assert.equal(f.row()?.last_error, "email_idempotency_conflict");
  await service.deliverDueWelcomeEmails(new Date(Date.now() + HOUR));
  assert.equal(f.requests.length, 1);
});

test("a delayed cron cutoff cannot create an expired send lease", async t => {
  const f = fixture(t);
  await service.enqueueWelcomeEmail(SITE, DELIVERY, "en");
  const beganAt = Date.now();
  f.sqlite.prepare("UPDATE welcome_email_deliveries SET next_attempt_at=? WHERE id=?").run(beganAt - HOUR, DELIVERY);
  f.setResponder(async () => {
    assert.ok(Number(f.row()?.lease_expires_at) > Date.now() + 4 * 60 * 1000);
    assert.ok(Number(f.row()?.first_attempt_at) >= beganAt);
    return Response.json({ id: "email_fixture" });
  });
  await service.deliverDueWelcomeEmails(new Date(beganAt - 10 * 60 * 1000));
  assert.equal(f.row()?.status, "accepted");
  assert.equal(f.requests.length, 1);
});

test("six rejected send attempts stop automatically without another charge or infinite queue retry", async t => {
  const f = fixture(t);
  await service.enqueueWelcomeEmail(SITE, DELIVERY, "en");
  f.setResponder(async () => Response.json({ name: "rate_limit_exceeded" }, { status: 429 }));
  for (let attempt = 0; attempt < 6; attempt++) {
    await assert.rejects(service.processWelcomeDelivery(DELIVERY, new Date(Number(f.row()?.next_attempt_at))), /email_provider_http_429/);
  }
  assert.equal(f.row()?.status, "needs_review");
  assert.equal(f.row()?.attempts, 6);
  await service.processWelcomeDelivery(DELIVERY, new Date(Date.now() + 12 * HOUR));
  assert.equal(f.requests.length, 6);
});

test("later cancellation or changed recipient prevents the queued live-site email", async t => {
  const f = fixture(t);
  await service.enqueueWelcomeEmail(SITE, DELIVERY, "en");
  f.sqlite.prepare("UPDATE sites SET status='canceled',publication_override='canceled' WHERE id=?").run(SITE);
  await service.processWelcomeDelivery(DELIVERY);
  assert.equal(f.row()?.status, "canceled");
  assert.equal(f.requests.length, 0);
  f.sqlite.prepare("UPDATE sites SET status='active',publication_override=NULL WHERE id=?").run(SITE);
  const resend = "manual-welcome";
  await service.enqueueWelcomeEmail(SITE, resend, "en");
  f.sqlite.prepare("UPDATE users SET email='different@example.test' WHERE id='fixture_user'").run();
  await service.processWelcomeDelivery(resend);
  assert.equal(f.row(resend)?.status, "needs_review");
  assert.equal(f.row(resend)?.last_error, "welcome_recipient_changed");
  assert.equal(f.requests.length, 0);
});

test("delivery read permission failure retains accepted status and backs off for 24 hours", async t => {
  const f = fixture(t);
  await service.enqueueWelcomeEmail(SITE, DELIVERY, "en");
  await service.processWelcomeDelivery(DELIVERY);
  f.setResponder(async () => Response.json({ message: "not allowed" }, { status: 403 }));
  const now = new Date();
  assert.equal(await service.refreshWelcomeEmailStatuses(now), 1);
  assert.equal(f.row()?.status, "accepted");
  assert.equal(f.row()?.delivered_at, null);
  assert.equal(f.row()?.last_error, "email_status_http_403");
  assert.equal(await service.refreshWelcomeEmailStatuses(new Date(now.getTime() + 7 * HOUR)), 0);
  assert.equal(await service.refreshWelcomeEmailStatuses(new Date(now.getTime() + 25 * HOUR)), 1);
  assert.equal(f.requests.filter(request => request.init?.method === "POST").length, 1);
});

test("bounces and provider failures never count as delivered or cause automatic resends", async t => {
  const f = fixture(t);
  await service.enqueueWelcomeEmail(SITE, DELIVERY, "en");
  await service.processWelcomeDelivery(DELIVERY);
  f.setResponder(async () => Response.json({ id: "email_fixture", last_event: "bounced" }));
  await service.refreshWelcomeEmailStatuses(new Date());
  assert.equal(f.row()?.status, "bounced");
  assert.equal(f.row()?.delivered_at, null);
  await service.deliverDueWelcomeEmails(new Date(Date.now() + HOUR));
  assert.equal(f.requests.filter(request => request.init?.method === "POST").length, 1);
  assert.equal(service.welcomeStatusForProviderEvent("failed"), "needs_review");
  assert.equal(service.welcomeDeliveryLabel("accepted"), "Accepted by email provider");
});

test("migration marks old provisioned emails unknown without sending and leaves pending signup recoverable", async t => {
  const f = fixture(t, false);
  f.addSite("pending_site", "pending", false);
  f.welcomeMigration();
  assert.equal(f.row()?.status, "legacy_unknown");
  assert.equal(f.row()?.payload_json, null);
  assert.equal(f.row("welcome-pending_site"), undefined);
  assert.equal(await service.enqueueWelcomeEmail(SITE, DELIVERY, "en"), "recorded");
  await service.deliverWelcomeEmailForSite(SITE, DELIVERY, "en");
  assert.equal(f.requests.length, 0);
  const fresh = "manual-new-delivery";
  await service.enqueueWelcomeEmail(SITE, fresh, "en");
  await service.processWelcomeDelivery(fresh);
  assert.equal(f.row(fresh)?.status, "accepted");
  assert.equal(f.requests.length, 1);
});

test("provider acceptance without a message ID is preserved and never blindly resent", async t => {
  const f = fixture(t);
  await service.enqueueWelcomeEmail(SITE, DELIVERY, "en");
  f.setResponder(async () => Response.json({}));
  await service.processWelcomeDelivery(DELIVERY);
  assert.equal(f.row()?.status, "accepted");
  assert.equal(f.row()?.provider_message_id, null);
  assert.equal(f.row()?.last_error, "provider_message_id_unavailable");
  await service.processWelcomeDelivery(DELIVERY, new Date(Date.now() + 48 * HOUR));
  assert.equal(f.requests.length, 1);
});

test("cron recovers interruption after activation before outbox creation without touching legacy or demo accounts", async t => {
  const f = fixture(t, false);
  f.welcomeMigration();
  function addSubscription(siteId: string) {
    const now = Date.now();
    f.sqlite.prepare("INSERT INTO subscriptions(id,user_id,site_id,stripe_customer_id,stripe_subscription_id,plan,status,created_at,updated_at) VALUES (?,'fixture_user',?, ?,?,'monthly','active',?,?)")
      .run(`local_${siteId}`, siteId, `cus_${siteId}`, `sub_${siteId}`, now, now);
  }
  addSubscription(SITE);
  f.addSite("newly_activated");
  addSubscription("newly_activated");
  f.addSite("demo");
  addSubscription("demo");
  f.sqlite.prepare("UPDATE sites SET is_demo=1 WHERE id='demo'").run();
  f.addSite("canceled_account", "canceled");
  addSubscription("canceled_account");
  f.addSite("manually_recovered");
  addSubscription("manually_recovered");
  await service.enqueueWelcomeEmail("manually_recovered", "manual-recovery-delivery", "en");
  await service.processWelcomeDelivery("manual-recovery-delivery");
  assert.equal(f.row("manual-recovery-delivery")?.status, "accepted");
  assert.equal(await service.enqueueWelcomeEmail("manually_recovered", "welcome-manually_recovered", "en"), "sent");
  await service.deliverWelcomeEmailForSite("manually_recovered", "welcome-manually_recovered", "en");
  assert.equal(f.row("welcome-newly_activated"), undefined);
  await service.deliverDueWelcomeEmails(new Date(Date.now() + 1000));
  assert.equal(f.row("welcome-newly_activated")?.status, "accepted");
  assert.equal(f.row()?.status, "legacy_unknown");
  assert.equal(f.row("welcome-demo"), undefined);
  assert.equal(f.row("welcome-canceled_account"), undefined);
  assert.equal(f.row("welcome-manually_recovered"), undefined);
  assert.equal(f.requests.filter(request => request.init?.method === "POST").length, 2);
  await service.deliverDueWelcomeEmails(new Date(Date.now() + HOUR));
  assert.equal(f.requests.filter(request => request.init?.method === "POST").length, 2);
});

test("missing welcome recovery honors paid-through cancellations but excludes expired subscriptions", async t => {
  const f = fixture(t);
  const now = Date.now();
  for (const [siteId, periodEnd] of [["paid_through", now + HOUR], ["expired", now - 1]] as const) {
    f.addSite(siteId);
    f.sqlite.prepare("INSERT INTO subscriptions(id,user_id,site_id,stripe_customer_id,stripe_subscription_id,plan,status,current_period_end,created_at,updated_at) VALUES (?,'fixture_user',?,?,?,'monthly','canceled',?,?,?)")
      .run(`local_${siteId}`, siteId, `cus_${siteId}`, `sub_${siteId}`, periodEnd, now, now);
  }
  await service.deliverDueWelcomeEmails(new Date(now + 1000));
  assert.equal(f.row("welcome-paid_through")?.status, "accepted");
  assert.equal(f.row("welcome-expired"), undefined);
  assert.equal(f.requests.filter(request => request.init?.method === "POST").length, 1);
});
