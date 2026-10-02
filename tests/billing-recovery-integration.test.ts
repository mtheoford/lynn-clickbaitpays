import assert from "node:assert/strict";
import { after, test, type TestContext } from "node:test";
import { mkdtemp, mkdir, readFile, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import { build } from "esbuild";
import type Stripe from "stripe";

const root = fileURLToPath(new URL("../", import.meta.url));
const DAY = 24 * 60 * 60 * 1000;
type Email = { to: string; subject: string; html: string; text: string; idempotencyKey: string };
type Service = typeof import("../lib/billing-recovery.ts") & typeof import("../lib/stripe-events.ts") & {
  setFixture(value: object): void;
};

// Execute the production webhook/cron and Drizzle queries against the real
// migrations. Only external services and unrelated cron jobs are replaced.
await mkdir(join(root, "outputs"), { recursive: true });
const bundleDir = await mkdtemp(join(root, "outputs", "billing-test-"));
after(() => rm(bundleDir, { recursive: true, force: true }));
const mocks: Record<string, string> = {
  "billing-test-fixture": "let fixture; export const setFixture = value => { fixture = value; }; export const getFixture = () => fixture;",
  "@/db": 'import {getFixture} from "billing-test-fixture"; export const getDb = async () => getFixture().db;',
  "@/lib/stripe": 'import {getFixture} from "billing-test-fixture"; export const getStripe = async () => getFixture().stripe;',
  "@/lib/email": 'import {getFixture} from "billing-test-fixture"; export const sendTransactionalEmail = async value => getFixture().send(value); export const deliverDueCheckoutReminders = async () => 0; export const deliverCheckoutReminderForSite = async () => {}; export const deliverWelcomeEmailForSite = async () => {}; export const enqueueWelcomeEmail = async () => {};',
  "@/lib/runtime": 'export const getRuntimeEnv = async () => ({}); export const runtimeValue = async name => ({ NEXT_PUBLIC_MARKETING_URL: "https://cbp.proneurs.org", NEXT_PUBLIC_SUPPORT_EMAIL: "support@proneurs.org" })[name];',
  "@/lib/site-config": 'export const siteUrl = slug => `https://${slug}.cbp.proneurs.org`;',
  "@/lib/checkout-cleanup": "export const purgeExpiredCheckoutReservations = async () => 0;",
  "@/lib/signup-analytics-server": "export const recordSignupServerEvent = async () => {};",
};
await build({
  stdin: { contents: 'export * from "./lib/billing-recovery.ts"; export * from "./lib/stripe-events.ts"; export {setFixture} from "billing-test-fixture";', resolveDir: root },
  outfile: join(bundleDir, "service.mjs"), bundle: true, platform: "node", format: "esm", packages: "external",
  tsconfig: join(root, "tsconfig.json"),
  plugins: [{ name: "billing-test-ports", setup(builder) {
    builder.onResolve({ filter: /^(billing-test-fixture|@\/)/ }, args =>
      mocks[args.path] ? { path: args.path, namespace: "billing-test" } : undefined);
    builder.onLoad({ filter: /.*/, namespace: "billing-test" }, args => ({ contents: mocks[args.path], loader: "js" }));
  } }],
});
const service: Service = await import(pathToFileURL(join(bundleDir, "service.mjs")).href);
const migrations = await Promise.all((await readdir(join(root, "drizzle"))).filter(name => /^\d+_.*\.sql$/.test(name)).sort()
  .map(name => readFile(join(root, "drizzle", name), "utf8")));

function fixture(t: TestContext, graceEndsAt = new Date(Date.now() + 7 * DAY)) {
  const sqlite = new DatabaseSync(":memory:");
  t.after(() => sqlite.close());
  sqlite.exec("PRAGMA foreign_keys = ON");
  for (const migration of migrations) sqlite.exec(migration);
  const now = Date.now();
  sqlite.prepare("INSERT INTO users (id, email, name, phone, stripe_customer_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run("fixture_user", "subscriber@example.test", "Customer <Name>", "", "cus_fixture", now, now);
  function addSite(id: string, subscriptionId: string, status = "past_due") {
    sqlite.prepare("INSERT INTO sites (id, user_id, slug, display_name, initials, public_email, public_phone, bio, referral_url, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(id, "fixture_user", id, "Customer", "CN", "", "", "", "https://example.test/", status, now, now);
    sqlite.prepare("INSERT INTO subscriptions (id, user_id, site_id, stripe_customer_id, stripe_subscription_id, plan, status, grace_ends_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(`local_${subscriptionId}`, "fixture_user", id, "cus_fixture", subscriptionId, "monthly", status, status === "past_due" ? graceEndsAt.getTime() : null, now, now);
  }
  addSite("fixture_site", "sub_fixture");
  const db = drizzle(async (sql, params, method) => {
    const statement = sqlite.prepare(sql);
    if (method === "run") { statement.run(...params as SQLInputValue[]); return { rows: [] }; }
    statement.setReturnArrays(true);
    return { rows: (method === "get" ? statement.get(...params as SQLInputValue[]) ?? [] : statement.all(...params as SQLInputValue[])) as unknown[] };
  });
  const invoice = {
    id: "in_fixture", status: "open", amount_remaining: 900, customer: "cus_fixture",
    parent: { subscription_details: { subscription: "sub_fixture" } }, hosted_invoice_url: "https://invoice.stripe.com/fixture",
  } as unknown as Stripe.Invoice;
  const subscription = {
    id: "sub_fixture", status: "past_due", customer: "cus_fixture", latest_invoice: "in_fixture", metadata: { locale: "fr" },
    cancel_at_period_end: false, items: { data: [{ current_period_end: Math.floor(now / 1000) + 30 * 86400 }] },
  } as unknown as Stripe.Subscription;
  const emails: Email[] = [];
  const calls: string[] = [];
  let failDelivery = false;
  service.setFixture({ db, stripe: {
    invoices: { retrieve: async (id: string) => { calls.push(id); return invoice; } },
    subscriptions: { retrieve: async (id: string) => { calls.push(id); return subscription; } },
  }, send: async (email: Email) => { if (failDelivery) throw new Error("Temporary email outage"); emails.push(email); } });
  const recovery = () => sqlite.prepare("SELECT * FROM billing_recovery WHERE invoice_id = 'in_fixture'").get();
  return { sqlite, graceEndsAt, invoice, subscription, emails, calls, addSite, recovery, setFailDelivery: (value: boolean) => { failDelivery = value; } };
}

function failedEvent(invoice: Stripe.Invoice, id = "evt_failure"): Stripe.Event {
  return { id, type: "invoice.payment_failed", data: { object: invoice } } as Stripe.Event;
}

test("failure webhooks preserve the deadline and schedule one localized reminder and actual suspension notice", async t => {
  const f = fixture(t);
  await service.registerStripeEvent(failedEvent(f.invoice));
  await service.registerStripeEvent(failedEvent(f.invoice));
  await service.registerStripeEvent(failedEvent(f.invoice, "evt_retry_failure"));
  assert.equal(f.emails.length, 0, "Stripe owns initial failure emails");
  assert.equal(f.recovery()?.grace_ends_at, f.graceEndsAt.getTime());
  assert.equal(f.recovery()?.locale, "fr");
  assert.equal(await service.deliverDueBillingRecoveryNotices(new Date(f.graceEndsAt.getTime() - 2 * DAY)), 0);
  const reminderAt = new Date(f.graceEndsAt.getTime() - DAY);
  assert.equal(await service.deliverDueBillingRecoveryNotices(reminderAt), 1);
  assert.equal(await service.deliverDueBillingRecoveryNotices(reminderAt), 0);
  assert.equal(f.recovery()?.reminder_sent_at, reminderAt.getTime());
  assert.equal(f.emails[0].to, "subscriber@example.test");
  assert.match(f.emails[0].subject, /^Rappel/);
  assert.match(f.emails[0].html, /Customer &lt;Name&gt;/);
  assert.match(f.emails[0].text, /https:\/\/invoice.stripe.com\/fixture/);
  assert.match(f.emails[0].text, /https:\/\/cbp.proneurs.org\/fr\/manage/);
  await service.enforceScheduledBillingState(f.graceEndsAt);
  assert.equal(f.sqlite.prepare("SELECT status FROM sites WHERE id = 'fixture_site'").get()?.status, "suspended");
  assert.equal(f.emails.length, 2);
  assert.match(f.emails[1].subject, /temporairement suspendu/);
  assert.equal(f.recovery()?.suspension_sent_at, f.graceEndsAt.getTime());
  assert.equal(f.recovery()?.closed_at, f.graceEndsAt.getTime());
  await service.enforceScheduledBillingState(f.graceEndsAt);
  assert.equal(f.emails.length, 2);
});

test("paid or superseded invoices are checked with Stripe and never receive recovery notices", async t => {
  for (const change of ["paid", "superseded"] as const) {
    await t.test(change, async t => {
      const f = fixture(t);
      await service.startBillingRecovery(f.invoice, f.subscription);
      if (change === "paid") { f.invoice.status = "paid"; f.invoice.amount_remaining = 0; f.subscription.status = "active"; }
      else f.subscription.latest_invoice = "in_new_cycle";
      assert.equal(await service.deliverDueBillingRecoveryNotices(new Date(f.graceEndsAt.getTime() - DAY)), 0);
      assert.equal(f.emails.length, 0);
      assert.ok(f.calls.includes("in_fixture") && f.calls.includes("sub_fixture"));
      assert.ok(f.recovery()?.closed_at);
    });
  }
});

test("an email outage leaves the notice pending and the next cron delivery records success", async t => {
  const f = fixture(t);
  await service.startBillingRecovery(f.invoice, f.subscription);
  f.setFailDelivery(true);
  const reminderAt = new Date(f.graceEndsAt.getTime() - DAY);
  assert.equal(await service.deliverDueBillingRecoveryNotices(reminderAt), 0);
  assert.equal(f.recovery()?.reminder_sent_at, null);
  f.setFailDelivery(false);
  assert.equal(await service.deliverDueBillingRecoveryNotices(reminderAt), 1);
  assert.equal(f.emails[0].idempotencyKey, "billing-reminder-in_fixture");
  assert.equal(f.recovery()?.reminder_sent_at, reminderAt.getTime());
});

test("existing overdue accounts enter recovery through cron without restarting the seven-day grace period", async t => {
  const f = fixture(t);
  assert.equal(f.recovery(), undefined);
  await service.enforceScheduledBillingState(new Date(f.graceEndsAt.getTime() - DAY));
  assert.equal(f.recovery()?.grace_ends_at, f.graceEndsAt.getTime());
  assert.equal(f.emails.length, 1);
  await service.enforceScheduledBillingState(new Date(f.graceEndsAt.getTime() - DAY));
  assert.equal(f.emails.length, 1);
});

test("overdue subscription updates stay suspended; paying restores publication and clears the deadline", async t => {
  const f = fixture(t, new Date(Date.now() - DAY));
  await service.registerStripeEvent(failedEvent(f.invoice));
  const status = () => f.sqlite.prepare("SELECT status FROM sites WHERE id = 'fixture_site'").get()?.status;
  assert.equal(status(), "suspended");
  assert.equal(f.emails.length, 1);
  await service.registerStripeEvent({ id: "evt_updated", type: "customer.subscription.updated", data: { object: f.subscription } } as Stripe.Event);
  assert.equal(status(), "suspended");
  assert.equal(f.sqlite.prepare("SELECT grace_ends_at FROM subscriptions WHERE stripe_subscription_id = 'sub_fixture'").get()?.grace_ends_at, f.graceEndsAt.getTime());
  f.invoice.status = "paid"; f.invoice.amount_remaining = 0; f.subscription.status = "active";
  await service.registerStripeEvent({ id: "evt_paid", type: "invoice.paid", data: { object: f.invoice } } as Stripe.Event);
  assert.equal(status(), "active");
  assert.equal(f.sqlite.prepare("SELECT grace_ends_at FROM subscriptions WHERE stripe_subscription_id = 'sub_fixture'").get()?.grace_ends_at, null);
  await service.enforceScheduledBillingState(new Date(Date.now() + DAY));
  assert.equal(f.emails.length, 1);
});

test("administrator overrides suppress automated notices and survive payment recovery", async t => {
  const f = fixture(t);
  f.sqlite.prepare("UPDATE sites SET publication_override = 'suspended', status = 'suspended' WHERE id = 'fixture_site'").run();
  await service.registerStripeEvent(failedEvent(f.invoice));
  await service.enforceScheduledBillingState(f.graceEndsAt);
  assert.equal(f.emails.length, 0);
  f.invoice.status = "paid"; f.subscription.status = "active";
  await service.registerStripeEvent({ id: "evt_paid", type: "invoice.paid", data: { object: f.invoice } } as Stripe.Event);
  assert.equal(f.sqlite.prepare("SELECT status FROM sites WHERE id = 'fixture_site'").get()?.status, "suspended");
});

test("one invoice affects only its subscription, and deleting its site cascades recovery records", async t => {
  const f = fixture(t);
  f.addSite("other_site", "sub_other", "active");
  await service.registerStripeEvent(failedEvent(f.invoice));
  assert.deepEqual({ ...f.sqlite.prepare("SELECT status, grace_ends_at FROM subscriptions WHERE stripe_subscription_id = 'sub_other'").get() }, { status: "active", grace_ends_at: null });
  assert.ok(!f.calls.includes("sub_other"));
  f.sqlite.prepare("DELETE FROM sites WHERE id = 'fixture_site'").run();
  assert.equal(f.recovery(), undefined);
});
