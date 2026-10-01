# Dependency security exceptions

- Last reviewed: September 4, 2026
- Next mandatory review: October 4, 2026

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
