import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";

// Exercise the actual HTTP route and origin/range validation. Only administrator
// identity and the database loader are substituted; no auth bypass is shipped.
test("report generation requires an explicit authorized same-origin POST", async () => {
  const bundle = await build({
    stdin: {
      contents: `export { POST } from './app/api/admin/signup-report/route.ts';
        export { setAdmin } from '@/lib/admin-auth';
        export { reads, setFailure } from '@/lib/signup-analytics-query';`,
      resolveDir: process.cwd(), loader: "ts",
    },
    bundle: true, write: false, format: "esm", platform: "node", logLevel: "silent",
    plugins: [{ name: "report-test-dependencies", setup(builder) {
      builder.onResolve({ filter: /^@\/lib\/(admin-auth|signup-analytics-query)$/ }, (args) => ({ path: args.path, namespace: "report-test" }));
      builder.onLoad({ filter: /admin-auth$/, namespace: "report-test" }, () => ({ contents: `let admin = false; export function setAdmin(value) { admin = value; } export async function getAdmin() { return admin ? { email: 'admin@example.test' } : null; }` }));
      builder.onLoad({ filter: /signup-analytics-query$/, namespace: "report-test" }, () => ({ contents: `export const reads = []; let fail = false; export function setFailure(value) { fail = value; } export async function loadSignupAnalyticsReport(range, now) { reads.push({ range, now }); if (fail) throw new Error('private database diagnostic'); return { points: [], interval: 'day' }; }` }));
    } }],
  });
  const route = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`) as {
    POST(request: Request): Promise<Response>;
    setAdmin(value: boolean): void;
    setFailure(value: boolean): void;
    reads: { range: string; now: Date }[];
  };
  const request = (body: string, origin = "https://admin.example.test") => new Request("https://admin.example.test/api/admin/signup-report", { method: "POST", headers: { origin, "content-type": "application/json" }, body });
  assert.equal((await route.POST(request('{"range":"all-time"}'))).status, 403);
  route.setAdmin(true);
  assert.equal((await route.POST(request('{"range":"all-time"}', "https://other.example.test"))).status, 403);
  assert.equal((await route.POST(request('{"range":"all-time"}', ""))).status, 403);
  for (const body of ['{"range":"unsupported"}', '{}', 'null', 'invalid JSON']) {
    assert.equal((await route.POST(request(body))).status, 400);
  }
  assert.equal(route.reads.length, 0, "Rejected requests must never start a database report");
  const response = await route.POST(request('{"range":"last-7-days"}'));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const result = await response.json() as { generatedAt: string };
  assert.equal(route.reads.length, 1);
  assert.equal(route.reads[0].range, "last-7-days");
  assert.equal(result.generatedAt, route.reads[0].now.toISOString());
  route.setFailure(true);
  const failed = await route.POST(request('{"range":"today"}'));
  assert.equal(failed.status, 503);
  assert.doesNotMatch(await failed.text(), /private database diagnostic/);
});
