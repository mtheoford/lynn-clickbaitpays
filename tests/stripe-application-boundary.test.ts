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
await mkdir(join(root, "outputs"), { recursive: true });
const bundleDir = await mkdtemp(join(root, "outputs", "stripe-boundary-test-"));
after(() => rm(bundleDir, { recursive: true, force: true }));
const mocks: Record<string, string> = {
  "billing-test-fixture": "let fixture; export const setFixture=value=>{fixture=value};export const getFixture=()=>fixture;",
  "@/db": 'import {getFixture} from "billing-test-fixture"; export const getDb=async()=>getFixture().db;',
  "@/lib/stripe": 'import {getFixture} from "billing-test-fixture"; export const getStripe=async()=>getFixture().stripe;',
  "@/lib/email": 'import {getFixture} from "billing-test-fixture";export const deliverDueCheckoutReminders=async()=>0;export const deliverCheckoutReminderForSite=async()=>{};export const deliverWelcomeEmailForSite=async()=>{};export const enqueueWelcomeEmail=async(...args)=>getFixture().welcomes.push(args);',
  "@/lib/runtime": "export const getRuntimeEnv=async()=>({});",
  "@/lib/checkout-cleanup": "export const purgeExpiredCheckoutReservations=async()=>0;",
  "@/lib/signup-analytics-server": 'import {getFixture} from "billing-test-fixture";export const recordSignupServerEvent=async value=>getFixture().analytics.push(value);',
  "@/lib/billing-recovery": 'import {getFixture} from "billing-test-fixture";export const startBillingRecovery=async(...args)=>getFixture().recovery.push(args);export const closeBillingRecovery=async id=>getFixture().closed.push(id);export const deliverDueBillingRecoveryNotices=async()=>0;export const seedMissingBillingRecovery=async()=>0;',
};
await build({
  stdin: { contents: 'export * from "./lib/stripe-events.ts";export {setFixture} from "billing-test-fixture";', resolveDir: root },
  outfile: join(bundleDir, "service.mjs"), bundle: true, platform: "node", format: "esm", packages: "external",
  tsconfig: join(root, "tsconfig.json"),
  plugins: [{ name: "stripe-boundary-ports", setup(builder) {
    builder.onResolve({ filter: /^(billing-test-fixture|@\/)/ }, args => mocks[args.path] ? { path: args.path, namespace: "boundary-test" } : undefined);
    builder.onLoad({ filter: /.*/, namespace: "boundary-test" }, args => ({ contents: mocks[args.path], loader: "js" }));
  } }],
});
const service = await import(pathToFileURL(join(bundleDir, "service.mjs")).href) as typeof import("../lib/stripe-events.ts") & { setFixture(value: object): void };
// Canonical migration names exclude local filesystem conflict copies (" 2").
const migrations = await Promise.all((await readdir(join(root, "drizzle"))).filter(name => /^\d+_[a-z0-9_]+\.sql$/.test(name)).sort().map(name => readFile(join(root, "drizzle", name), "utf8")));

function fixture(t: TestContext) {
  const sqlite = new DatabaseSync(":memory:"); t.after(() => sqlite.close());
  sqlite.exec("PRAGMA foreign_keys=ON"); for (const migration of migrations) sqlite.exec(migration);
  const now = Date.now();
  sqlite.prepare("INSERT INTO users(id,email,name,phone,stripe_customer_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?)").run("user_cbp","customer@example.test","Customer","","cus_shared",now,now);
  sqlite.prepare("INSERT INTO sites(id,user_id,slug,display_name,initials,public_email,public_phone,bio,referral_url,status,stripe_checkout_session_id,reservation_expires_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run("site_cbp","user_cbp","fixture","Customer","CC","","","","https://example.test/","pending","cs_cbp",now+86400000,now,now);
  sqlite.prepare("INSERT INTO subscriptions(id,user_id,site_id,stripe_customer_id,stripe_subscription_id,plan,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)").run("local_cbp","user_cbp","site_cbp","cus_shared","sub_cbp","monthly","past_due",now,now);
  const db = drizzle(async (query, params, method) => {
    const statement = sqlite.prepare(query);
    if (method === "run") { statement.run(...params as SQLInputValue[]); return { rows: [] }; }
    statement.setReturnArrays(true);
    return { rows: (method === "get" ? statement.get(...params as SQLInputValue[]) ?? [] : statement.all(...params as SQLInputValue[])) as unknown[] };
  });
  const subscription = { id:"sub_cbp",status:"active",customer:"cus_shared",metadata:{locale:"en"},cancel_at_period_end:false,items:{data:[{current_period_end:Math.floor(now/1000)+30*86400}]}} as unknown as Stripe.Subscription;
  const calls: string[] = []; const welcomes: unknown[] = []; const analytics: unknown[] = []; const recovery: unknown[] = []; const closed: string[] = [];
  service.setFixture({db,stripe:{subscriptions:{retrieve:async(id:string)=>{calls.push(id);return subscription;}}},welcomes,analytics,recovery,closed});
  const site = () => sqlite.prepare("SELECT * FROM sites WHERE id='site_cbp'").get();
  return {sqlite,subscription,calls,welcomes,analytics,recovery,closed,site};
}
function event(type: string, object: object, id = `evt_${crypto.randomUUID()}`): Stripe.Event { return {id,type,data:{object}} as Stripe.Event; }
function checkout(metadata: object = {siteId:"site_cbp",userId:"user_cbp",plan:"monthly"}) { return {id:"cs_cbp",metadata,customer:"cus_shared",subscription:"sub_cbp",payment_status:"paid",status:"complete",mode:"subscription"}; }

test("explicit Shift Checkout events are acknowledged without CBP provisioning or analytics", async t => {
  const f = fixture(t); const before = {...f.site()};
  for (const type of ["checkout.session.completed","checkout.session.expired","checkout.session.async_payment_succeeded"]) {
    assert.deepEqual(await service.registerStripeEvent(event(type, checkout({app:"shift-funnel",siteId:"site_cbp",userId:"user_cbp"}))), {duplicate:false,queued:false,ignored:true});
  }
  assert.deepEqual({...f.site()},before);assert.equal(f.calls.length,0);assert.equal(f.welcomes.length,0);assert.equal(f.analytics.length,0);
  assert.equal(f.sqlite.prepare("SELECT COUNT(*) AS n FROM stripe_events").get()?.n,0);
});

test("Shift invoices and subscriptions cannot reconcile or mutate the shared customer's CBP records", async t => {
  const f = fixture(t);const before={...f.site()};
  for (const type of ["invoice.paid","invoice.payment_failed"]) for (const marker of [
    {metadata:{app:"shift-funnel"}},
    {parent:{subscription_details:{metadata:{app:"shift-funnel"},subscription:"sub_cbp"}}},
    {subscription_details:{metadata:{app:"shift-funnel"}},subscription:"sub_cbp"},
  ]) assert.equal((await service.registerStripeEvent(event(type,{id:"in_shift",customer:"cus_shared",...marker}))).ignored,true);
  for (const type of ["customer.subscription.updated","customer.subscription.deleted"]) assert.equal((await service.registerStripeEvent(event(type,{...f.subscription,metadata:{app:"shift-funnel"}}))).ignored,true);
  assert.deepEqual({...f.site()},before);assert.equal(f.calls.length,0);assert.equal(f.recovery.length,0);assert.equal(f.closed.length,0);
});

test("unmarked events with a fetched Shift subscription leave CBP state and recovery unchanged", async t => {
  const f=fixture(t);const before={...f.site()};f.subscription.metadata={app:"shift-funnel"};
  await service.registerStripeEvent(event("invoice.payment_failed",{id:"in_shift",customer:"cus_shared",parent:{subscription_details:{subscription:"sub_cbp"}}}));
  await service.registerStripeEvent(event("invoice.paid",{id:"in_shift_paid",customer:"cus_shared",parent:{subscription_details:{subscription:"sub_cbp"}}}));
  await service.registerStripeEvent(event("customer.subscription.updated",{id:"sub_cbp",metadata:{}}));
  await service.registerStripeEvent(event("checkout.session.completed",checkout()));
  assert.deepEqual({...f.site()},before);assert.equal(f.welcomes.length,0);assert.equal(f.recovery.length,0);assert.equal(f.closed.length,0);
});

test("legacy CBP Checkout still provisions a matching reservation and duplicate delivery stays idempotent", async t => {
  const f=fixture(t);const completed=event("checkout.session.completed",checkout());
  assert.deepEqual(await service.registerStripeEvent(completed),{duplicate:false,queued:false});
  assert.equal(f.site()?.status,"active");assert.equal(f.site()?.reservation_expires_at,null);
  assert.equal(f.sqlite.prepare("SELECT status FROM subscriptions WHERE id='local_cbp'").get()?.status,"active");
  assert.equal(f.welcomes.length,1);assert.deepEqual(await service.registerStripeEvent(completed),{duplicate:true,queued:false});assert.equal(f.welcomes.length,1);
});

test("missing, unknown or mismatched CBP metadata still fails the existing validation", async t => {
  const f=fixture(t);
  await assert.rejects(service.registerStripeEvent(event("checkout.session.completed",checkout({}))),/missing provisioning metadata/);
  await assert.rejects(service.registerStripeEvent(event("checkout.session.completed",checkout({app:"another-app"}))),/missing provisioning metadata/);
  await assert.rejects(service.registerStripeEvent(event("checkout.session.completed",{...checkout(),id:"cs_old_reservation"})),/does not match the current site reservation/);
  assert.equal(f.site()?.status,"pending");assert.equal(f.welcomes.length,0);
});

test("legacy CBP invoice reconciliation and exact subscription updates still work", async t => {
  const f=fixture(t);
  await service.registerStripeEvent(event("invoice.paid",{id:"in_cbp",customer:"cus_shared"}));
  assert.deepEqual(f.calls,["sub_cbp"]);assert.equal(f.site()?.status,"active");assert.deepEqual(f.closed,["in_cbp"]);
  f.subscription.status="canceled";f.subscription.items.data[0].current_period_end=Math.floor(Date.now()/1000)-1;
  await service.registerStripeEvent(event("customer.subscription.deleted",f.subscription));
  assert.equal(f.site()?.status,"canceled");
});

test("already queued Shift events complete successfully without running CBP side effects", async t => {
  const f=fixture(t);const queued=event("checkout.session.completed",checkout({app:"shift-funnel"}),"evt_preexisting_shift");
  f.sqlite.prepare("INSERT INTO stripe_events(id,event_type,status,payload_json,attempts,received_at) VALUES(?,?,'pending',?,0,?)").run(queued.id,queued.type,JSON.stringify(queued),Date.now());
  await service.processStripeEvent(queued.id);
  assert.equal(f.sqlite.prepare("SELECT status FROM stripe_events WHERE id=?").get(queued.id)?.status,"completed");assert.equal(f.calls.length,0);assert.equal(f.welcomes.length,0);assert.equal(f.site()?.status,"pending");
});
