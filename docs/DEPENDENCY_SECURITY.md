# Dependency security exceptions

- Last reviewed: October 10, 2026
- Next mandatory review: October 24, 2026

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
