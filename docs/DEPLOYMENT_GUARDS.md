# Deployment and database guards

The October 2026 billing incident exposed a gap between deployment paths: the
GitHub workflow applied D1 migrations, but the local npm deployment commands did
not. Billing code could therefore reach production before its required table.

Both supported release paths now use `scripts/deploy-worker.mjs`. Use:

```sh
npm run deploy:staging
npm run deploy:production
```

The GitHub **Deploy Cloudflare Worker** workflow calls the same helper and keeps
its environment selection, production environment protection, and per-environment
deployment concurrency. A successful main-branch CI run continues to deploy to
staging; production remains a manual workflow dispatch.

## Required release order

1. Validate the complete local migration chain in an in-memory SQLite database.
2. Set build URLs for the selected environment and run `verify:release`: security
   audit, lint, typecheck, unit/integration tests, Worker build, and local desktop
   Chromium/mobile WebKit checkout tests.
3. Check required Worker **secret names**, without reading or logging their values.
4. Apply forward-only D1 migrations to the selected environment.
5. Verify the remote migration ledger and probe every table and column derived
   from the migration chain. Verify all named indexes exist on the expected
   tables. A successful CLI exit alone is insufficient: every query must return
   a successful result, and every migration must be recorded.
6. Deploy the verified build with the existing OpenNext command and `--keep-vars`.
7. Run desktop and mobile smoke checks against the deployed URL. Live smoke
   checks open the purchase UI without submitting purchases.

Failure stops subsequent steps. In particular, a failed migration or schema
probe prevents deployment. Full release tests clear any inherited `BASE_URL`
so a local checkout test run cannot silently become an external smoke-only run.
Only the final smoke step gets the external target URL.
Cloudflare write credentials are removed from the build/test and public smoke
subprocess environments; only the operational steps inherit those credentials.

The supported npm commands and workflow enforce this order. An account with
direct Cloudflare write permissions can still bypass the helper by issuing raw
deployment commands; operational releases must use the guarded path. The helper
does not replace Cloudflare account permissions or GitHub environment protection.

## Inspection and staged operation

The helper exposes stages for investigation without an unvalidated deploy flag:

```sh
# Full validation/build and local browser tests; no Cloudflare operations.
node scripts/deploy-worker.mjs verify staging

# Read-only check of the existing remote schema and migration ledger.
node scripts/deploy-worker.mjs schema production

# Validate the local chain, check secret names, apply migrations, and verify
# the database. This changes the database but does not deploy a Worker.
node scripts/deploy-worker.mjs migrate-schema staging

# Full supported release, including validation and post-deploy smoke checks.
node scripts/deploy-worker.mjs release staging
```

There is no `--skip-validation` or raw `deploy` stage. A standalone successful
`verify` does not grant a later unchecked release; the full release reruns checks.
Review new migrations before applying them. Preserve the forward-only migration
sequence and use additive changes compatible with the previous Worker when
possible. New migrations automatically extend the remote schema check; no
separate hard-coded table manifest needs updating.

## Verification and recovery

Before production, record the current Worker version and D1 Time Travel bookmark
in the release record, and verify staging against the same source revision.
After deployment, confirm public sponsor pages and purchase entry points, then
check authenticated billing health and the next scheduled recovery run. Do not
create live test charges or modify customer subscription states to test a release.

If post-deployment smoke checks fail, the helper reports failure; it does **not**
automatically roll back the Worker or reverse database migrations. Investigate
the failure, preserve the evidence, and choose a previously verified Worker
version compatible with the now-applied additive schema if rollback is needed.
Do not delete migration ledger entries, drop new tables, or restore the whole
production database merely to undo a Worker release.

`npm run test:deployment` covers release ordering, failure gates, migration-chain
validity, missing tables/columns/indexes, environment URL selection, and the
shared npm/workflow entry points using isolated SQLite fixtures and mocked
subprocesses. It performs no remote writes or deployment.
