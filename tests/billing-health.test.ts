import assert from "node:assert/strict";
import { after, test, type TestContext } from "node:test";
import { mkdtemp, mkdir, readFile, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import { build } from "esbuild";
import { accountBillingLabel } from "../lib/billing-health-policy.ts";

const root = fileURLToPath(new URL("../", import.meta.url));
const now = new Date("2026-10-30T16:00:00Z");
const old = now.getTime() - 60 * 60 * 1000;
await mkdir(join(root, "outputs"), { recursive: true });
const bundleDir = await mkdtemp(join(root, "outputs", "health-test-"));
after(() => rm(bundleDir, { recursive: true, force: true }));
const mocks: Record<string, string> = {
  "health-fixture": "let f; export const setFixture = v => {f=v}; export const fixture=()=>f;",
  "@/db": 'import {fixture} from "health-fixture"; export const getDb=async()=>fixture().db;',
  "@/lib/runtime": 'import {fixture} from "health-fixture"; export const runtimeValue=async name=>fixture().env[name]??"";',
  "@/lib/email": 'import {fixture} from "health-fixture"; export const sendTransactionalEmail=async input=>fixture().send(input);',
};
await build({
  stdin: { contents: 'export * from "./lib/billing-health.ts"; export {setFixture} from "health-fixture";', resolveDir: root },
  outfile: join(bundleDir, "health.mjs"), bundle: true, platform: "node", format: "esm", packages: "external", tsconfig: join(root, "tsconfig.json"),
  plugins: [{ name: "health-test-ports", setup(builder) {
    builder.onResolve({ filter: /^(health-fixture|@\/)/ }, args => mocks[args.path] ? { path: args.path, namespace: "health" } : undefined);
    builder.onLoad({ filter: /.*/, namespace: "health" }, args => ({ contents: mocks[args.path], loader: "js" }));
  } }],
});
const service: typeof import("../lib/billing-health.ts") & { setFixture(value: object): void } =
  await import(pathToFileURL(join(bundleDir, "health.mjs")).href);
const migrations = await Promise.all((await readdir(join(root, "drizzle"))).filter(name => /^\d+_.*\.sql$/.test(name)).sort()
  .map(name => readFile(join(root, "drizzle", name), "utf8")));

type Mail = { to: string; subject: string; html: string; text: string; idempotencyKey: string };
function fixture(t: TestContext) {
  const sqlite = new DatabaseSync(":memory:");
  t.after(() => sqlite.close());
  sqlite.exec("PRAGMA foreign_keys=ON");
  for (const migration of migrations) sqlite.exec(migration);
  sqlite.prepare("INSERT INTO users(id,email,name,phone,created_at,updated_at) VALUES('user','private@example.test','Private Customer','',?,?)").run(old,old);
  sqlite.prepare("INSERT INTO sites(id,user_id,slug,display_name,initials,public_email,public_phone,bio,referral_url,status,created_at,updated_at) VALUES('site','user','private-customer','Private Customer','PC','','','','https://example.test','active',?,?)").run(old,old);
  const db = drizzle(async (sql, params, method) => {
    const statement = sqlite.prepare(sql);
    if (method === "run") { statement.run(...params as SQLInputValue[]); return { rows: [] }; }
    statement.setReturnArrays(true);
    return { rows: (method === "get" ? statement.get(...params as SQLInputValue[]) ?? [] : statement.all(...params as SQLInputValue[])) as unknown[] };
  });
  const emails: Mail[] = [];
  const env: Record<string, string> = { APP_ENV: "production", BILLING_ALERT_EMAIL: "owner@example.test" };
  let failing = false;
  service.setFixture({ db, env, send: async (mail: Mail) => { emails.push(mail); if (failing) throw new Error("provider unavailable"); return { id: "mail1" }; } });
  const event = (id: string, status: string, createdAt = old, attempts = 1, eventType = "invoice.paid") =>
    sqlite.prepare("INSERT INTO stripe_events(id,event_type,status,payload_json,attempts,received_at) VALUES(?,?,?,'{}',?,?)").run(id,eventType,status,attempts,createdAt);
  const email = (id: string, status: string, createdAt = old) =>
    sqlite.prepare("INSERT INTO welcome_email_deliveries(id,site_id,status,created_at,updated_at) VALUES(?,'site',?,?,?)").run(id,status,createdAt,createdAt);
  return { sqlite, env, emails, event, email, fail: (value: boolean) => { failing = value; } };
}

test("a successfully handled card decline is not a system incident", async t => {
  const f=fixture(t);
  f.event("evt_decline","completed",old,1,"invoice.payment_failed");
  f.sqlite.prepare("UPDATE sites SET status='suspended'").run();
  assert.deepEqual((await service.getBillingHealth(now)).counts,{events:0,paidSites:0,emails:0});
  assert.equal(await service.sendBillingHealthAlert(now),"healthy");
  assert.equal(f.emails.length,0);
});

test("old stalled, failed and exhausted jobs need attention; fresh work does not", async t => {
  const f=fixture(t);
  f.event("stalled","processing"); f.event("failed","failed"); f.event("done","completed");
  f.event("fresh","pending",now.getTime()); f.event("exhausted","failed",now.getTime(),12);
  const health=await service.getBillingHealth(now);
  assert.equal(health.counts.events,3);
  assert.deepEqual(new Set(health.events.map(e=>e.id)),new Set(["stalled","failed","exhausted"]));
});

test("paid pending sites are distinct from abandoned unpaid checkouts and overrides", async t => {
  const f=fixture(t);
  f.sqlite.prepare("UPDATE sites SET status='pending',checkout_payment_status='unpaid'").run();
  assert.equal((await service.getBillingHealth(now)).counts.paidSites,0);
  f.sqlite.prepare("UPDATE sites SET checkout_payment_status='no_payment_required'").run();
  assert.equal((await service.getBillingHealth(now)).counts.paidSites,0,"an open free checkout is not a completed purchase");
  f.sqlite.prepare("UPDATE sites SET checkout_payment_status='paid'").run();
  assert.equal((await service.getBillingHealth(now)).counts.paidSites,1);
  f.sqlite.prepare("UPDATE sites SET checkout_completed_at=?").run(now.getTime());
  assert.equal((await service.getBillingHealth(now)).counts.paidSites,0,"a newly paid old reservation is not already delayed");
  f.sqlite.prepare("UPDATE sites SET checkout_completed_at=?,checkout_payment_status='no_payment_required'").run(old);
  assert.equal((await service.getBillingHealth(now)).counts.paidSites,1,"confirmed free checkouts also deserve recovery");
  f.sqlite.prepare("UPDATE sites SET deletion_scheduled_at=?").run(now.getTime()+86400000);
  assert.equal((await service.getBillingHealth(now)).counts.paidSites,0);
  f.sqlite.prepare("UPDATE sites SET deletion_scheduled_at=NULL").run();
  f.sqlite.prepare("UPDATE sites SET status='canceled',publication_override='canceled'").run();
  assert.equal((await service.getBillingHealth(now)).counts.paidSites,0);
});

test("email health distinguishes accepted, legacy unknown, and actual delivery problems", async t => {
  const f=fixture(t);
  for(const status of ["accepted","delivered","legacy_unknown","canceled"]) f.email(status,status);
  for(const status of ["needs_review","bounced","complained","failed","sending","pending"]) f.email(status,status);
  f.email("fresh","pending",now.getTime());
  assert.equal((await service.getBillingHealth(now)).counts.emails,6);
});

test("alerts are deduplicated daily and contain no customer data", async t => {
  const f=fixture(t); f.event("evt_private","failed");
  assert.equal(await service.sendBillingHealthAlert(now),"sent");
  assert.equal(await service.sendBillingHealthAlert(now),"already_sent");
  assert.equal(f.emails.length,1);
  assert.equal(f.emails[0].to,"owner@example.test");
  assert.match(f.emails[0].text,/https:\/\/admin\.cbp\.proneurs\.org\/admin\/billing/);
  assert.doesNotMatch(JSON.stringify(f.emails[0]),/Private Customer|private@example|evt_private/);
  assert.equal((await service.lastBillingHealthAlert())?.getTime(),now.getTime());
  assert.equal(await service.sendBillingHealthAlert(new Date(now.getTime()+86400000)),"sent");
  assert.notEqual(f.emails[0].idempotencyKey,f.emails[1].idempotencyKey);
});

test("provider failure does not falsely record an alert; retries use identical payload and key", async t => {
  const f=fixture(t); f.event("evt_problem","failed"); f.fail(true);
  await assert.rejects(service.sendBillingHealthAlert(now),/provider unavailable/);
  assert.equal(await service.lastBillingHealthAlert(),null);
  f.fail(false); f.event("evt_another","failed");
  assert.equal(await service.sendBillingHealthAlert(now),"sent");
  assert.deepEqual(f.emails[0],f.emails[1]);
});

test("unconfigured and invalid alert destinations do not send mail", async t => {
  const f=fixture(t); f.event("evt_problem","failed"); f.env.BILLING_ALERT_EMAIL="";
  assert.equal(await service.sendBillingHealthAlert(now),"disabled");
  f.env.BILLING_ALERT_EMAIL="owner@example.test,unexpected@example.test";
  await assert.rejects(service.sendBillingHealthAlert(now),/recipient is invalid/);
  assert.equal(f.emails.length,0);
});

test("health totals include all affected jobs while detail lists stay bounded", async t => {
  const f=fixture(t); for(let i=0;i<60;i++) f.event(`evt_${i}`,"failed");
  const health=await service.getBillingHealth(now);
  assert.equal(health.counts.events,60); assert.equal(health.events.length,50);
});

test("account labels do not equate a missing local subscription with failed payment", () => {
  assert.equal(accountBillingLabel({subscriptionStatus:null,checkoutPaymentStatus:"paid",siteStatus:"pending"}),"Paid — activation delayed");
  assert.equal(accountBillingLabel({subscriptionStatus:null,checkoutPaymentStatus:null,siteStatus:"pending"}),"Payment not confirmed");
  assert.equal(accountBillingLabel({subscriptionStatus:"past_due",checkoutPaymentStatus:"paid",siteStatus:"suspended"}),"past_due");
  assert.equal(accountBillingLabel({subscriptionStatus:null,checkoutPaymentStatus:"paid",siteStatus:"deleted"}),"Account deleted");
});
