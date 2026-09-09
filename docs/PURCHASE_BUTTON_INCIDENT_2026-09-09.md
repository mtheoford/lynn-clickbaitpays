# Purchase pricing cards incident — September 9, 2026

## Confirmed problem

The Monthly and Annual pricing cards on the sales page looked like purchase controls but were rendered as static `div` elements. They had no button semantics, link, click handler, or connection to the signup form. Both the hero and closing pricing sections had this defect. The shared sales component serves English, French, and German.

At the investigated revision `623c6d071032e5bae600840d70e0d302e1547ef2`, the affected markup is in `app/get-your-site/SalesPage.tsx`, lines 51–54 and 73–76. The separate “Get My Replicated CBP Site” buttons use `SignupDialog` at lines 48 and 77.

## Production reproduction before the fix

On September 9, 2026, a fresh Chrome session loaded `https://cbp.proneurs.org/get-your-site` and reproduced the following at the normal desktop viewport and at a 390 × 844 mobile viewport:

1. The Monthly and Annual marketing cards were exposed as containers/text in the accessibility tree. Clicking either produced no navigation or dialog.
2. “Get My Replicated CBP Site” opened the signup dialog.
3. Inside that dialog, Annual changed the continue button to “Continue with $79/year”; Monthly changed it to “Continue with $9/month”.

No customer details were entered, no terms accepted, no checkout submitted, and no emails requested. This verifies the alternate entry point and billing selection, but does not prove a completed payment works. Mobile verification used a responsive Chrome viewport, not a physical iPhone/Safari device.

GitHub’s latest production deployment before the repair was deployment `6338426646`, revision `623c6d071032e5bae600840d70e0d302e1547ef2`. It was marked successful at `2026-09-08T22:28:30Z` in [deployment run 34285959563](https://github.com/mtheoford/lynn-clickbaitpays/actions/runs/34285959563). This identifies the recorded GitHub production deployment; it does not independently exclude out-of-band Cloudflare deployments.

## Cause and history

[Commit 147bfb2ebdebaaca99aae1a0f34450727f7eef9f](https://github.com/mtheoford/lynn-clickbaitpays/commit/147bfb2ebdebaaca99aae1a0f34450727f7eef9f), “release: reconcile production Cloudflare stack and account lifecycle,” introduced the current card presentation. Its author and committer timestamp is `2026-08-04T04:11:05Z` (August 3, 2026, 10:11 p.m. in Denver).

That commit replaced the passive price text line with two styled `div` cards at `app/get-your-site/page.tsx:104–116` and added the same static cards to the closing section at lines 167–179. It retained separate signup dialog buttons. The cards therefore were never wired as purchase actions in this implementation; this is not evidence of a handler recently breaking.

The September 3 analytics change `d65dd24fa7ce` retained these cards. The September 5 language refactor `a049fde69f9c` moved the existing static markup into the shared `SalesPage.tsx`; it did not remove purchase handlers from the cards.

The underlying implementation error was a mismatch between the cards’ purchase-control appearance and their passive behavior. Rendering, typing, and compilation checks could all pass because static cards are valid JSX.

## Why automated checks missed it

Before the repair, `.github/workflows/ci.yml` ran security auditing, lint, type checking, unit tests, and a Cloudflare Worker build. `package.json` listed helper and static-rendering tests, but there was no browser interaction test that clicked every sales-page purchase control and checked the selected billing plan.

The deploy workflow finished after the Worker deployment and did not perform a post-deployment purchase-entry smoke test. The existing signup analytics counted page views, signup-dialog opens, and demo clicks; it did not observe attempts to click these inert cards. A drop in completed sales therefore could not be attributed to this exact failure from those events alone.

## Impact and evidence limits

Customers who tried the pricing cards could not proceed from those cards. The separate signup CTA remained usable in the pre-fix live browser checks. The evidence does not establish that all purchases were unavailable, how many visitors abandoned the page, or how much revenue was lost. No customer or payment records were inspected for this investigation.

The introducing commit establishes when the static cards entered version control, not their exact first production exposure. The report of no sales for a couple of days is a business signal to investigate separately; the code history does not support describing this as a new two-day total checkout outage.

## Repair and prevention implemented

- Wired every hero and closing pricing card to signup with the corresponding Monthly or Annual plan preselected, consistently across English, French, and German.
- Preserved the separate signup CTAs and the ability to change plan inside the form.
- Added automated interaction coverage for the marketing cards, correct billing selection, and the form’s checkout request payload.
- Added desktop Chromium and mobile WebKit browser checks before both workflow and npm-script deployments, followed by deployed interaction smoke tests. All smoke-test API requests are intercepted; no purchases or emails are created.
- GitHub deployment runs now attach failure traces/screenshots and tie the deployed smoke results to the revision. A successful build/deployment alone does not demonstrate that a purchase control responds.

These controls directly cover the observed failure mode. They reduce recurrence risk; they cannot guarantee that every future sales or payment failure is impossible.

The new desktop smoke test was run against the pre-fix live site and failed because the Monthly card had no button role. This demonstrates that the regression suite detects the reported defect. A same-origin empty checkout request returned the expected first-name validation error, confirming that the production handler loaded the billing configuration and exited before database or Stripe mutation. This does not validate the credentials or price IDs with Stripe.
