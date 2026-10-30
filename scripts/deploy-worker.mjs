import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const npx = process.platform === "win32" ? "npx.cmd" : "npx";

export const REQUIRED_SECRETS = [
  "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "STRIPE_PRICE_MONTHLY",
  "STRIPE_PRICE_ANNUAL", "RESEND_API_KEY", "ADMIN_EMAILS", "CF_ACCESS_AUD",
  "CF_ACCESS_TEAM_DOMAIN",
];

const targets = {
  staging: {
    url: "https://proneurs-personal-cbp-sites-staging.mtheoford.workers.dev",
    host: "proneurs-personal-cbp-sites-staging.mtheoford.workers.dev",
  },
  production: { url: "https://cbp.proneurs.org", host: "cbp.proneurs.org" },
};

export function deploymentEnvironment(environment, inherited = process.env) {
  if (!Object.hasOwn(targets, environment)) {
    throw new Error("Choose exactly staging or production.");
  }
  const target = targets[environment];
  const env = {
    ...inherited,
    NEXT_PUBLIC_SITE_URL: target.url,
    NEXT_PUBLIC_MARKETING_URL: target.url,
    NEXT_PUBLIC_TENANT_BASE_DOMAIN: "cbp.proneurs.org",
    NEXT_PUBLIC_PRIMARY_DOMAIN: target.host,
  };
  // A caller's live BASE_URL must not turn the full pre-release browser suite
  // into smoke-only checks. Only the final smoke step receives an external URL.
  delete env.BASE_URL;
  return env;
}

function identifier(value) {
  return `"${value.replaceAll('"', '""')}"`;
}

export function expectedSchema(root = projectRoot) {
  const migrationDirectory = join(root, "drizzle");
  const migrations = readdirSync(migrationDirectory)
    .filter(name => /^\d+_[A-Za-z0-9_-]+\.sql$/.test(name)).sort();
  if (!migrations.length) throw new Error("No deployable SQL migrations were found.");
  const sqlite = new DatabaseSync(":memory:");
  try {
    for (const migration of migrations) {
      try {
        sqlite.exec(readFileSync(join(migrationDirectory, migration), "utf8"));
      } catch {
        throw new Error(`The local migration chain is invalid at ${migration}.`);
      }
    }
    const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all()
      .map(({ name }) => ({
        name,
        columns: sqlite.prepare(`PRAGMA table_info(${identifier(name)})`).all().map(column => column.name),
      }));
    const indexes = sqlite.prepare("SELECT name, tbl_name FROM sqlite_master WHERE type = 'index' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
    if (!tables.length) throw new Error("The local migration chain creates no application tables.");
    return { migrations, tables, indexes };
  } finally {
    sqlite.close();
  }
}

export function schemaProbe(schema) {
  return [
    "SELECT name FROM d1_migrations ORDER BY name;",
    ...schema.tables.map(table =>
      // Qualify each name: SQLite can otherwise interpret an unknown quoted
      // column as a string literal and incorrectly pass a missing-column check.
      `SELECT ${table.columns.map(column => `t.${identifier(column)}`).join(", ")} FROM ${identifier(table.name)} AS t LIMIT 0;`),
    "SELECT name, tbl_name FROM sqlite_master WHERE type = 'index' AND name NOT LIKE 'sqlite_%' ORDER BY name;",
  ].join("\n");
}

function jsonOutput(output, description) {
  try { return JSON.parse(output); }
  catch { throw new Error(`${description} returned unreadable JSON; deployment stopped.`); }
}

export function verifySchemaResult(output, schema) {
  const results = jsonOutput(output, "Database schema verification");
  if (!Array.isArray(results) || results.length !== schema.tables.length + 2 ||
      results.some(result => result.success !== true || !Array.isArray(result.results))) {
    throw new Error("Database schema verification did not confirm every probe; deployment stopped.");
  }
  const applied = new Set(results[0].results.map(row => row.name));
  const missingMigrations = schema.migrations.filter(name => !applied.has(name));
  if (missingMigrations.length) {
    throw new Error(`Database migrations are missing: ${missingMigrations.join(", ")}.`);
  }
  const actualIndexes = new Set(results.at(-1).results.map(row => `${row.tbl_name}:${row.name}`));
  const missingIndexes = schema.indexes.filter(index => !actualIndexes.has(`${index.tbl_name}:${index.name}`));
  if (missingIndexes.length) {
    throw new Error(`Database indexes are missing: ${missingIndexes.map(index => index.name).join(", ")}.`);
  }
}

function defaultRunner(command, args, options) {
  return spawnSync(command, args, {
    cwd: options.cwd,
    env: options.env,
    stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
}

/** Every supported deployment runs validation and the same database gate. */
export function runDeployment(action, environment, options = {}) {
  const supported = ["release", "verify", "migrate-schema", "schema"];
  if (!supported.includes(action)) throw new Error(`Choose one action: ${supported.join(", ")}.`);
  const env = deploymentEnvironment(environment, options.env);
  const root = options.root ?? projectRoot;
  const runner = options.runner ?? defaultRunner;
  const log = options.log ?? console.log;
  const schema = expectedSchema(root);
  const wranglerArguments = ["--config", "wrangler.jsonc", "--env", environment];
  const validationEnv = { ...env };
  // Build/tests and public smoke checks do not need Cloudflare write access.
  // Keep the workflow's deployment credentials confined to operational steps.
  for (const name of ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_API_KEY", "CLOUDFLARE_EMAIL",
    "CF_API_TOKEN", "CF_API_KEY", "CF_EMAIL"]) delete validationEnv[name];

  function run(label, command, args, capture = false, commandEnv = env) {
    log(label);
    const result = runner(command, args, { cwd: root, env: commandEnv, capture });
    if (result.error || result.status !== 0) {
      // Captured output is deliberately not printed: the required-secret check
      // needs names only, and failures must never dump credentials or payloads.
      throw new Error(`${label} failed${Number.isInteger(result.status) ? ` (exit ${result.status})` : ""}. No subsequent release steps were run.`);
    }
    return result.stdout ?? "";
  }

  if (action === "release" || action === "verify") {
    run(`Validate ${environment} release`, npm, ["run", "verify:release"], false, validationEnv);
    if (action === "verify") return;
  }

  if (action !== "schema") {
    const secrets = jsonOutput(run("Verify required Worker secret names", npx,
      ["--no-install", "wrangler", "secret", "list", ...wranglerArguments], true), "Worker secret-name lookup");
    if (!Array.isArray(secrets)) throw new Error("Worker secret-name lookup returned an unexpected result.");
    const configured = new Set(secrets.map(secret => secret.name));
    const missingSecrets = REQUIRED_SECRETS.filter(name => !configured.has(name));
    if (missingSecrets.length) throw new Error(`Missing required Worker secrets: ${missingSecrets.join(", ")}.`);
    run("Apply forward-only D1 migrations", npx,
      ["--no-install", "wrangler", "d1", "migrations", "apply", "DB", ...wranglerArguments, "--remote"]);
  }

  const output = run("Verify remote migration ledger, tables, columns, and indexes", npx,
    ["--no-install", "wrangler", "d1", "execute", "DB", ...wranglerArguments, "--remote", "--json", "--command", schemaProbe(schema)], true);
  verifySchemaResult(output, schema);
  log(`Database schema verified for ${environment} (${schema.migrations.length} migrations).`);
  if (action !== "release") return;

  run(`Deploy verified ${environment} Worker`, npx,
    ["--no-install", "opennextjs-cloudflare", "deploy", "--", "--env", environment, "--keep-vars"]);
  run(`Check deployed ${environment} purchase entry points`, npm,
    ["run", "test:e2e:smoke"], false, { ...validationEnv, BASE_URL: targets[environment].url });
  log(`${environment} release and smoke checks completed.`);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const [action, environment, ...extra] = process.argv.slice(2);
  if (action === "--help" && !environment) {
    console.log("Usage: node scripts/deploy-worker.mjs <release|verify|migrate-schema|schema> <staging|production>");
  } else {
    try {
      if (extra.length) throw new Error("Unexpected release arguments.");
      runDeployment(action, environment);
    } catch (error) {
      console.error(error instanceof Error ? error.message : "Release failed.");
      process.exitCode = 1;
    }
  }
}
