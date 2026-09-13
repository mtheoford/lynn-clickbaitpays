# Purchase-flow regression checks

Run with Node 22.13 or later:

```sh
npm ci
npx playwright install --with-deps chromium webkit
npm run build:worker
npm run test:e2e
```

The suite starts the production Next build on port 3100 and runs on desktop
Chromium and mobile WebKit. It covers the monthly and annual purchase cards in
English, French, and German, plus the three native videos on the personal site.
Video checks cover approved source and title-frame poster order, native controls,
metadata and brief muted playback, removal of the old custom facade, and
viewport containment.
Every API response is mocked; no Stripe sessions, customer records, reminder
emails, or analytics writes are created.

To check a deployed site without submitting signup forms:

```sh
BASE_URL=https://cbp.proneurs.org npm run test:e2e:smoke
```

Setting `BASE_URL` always restricts the suite to interaction smoke tests, even if
`npm run test:e2e` is used. All `/api/` requests remain intercepted. This checks
the deployed buttons, JavaScript, video metadata, and a minimal read-only muted
playback sample; it does not validate Stripe or database availability. Failed
test screenshots, traces, and the HTML report are written under
`outputs/playwright-results` and `outputs/playwright-report`.

CI and the deployment workflow run the browser tests before deployment. The
`deploy:staging` and `deploy:production` npm commands also run the release checks
before deploying. Both deploy paths run interaction smoke tests afterward; a
failure marks the deployment command or workflow failed and requires review.
