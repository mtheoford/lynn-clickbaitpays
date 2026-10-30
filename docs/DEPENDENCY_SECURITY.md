# Dependency security exceptions

- Last reviewed: October 30, 2026
- Next mandatory review: November 6, 2026

## October 30 billing reliability release review

The release updates the existing `undici` override from 7.29.1 to 7.30.1 and
refreshes the compatible transitive `zod` dependency from 4.4.3 to 4.6.7. These
are the only package-version changes. No Stripe API, Next.js, OpenNext, Wrangler,
Miniflare, or migration-tool version changes were made for this remediation.

The [Undici 7.30.1 release](https://github.com/nodejs/undici/releases/tag/v7.30.1)
fixes all eight newly reported Undici advisories. Its Node.js requirement remains
`>=20.18.1`, compatible with the repository's supported Node.js versions. The
[Zod advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) is fixed in
4.6.6; the installed 4.6.7 satisfies both existing consumers' `^4.0.0` ranges.
The updated audit has no critical or high findings. Its four moderate package
entries all resolve to the single older esbuild advisory below. No new advisory
exception was added, and the gate's severity and expiration rules are unchanged.

### Fresh review of the remaining development-tool advisory

[GHSA-67mh-4wv8-2f99](https://github.com/evanw/esbuild/security/advisories/GHSA-67mh-4wv8-2f99)
affects esbuild through 0.24.2 and is fixed from 0.25.0. The vulnerable behavior
requires esbuild's development server: a browser visiting an untrusted page can
read responses from that server because of permissive CORS. Listening only on
localhost does not remove that attack path.

Fresh dependency and source inspection on October 30 established the following:

- The affected copy remains only at `drizzle-kit@0.31.10` →
  `@esbuild-kit/esm-loader@2.6.5` → `@esbuild-kit/core-utils@3.3.2` →
  `esbuild@0.18.20`. The repository's other esbuild copies are patched.
- The installed `core-utils` source calls only `transform` and `transformSync`;
  it contains no `serve` call. The application, worker, scripts, and CI contain
  no Drizzle Kit runtime import or esbuild server invocation. The sole package
  script invoking Drizzle Kit is `db:generate`, against repository-controlled
  schema/configuration files.
- `npm view drizzle-kit@0.31.11 dependencies` confirms the current stable release
  still declares `@esbuild-kit/esm-loader: ^2.5.5`. Updating that patch does not
  remove the vulnerable path. npm's proposed downgrade to Drizzle Kit 0.18.1 is
  not a compatible fix. Forcing a newer pre-1.0 esbuild outside the loader's
  `~0.18.20` range is not an established safe migration-tool upgrade.
- This release's successful Worker build and production dry-run had no
  `drizzle-kit`, `esbuild-kit`, or `node_modules/esbuild` paths in 440 bundled
  input modules. A scan of 1,559 generated JavaScript/JSON artifact files found
  no matching tooling paths. The server-function metafile separately listed
  690 inputs with no Drizzle Kit or esbuild-kit path.

On this evidence, only the existing development-tool exception is renewed for
seven days, through November 6. Do not run Drizzle Studio or an esbuild development
server. Re-review immediately if the tooling is imported into runtime code,
server functionality is introduced, or a supported upstream fix becomes
available. Before November 6, check the upstream dependency path again and remove
the exception when supported remediation is available. A newly discovered
advisory or an expired exception must continue to fail the security gate.

Local release evidence is preserved under `outputs/billing-reliability/`:
`npm-audit-after-patches.json`, `worker-tooling-exclusion.json`,
`worker-metafile.json`, `artifact-build.log`, and
`development-tool-artifact-check.json`. These are local verification outputs,
not application data or deployed files.

## October 10 release prerequisite review

The shared-account Stripe isolation release refreshes compatible `proxy-addr`
and `source-map-js` patches and updates the existing Sharp override to 0.35.5.
These remove the critical IPv4-mapped-IPv6 trust advisory and the patched
source-map and image-library advisories. No audit rule or CI gate is relaxed.

Two unresolved development-tool advisory roots have explicit, short exceptions
through October 24. They are not production request-processing dependencies:

| Advisory and locked path | Reachability and required controls | Why an exception remains |
| --- | --- | --- |
| [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99): `drizzle-kit@0.31.10` → `@esbuild-kit/esm-loader@2.6.5` → `@esbuild-kit/core-utils@3.3.2` → `esbuild@0.18.20` | Migration tooling reads repository-controlled schema/config files. Do not expose Drizzle Studio or an esbuild development server. The app uses `drizzle-orm`, not Drizzle Kit, at runtime. | Current stable Drizzle Kit 0.31.11 still includes the legacy loader. Avoid an unvalidated loader/esbuild override or prerelease migration-tool upgrade in a billing fix. |
| [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm): `eslint-config-next@16.3.8` → `@next/eslint-plugin-next@16.3.8` → `fast-glob@3.3.1` → `micromatch@4.0.8` → `braces@3.0.3` | The recursive-pattern denial of service is limited here to lint's repository-controlled glob/path inputs. The default Next lint configuration supplies no customer-generated patterns. CI lint runs without production secrets. Never expose lint/glob tooling as an HTTP service or feed it user input. | No patched braces release exists as of this review. Current Next ESLint 16.4.0 still uses the affected dependency path. Removing Next's lint rules would reduce coverage. |

Release verification must confirm the Worker artifact contains neither tooling
path. A newly added runtime import, user-controlled glob input, development
server exposure, or newly patched upstream version requires immediate re-review.
Before October 24, rerun `npm outdated` and `npm run audit:security`, inspect the
official advisories, and replace these exceptions with supported patched packages
where available. The machine-readable gate still rejects every critical finding,
unreviewed new finding, expired exception, and incomplete report.

October 10 verification: `npm run verify:release` passed (audit, lint, typecheck,
158 unit/integration tests, OpenNext Worker build, and 71 desktop/mobile purchase
tests; one mobile keyboard-only test is intentionally skipped). The generated
`.open-next/server-functions/default/handler.mjs.meta.json` listed 629 inputs
with no ESLint, fast-glob, micromatch, braces, Drizzle Kit, or esbuild-kit entries;
the deployed `.open-next` file tree also contained no package files from those
tooling paths. Next's `get-root-dirs` invokes fast-glob only for an explicit
`settings.next.rootDir`; this repository's default config does not set that
option, further narrowing the reviewed lint exposure.

## Earlier release history

The October 1 release preparation updated Next.js and its ESLint configuration from 16.3.4 to 16.3.8 and refreshed compatible transitive `brace-expansion` patches. This clears the newly reported critical Next.js advisory and high brace-expansion advisories without weakening the release gate. Resolved advisory exceptions were removed.

`npm audit` now reports four development dependency entries resolving to the existing Drizzle Kit/esbuild advisory. Its September 4 review and October 4 expiration remain unchanged. No exception was added or renewed during this patch update.

The September 4 review confirmed the same six advisory roots and seven affected
dependency entries, with no critical findings. The documented controls and
exposure boundaries remain unchanged, so the exceptions were renewed for one
short review cycle while supported Next.js, OpenNext, and Drizzle Kit upgrades
are evaluated together.

Cloudflare's current Miniflare release pins `undici` 7.28.0. The project
temporarily overrides that transitive dependency to the compatible patched
7.29.0 release; remove the override once Miniflare adopts 7.29.0 or newer.

The machine-readable source of truth is
`.github/security-audit-allowlist.json`. `npm run audit:security` fails when:

- a new advisory appears;
- any critical advisory appears, even if someone adds it to the allowlist;
- an exception reaches its expiration date; or
- npm cannot produce a complete, mappable audit report.

## September 4 exposure assessment (historical)

| Dependency path | Exposure | Required control |
| --- | --- | --- |
| Drizzle Kit → esbuild | Development only | Do not expose Drizzle Studio or an esbuild development server outside localhost. |
| Next.js → PostCSS | Build time | Build only repository-controlled CSS and source maps. Keep deployment secrets unavailable during dependency installation and build. |
| Next.js → Sharp | Not shipped in the Worker artifact | Keep Next image optimization disabled and do not accept customer image uploads until a patched compatible Sharp version is available. |
| OpenNext → Next.js | Transitive report only | Upgrade OpenNext and Next.js together after compatibility tests pass. |

## Review procedure

1. Run `npm outdated` and `npm run audit:security`.
2. Test current Next.js, OpenNext, and Drizzle Kit releases on a branch.
3. Build the Worker and verify that vulnerable Sharp or PostCSS package trees are
   not introduced into `.open-next/server-functions`.
4. Remove resolved advisory IDs from the allowlist.
5. For anything unresolved, update the assessment and set a new short expiration
   date only after an explicit security review.

Do not use `npm audit fix --force` or unsupported package overrides as a routine
remediation. Either upgrade through supported dependency ranges or validate any
temporary override through the complete test, Worker-build, and staging flow.
