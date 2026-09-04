# French Replicated Site Delivery Plan

Status: implementation complete; production release candidate validated  
Started: 2026-09-04  
Primary audience: French-speaking visitors, initially using general French (`fr`) with France-style number formatting (`fr-FR`)

## Objective

Add a polished French version of every public replicated sponsor site while keeping the existing English URLs, tenant data, visual design, calculator behavior, analytics, and referral attribution intact.

The French experience will run from the same Next.js and Cloudflare Worker application. It will not create a second deployment or a copied tenant codebase.

## Public URLs

- English path-based site: `/s/{slug}`
- French path-based site: `/fr/s/{slug}`
- English tenant-host site: `/`
- French tenant-host site: `/fr`

A visible EN / FR language switcher will preserve the current sponsor. French internal links will remain in French wherever a translated route exists.

## Delivery scope

### 1. Locale foundation

- Add validated `en` and `fr` locale types and helpers.
- Add typed English and French message catalogs for the replicated-site experience.
- Make the sponsor page, calculator, testimonial gallery, metadata, copyright, and URL helpers locale-aware.
- Mark French page content with `lang="fr"` and publish a French `Content-Language` response.
- Keep English URLs backward compatible.

### 2. Replicated sponsor page

- Translate navigation, hero, calls to action, disclosures, video labels, resource labels, FAQs, sponsor area, unavailable state, footer, accessibility labels, and metadata.
- Add a locale-aware language switcher.
- Preserve sponsor name, referral URL, contact information, and authored biography.
- Supply an automatic French demo/sponsor introduction when the stored biography is the standard generated English introduction.

### 3. Campaign calculator

- Translate all controls, explanations, outcomes, assumptions, accessibility announcements, and close actions.
- Preserve the existing calculation engine and numerical results.
- Format numbers and percentages with French punctuation and spacing.
- Replace English-only singular/plural presentation with locale-aware wording.

### 4. Testimonials and media

- Keep original testimonial screenshots unchanged as source evidence.
- Show French translations of the adjacent quotations and accessibility descriptions.
- Identify the screenshot source language where helpful.
- Use the existing YouTube videos with French captions requested in the embed when available.
- Add a French transcript/summary fallback and clearly identify videos whose spoken audio remains English.
- Create a French social-sharing image or a language-neutral replacement.
- Use a separately localized French product-preview image on the sales page while preserving the original English asset.

### 5. French documents and policy routes

- Create and visually verify a French edition of the ClickBaitPays Getting Started guide from the available source document.
- Point French resource links to the local French PDF.
- Create French versions of the public FAQ/resource explanation and the ProNeurs terms, privacy, cancellation/refund, acceptable-use, and affiliate-disclosure pages.
- Keep links to third-party official pages available and clearly label them when their source remains English.

### 6. Growth and analytics continuity

- Preserve source-sponsor attribution in French growth links.
- Carry the locale into the growth/signup destination.
- Keep analytics event names unchanged; add a locale value if it can be introduced without destabilizing the existing data path.
- Ensure referral buttons continue to use the tenant's validated ClickBaitPays URL.

### 7. Purchase and customer lifecycle

- Present the French signup, validation states, consent links, success page, and Stripe Checkout interface in French.
- Preserve `fr` through Checkout metadata, provisioning, welcome and incomplete-checkout e-mails, magic-link authentication, sign-out, customer management, and the Stripe billing-portal return.
- Keep prices explicit as U.S. dollars until an EUR price or Stripe Adaptive Pricing decision is tested and enabled.
- Format French contact numbers without applying North American punctuation.
- Localize system-generated sponsor biographies while leaving sponsor-authored text unchanged.

### 8. Responsive and accessibility quality

- Adjust nowrap and fixed-width rules that clip longer French copy.
- Verify the public page and calculator at phone, tablet, laptop, and desktop widths.
- Verify keyboard navigation, focus return, reduced motion, accessible names, French language pronunciation boundaries, and 200% zoom reflow.

## Validation gates

- Locale and route tests pass.
- Existing calculator math tests remain unchanged and pass.
- French rendered-copy smoke tests confirm key sections and no accidental English UI fallback.
- Lint, typecheck, unit tests, dependency audit, and Cloudflare Worker build pass on Node 22.
- The French PDF is re-rendered to images and visually inspected page by page.
- Staging is checked in Chrome at desktop and mobile widths.
- Production is deployed only from a green CI revision.
- Production English and French tenant URLs, calculator, PDF, policies, referral links, and language switcher are smoke-tested after deployment.

## Release sequence

1. Commit this plan.
2. Implement locale foundation and French routes.
3. Localize the sponsor page, calculator, testimonials, metadata, and styles.
4. Generate and verify the French PDF and translated policy/resource pages.
5. Add automated coverage and run the full local validation suite.
6. Push to `main`; confirm GitHub CI and automatic staging deployment.
7. Trigger the protected production deployment for the same green revision.
8. Verify the live French and English experiences in Chrome.

## Implemented media decision

The existing videos remain embedded so the page keeps the same pacing and visual design. French embeds request French YouTube captions when available, and the surrounding French copy identifies that spoken audio may remain English and supplies a French summary. Producing dubbed replacements is a later enhancement rather than a launch dependency.

## Implemented payment decision

Stripe Checkout is explicitly localized to French for the French flow. The existing subscription prices remain `$9 USD` monthly and `$79 USD` annually, shown to French visitors as `9 $ US` and `79 $ US`. French cards can complete the existing card flow; EUR prices or automatic local-currency presentation should be added only after a dedicated pricing and checkout test.

## Definition of done

A French-speaking visitor can open a sponsor's French URL, understand the opportunity and risk disclosures, use the calculator, read the testimonials and resources, open a French getting-started guide, follow the correct sponsor referral link, switch between French and English without losing the sponsor or source attribution, purchase through a French Stripe Checkout, receive French lifecycle e-mails, and manage the site through a French customer-account flow without unexpectedly falling back to an English ProNeurs page.
