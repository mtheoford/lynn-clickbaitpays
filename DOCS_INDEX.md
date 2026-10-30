# Personal CBP Sites documentation

Current references updated October 30, 2026; the historical index was reviewed
October 11, 2026. Start with the [current README](README.md) for this
application or the [ProNeurs project map](../PROJECT_MAP.md) for the whole folder.
Current source/configuration, recorded releases, and historical plans answer
different questions; a local record does not independently verify today's live state.

## Current project references

| Reference | Use it for |
| --- | --- |
| [README](README.md) | Implemented product, configured addresses, US $9/$79 pricing, and operations overview |
| [Billing reliability plan](docs/BILLING_RELIABILITY_PLAN_2026-10-30.md) | Prioritized issues, incident findings, fixes, ownership, and follow-up tracking |
| [Billing operations](docs/BILLING_OPERATIONS.md) | Health monitoring, recovery checks, safe event replay, and customer-impact triage |
| [Deployment guards](docs/DEPLOYMENT_GUARDS.md) | Shared release runner, full validation, migrations/schema gate, and rollback procedure |
| [Welcome-email delivery](docs/WELCOME_EMAIL_DELIVERY.md) | Durable delivery tracking, retry limits, legacy uncertainty, and deliberate resends |
| [October 30 billing release](docs/BILLING_RELIABILITY_RELEASE_2026-10-30.md) | Rollout status, validation evidence, operational cleanup, and live verification |
| [Wrangler configuration](wrangler.jsonc) | Declared Worker, D1, queue, domain, and cron configuration |
| [Deployment workflow](.github/workflows/deploy.yml) | Checked-in staging/production release process and purchase-entry smoke checks |
| [Tenant routing](lib/site-routing.ts) and [data model](db/schema.ts) | Generated `/s/{slug}` links, referral validation, and subscriber/site/billing records |
| [Video sources](lib/video-sources.ts) and [posters](lib/video-posters.ts) | Current English/French/German media selected by application source |
| [Localized video record](docs/LOCALIZED_VIDEO_ROLLOUT.md) and [media archive](media/README.md) | September 28 language-specific originals, hosted mapping, and preservation procedure |
| [Signup conversion tracking](docs/SIGNUP_CONVERSION_TRACKING.md) | Implemented funnel events, reports, and verification approach |
| [Dependency security](docs/DEPENDENCY_SECURITY.md) | Dated dependency-review records and mandatory review dates |

## Historical plans and evidence

| Record | What it preserves |
| --- | --- |
| [Original product plan](docs/REPLICATED_SITE_PRODUCT_PLAN.md) | August 3 pilot status, initial subdomain-first design, delivery increments, and launch checklist |
| [French rollout](docs/FRENCH_REPLICATED_SITE_PLAN.md) | September 4 localization scope and validation record |
| [Multilingual rollout](docs/MULTILINGUAL_SITE_ROLLOUT_PLAN.md) | September 5 shared-language design and original YouTube-era decisions |
| [Native MP4 release](docs/VIDEO_MEDIA_ROLLOUT.md) | September 13 migration and English source files; later localized media supersedes its all-English notes |
| [Localized posters](docs/LOCALIZED_NATIVE_VIDEO_POSTERS.md) | September 28 poster restoration; later localized videos supersede its unchanged-audio notes |
| [Purchase-button incident](docs/PURCHASE_BUTTON_INCIDENT_2026-09-09.md) | Production reproduction/deployment evidence, cause, repair, and evidence limits |

Files with a ` 2` suffix are retained as existing duplicates, not linked here as
the primary documentation. This cleanup does not remove them or their history.
