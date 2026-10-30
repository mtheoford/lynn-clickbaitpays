import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import {
  deploymentEnvironment, expectedSchema, REQUIRED_SECRETS,
  runDeployment, schemaProbe, verifySchemaResult,
} from "../scripts/deploy-worker.mjs";

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "cbp-deployment-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "drizzle"));
  writeFileSync(join(root, "drizzle", "0000_accounts.sql"), "CREATE TABLE sites (id TEXT PRIMARY KEY, status TEXT NOT NULL); CREATE INDEX sites_status ON sites(status);");
  writeFileSync(join(root, "drizzle", "0001_recovery.sql"), "ALTER TABLE sites ADD COLUMN checked_at INTEGER; CREATE TABLE recovery (id TEXT PRIMARY KEY, site_id TEXT REFERENCES sites(id));");
  const schema = expectedSchema(root);
  const validProbe = () => [
    { success: true, results: schema.migrations.map(name => ({ name })) },
    ...schema.tables.map(() => ({ success: true, results: [] })),
    { success: true, results: schema.indexes },
  ];
  const calls = [];
  let modify = () => undefined;
  const runner = (command, args, options) => {
    const call = { command, args, ...options };
    calls.push(call);
    const changed = modify(call);
    if (changed) return changed;
    return {
      status: 0,
      stdout: args.includes("secret") ? JSON.stringify(REQUIRED_SECRETS.map(name => ({ name }))) :
        args.includes("execute") ? JSON.stringify(validProbe()) : "",
    };
  };
  return { root, schema, validProbe, calls, runner, modify: callback => { modify = callback; },
    options: { root, runner, log: () => {}, env: { BASE_URL: "https://wrong.example", NEXT_PUBLIC_SITE_URL: "https://wrong.example", CLOUDFLARE_API_TOKEN: "fixture-token" } } };
}

test("release validates, migrates, verifies the actual schema, deploys, then smoke-tests in order", t => {
  const f = fixture(t);
  runDeployment("release", "production", f.options);
  assert.deepEqual(f.calls.map(call => call.args.slice(0, 4)), [
    ["run", "verify:release"],
    ["--no-install", "wrangler", "secret", "list"],
    ["--no-install", "wrangler", "d1", "migrations"],
    ["--no-install", "wrangler", "d1", "execute"],
    ["--no-install", "opennextjs-cloudflare", "deploy", "--"],
    ["run", "test:e2e:smoke"],
  ]);
  for (const call of f.calls) {
    assert.equal(call.env.NEXT_PUBLIC_SITE_URL, "https://cbp.proneurs.org");
    assert.equal(call.env.NEXT_PUBLIC_PRIMARY_DOMAIN, "cbp.proneurs.org");
  }
  assert.equal(f.calls[0].env.BASE_URL, undefined, "full tests must use local mocked checkout");
  assert.equal(f.calls[0].env.CLOUDFLARE_API_TOKEN, undefined, "validation does not inherit deployment write credentials");
  assert.equal(f.calls[1].env.CLOUDFLARE_API_TOKEN, "fixture-token");
  assert.equal(f.calls.at(-1).env.BASE_URL, "https://cbp.proneurs.org");
  assert.equal(f.calls.at(-1).env.CLOUDFLARE_API_TOKEN, undefined);
  assert.ok(f.calls[4].args.includes("--keep-vars"));
  assert.ok(f.calls[2].args.includes("--remote"));
});

test("staging gets staging build and smoke URLs, preserving the shared tenant base", t => {
  const f = fixture(t);
  runDeployment("release", "staging", f.options);
  const target = "proneurs-personal-cbp-sites-staging.mtheoford.workers.dev";
  assert.equal(f.calls[0].env.NEXT_PUBLIC_SITE_URL, `https://${target}`);
  assert.equal(f.calls[0].env.NEXT_PUBLIC_MARKETING_URL, `https://${target}`);
  assert.equal(f.calls[0].env.NEXT_PUBLIC_PRIMARY_DOMAIN, target);
  assert.equal(f.calls[0].env.NEXT_PUBLIC_TENANT_BASE_DOMAIN, "cbp.proneurs.org");
  assert.equal(f.calls.at(-1).env.BASE_URL, `https://${target}`);
});

test("invalid environment/action and broken local migrations stop before any remote command", t => {
  const f = fixture(t);
  assert.throws(() => runDeployment("release", "prod;deploy", f.options), /staging or production/);
  assert.throws(() => runDeployment("deploy-without-checks", "production", f.options), /Choose one action/);
  writeFileSync(join(f.root, "drizzle", "0002_broken.sql"), "ALTER TABLE missing_table ADD COLUMN bad TEXT;");
  assert.throws(() => runDeployment("release", "production", f.options), /invalid at 0002_broken/);
  assert.equal(f.calls.length, 0);
});

test("a failed release check prevents migration and deployment", t => {
  const f = fixture(t);
  f.modify(call => call.args.includes("verify:release") ? { status: 1 } : undefined);
  assert.throws(() => runDeployment("release", "production", f.options), /Validate production release failed/);
  assert.equal(f.calls.length, 1);
});

test("missing or unreadable required-secret configuration stops before migration", async t => {
  for (const stdout of ["not-json", JSON.stringify([{ name: "STRIPE_SECRET_KEY" }])]) {
    await t.test(stdout === "not-json" ? "unreadable" : "missing", t => {
      const f = fixture(t);
      f.modify(call => call.args.includes("secret") ? { status: 0, stdout } : undefined);
      assert.throws(() => runDeployment("release", "production", f.options), /unreadable JSON|Missing required Worker secrets/);
      assert.equal(f.calls.length, 2);
    });
  }
});

test("migration failure and schema-query failure both prevent Worker deployment", async t => {
  for (const failingCommand of ["migrations", "execute"]) {
    await t.test(failingCommand, t => {
      const f = fixture(t);
      f.modify(call => call.args.includes(failingCommand) ? { status: 1 } : undefined);
      assert.throws(() => runDeployment("release", "production", f.options), /failed/);
      assert.ok(!f.calls.some(call => call.args.includes("opennextjs-cloudflare")));
    });
  }
});

test("a successful CLI exit cannot hide a missing migration, failed probe, or missing index", async t => {
  const changes = {
    "missing ledger entry": result => { result[0].results.pop(); },
    "failed probe": result => { result[1].success = false; },
    "missing probe": result => { result.splice(1, 1); },
    "missing index": result => { result.at(-1).results = []; },
  };
  for (const [name, change] of Object.entries(changes)) {
    await t.test(name, t => {
      const f = fixture(t);
      f.modify(call => {
        if (!call.args.includes("execute")) return;
        const result = f.validProbe(); change(result);
        return { status: 0, stdout: JSON.stringify(result) };
      });
      assert.throws(() => runDeployment("release", "production", f.options), /schema verification|migrations are missing|indexes are missing/);
      assert.ok(!f.calls.some(call => call.args.includes("opennextjs-cloudflare")));
    });
  }
});

test("schema inspection is read-only and migrate-schema never deploys a Worker", t => {
  const f = fixture(t);
  runDeployment("schema", "production", f.options);
  assert.equal(f.calls.length, 1);
  assert.ok(f.calls[0].args.includes("execute"));
  f.calls.length = 0;
  runDeployment("migrate-schema", "staging", f.options);
  assert.equal(f.calls.length, 3);
  assert.ok(!f.calls.some(call => call.args.includes("opennextjs-cloudflare")));
});

test("verify stage runs the complete checks without accessing Cloudflare", t => {
  const f = fixture(t);
  runDeployment("verify", "staging", f.options);
  assert.equal(f.calls.length, 1);
  assert.deepEqual(f.calls[0].args, ["run", "verify:release"]);
});

test("a post-deployment smoke failure is reported without an automatic destructive rollback", t => {
  const f = fixture(t);
  f.modify(call => call.args.includes("test:e2e:smoke") ? { status: 1 } : undefined);
  assert.throws(() => runDeployment("release", "production", f.options), /purchase entry points failed/);
  assert.equal(f.calls.length, 6);
  assert.ok(f.calls[4].args.includes("deploy"));
});

test("schema probe fails for a missing real column rather than accepting a quoted literal", t => {
  const f = fixture(t);
  const sqlite = new DatabaseSync(":memory:");
  t.after(() => sqlite.close());
  sqlite.exec("CREATE TABLE d1_migrations(name TEXT); CREATE TABLE sites(id TEXT, status TEXT); CREATE TABLE recovery(id TEXT, site_id TEXT);");
  assert.throws(() => sqlite.exec(schemaProbe(f.schema)), /no such column.*checked_at/);
});

test("the repository migration chain automatically defines the production schema contract", () => {
  const schema = expectedSchema();
  assert.ok(schema.migrations.includes("0008_billing_recovery.sql"));
  assert.ok(schema.tables.find(table => table.name === "billing_recovery")?.columns.includes("closed_at"));
  assert.ok(schema.indexes.some(index => index.name === "idx_billing_recovery_open"));
  const valid = [{ success: true, results: schema.migrations.map(name => ({ name })) },
    ...schema.tables.map(() => ({ success: true, results: [] })), { success: true, results: schema.indexes }];
  assert.doesNotThrow(() => verifySchemaResult(JSON.stringify(valid), schema));
});

test("both supported npm deploy commands and the protected workflow use the common release gate", () => {
  const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(packageJson.scripts["deploy:production"], "node scripts/deploy-worker.mjs release production");
  assert.equal(packageJson.scripts["deploy:staging"], "node scripts/deploy-worker.mjs release staging");
  const workflow = readFileSync(new URL("../.github/workflows/deploy.yml", import.meta.url), "utf8");
  assert.match(workflow, /node scripts\/deploy-worker\.mjs release "\$DEPLOY_ENV"/);
  assert.match(workflow, /environment: \$\{\{/);
  assert.doesNotMatch(workflow, /run: npx opennextjs-cloudflare deploy/);
});

test("deployment environment validates names and never mutates the caller's environment", () => {
  const inherited = { BASE_URL: "https://example.test", CUSTOM_SETTING: "keep" };
  const result = deploymentEnvironment("production", inherited);
  assert.equal(result.CUSTOM_SETTING, "keep");
  assert.equal(result.BASE_URL, undefined);
  assert.equal(inherited.BASE_URL, "https://example.test");
  assert.throws(() => deploymentEnvironment("__proto__"), /Choose exactly/);
});
