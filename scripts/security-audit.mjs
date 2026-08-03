import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const allowlistPath = new URL(
  "../.github/security-audit-allowlist.json",
  import.meta.url,
);
const allowlist = JSON.parse(readFileSync(allowlistPath, "utf8"));
const exceptions = Object.fromEntries(
  Object.entries(allowlist.exceptions ?? {}).map(([id, exception]) => [
    id.toUpperCase(),
    exception,
  ]),
);
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const result = spawnSync(npmCommand, ["audit", "--json"], {
  encoding: "utf8",
  maxBuffer: 20 * 1024 * 1024,
});

if (!result.stdout.trim()) {
  console.error("Security audit failed: npm did not return an audit report.");
  if (result.stderr) console.error(result.stderr.trim());
  process.exit(1);
}

let report;
try {
  report = JSON.parse(result.stdout);
} catch {
  console.error("Security audit failed: npm returned an unreadable audit report.");
  process.exit(1);
}

if (report.error) {
  console.error(`Security audit failed: ${report.error.summary ?? report.error.code}`);
  process.exit(1);
}

const vulnerabilities = report.vulnerabilities ?? {};
const advisoryDetails = new Map();

function advisoryId(value) {
  const match = value?.url?.match(/GHSA-[0-9a-z-]+/i);
  return match?.[0]?.toUpperCase() ?? null;
}

for (const vulnerability of Object.values(vulnerabilities)) {
  for (const via of vulnerability.via ?? []) {
    if (typeof via === "string") continue;
    const id = advisoryId(via);
    if (id) advisoryDetails.set(id, via);
  }
}

function rootAdvisories(packageName, visited = new Set()) {
  if (visited.has(packageName)) return new Set();
  visited.add(packageName);
  const vulnerability = vulnerabilities[packageName];
  const roots = new Set();
  for (const via of vulnerability?.via ?? []) {
    if (typeof via === "string") {
      for (const id of rootAdvisories(via, new Set(visited))) roots.add(id);
    } else {
      const id = advisoryId(via);
      if (id) roots.add(id);
    }
  }
  return roots;
}

const failures = [];
const criticalCount = report.metadata?.vulnerabilities?.critical ?? 0;

if (criticalCount > 0) {
  failures.push(`${criticalCount} critical dependency entries reported`);
}
const observed = new Set();
for (const packageName of Object.keys(vulnerabilities)) {
  const roots = rootAdvisories(packageName);
  if (!roots.size) {
    failures.push(`${packageName}: could not resolve the audit finding to a GHSA identifier`);
    continue;
  }
  for (const id of roots) observed.add(id);
}

const now = Date.now();
for (const id of [...observed].sort()) {
  const advisory = advisoryDetails.get(id);
  const exception = exceptions[id];
  if (advisory?.severity === "critical") {
    failures.push(`${id}: critical advisories cannot be allowlisted`);
    continue;
  }
  if (!exception) {
    failures.push(`${id}: new ${advisory?.severity ?? "unknown-severity"} advisory`);
    continue;
  }
  const expiry = Date.parse(`${exception.expires}T23:59:59.999Z`);
  if (!Number.isFinite(expiry) || expiry < now) {
    failures.push(`${id}: security exception expired on ${exception.expires}`);
  }
}

for (const id of Object.keys(exceptions).sort()) {
  if (!observed.has(id)) {
    console.warn(`Security audit notice: ${id} is no longer observed; remove its exception.`);
  }
}

if (failures.length) {
  console.error("Security audit failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

const packageCount = Object.keys(vulnerabilities).length;
console.log(
  `Security audit passed with ${observed.size} reviewed, unexpired advisories across ${packageCount} dependency entries.`,
);
