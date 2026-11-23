# Native client reviews and video testimonials

This integration adds selected, published native feedback to the home page, in the profile page's warm background, white cards, black controls and bronze accents. Existing Google/Trustpilot content remains separate. No sample reviews are loaded by this integration. Agency brokers' personal pages are excluded: native feedback is mounted only at `/`.

## Activation prerequisite

The backend's additive `20261122180000_native_website_feedback` migration must already be applied to the intended database before activating this template integration. This repository does not apply it. No hosting changes, deployment, credential rotation, dependencies, or moderation dashboard are part of this change.

The existing independent-broker site uses its private `BROKBUDDY_API_BASE_URL`, `BROKBUDDY_BROKER_PROFILE_SLUG` and `BROKBUDDY_BROKER_CODE`. Feedback defaults to `BROKBUDDY_FEEDBACK_SCOPE=broker`. The footer shows a “Write a review” link only after the config endpoint returns an enabled, valid form configuration. Unknown, disabled, malformed and failed responses hide the link. Availability is checked every 30 seconds while the page is visible, and again on focus, reconnection or visibility changes, so the link returns without a reload when the API recovers. No submissions or published-feed requests run until configuration enables reviews. The former profile button and in-page review entry have been removed.

For an agency deployment, explicitly select `BROKBUDDY_FEEDBACK_SCOPE=agency` and supply that deployment's own `BROKBUDDY_AGENCY_SLUG` and `BROKBUDDY_AGENCY_CODE`. There is no fallback between agency and broker credentials or slugs. These settings affect feedback only; the existing independent-broker inventory and enquiry integration is unchanged. An agency deployment must already provide its agency inventory/enquiry integration; this change does not convert the rest of this broker template to an agency website. Agency credentials, slugs and website domains must be configured separately from independent-broker deployments.

Optionally set private `BROKBUDDY_FEEDBACK_WEBSITE_ORIGIN` to the canonical website origin (for example `https://reviews.example.test`, without a trailing slash). The reverse proxy must preserve the public Host. POST Origin must exactly match that Host and, when supplied, the configured canonical origin. Forwarded Origin/Host and visitor-supplied URLs are never used to select the upstream. No browser Origin is forwarded upstream.

Never use browser-prefixed environment variables for private settings. No code/verifier belongs in a URL, enquiry metadata or a client bundle. The existing build boundary and artifact audit also cover this integration.

## Request and privacy behavior

- `GET /api/feedback/config` returns only public form configuration. Agency broker choices contain IDs and names, without email addresses or BRNs.
- `GET /api/feedback?kind=REVIEW&page=1&pageSize=12` and the equivalent `kind=VIDEO` request load one published page at a time. Unknown/duplicate query parameters, excessive page sizes and arbitrary URL parameters are rejected. Native summaries are labelled **Selected client reviews**, with the supplied disclosure; a missing average is never replaced by a fake score.
- `POST /api/feedback` accepts only the documented fields. The proxy caps the incoming stream at 2,850,000 bytes before JSON parsing, checks Origin, validates names, ratings, text, consent and photo type/size/signature, and checks an optional agency broker against fresh config. The backend remains responsible for safe image decoding, orientation, cropping and conversion.
- The browser keeps one UUID across errors and repeated clicks, disables the form while pending, and creates a fresh UUID only after success/reset. Inputs survive errors. HTTP 202 alone produces: “Thank you. Your review has been submitted for review.” Pending records are never inserted into the published UI. Preview object URLs are revoked on close, replacement, reset, success and unmount.
- `/api/feedback/:id/avatar` and `/api/feedback/:id/video` authenticate every media request. Browser URLs contain only validated item IDs. Video Range requests preserve successful 200/206 headers, and 416 preserves Content-Range/Accept-Ranges with an empty response body. All responses explicitly disable browser/CDN caching. Upstream storage URLs and submission IDs are omitted.
- Video-only cards have inline native players with preload disabled and avatar posters; video bytes load on playback. The expanded viewer loads metadata when opened. Captions, dates, broker credits and replies are omitted from video cards/viewers; client names remain in accessible labels. The viewer has native controls, playsInline, next/previous, Escape/close, focus containment and left/right navigation outside the native player controls. There is no autoplay. Closed, offscreen and background-tab videos pause. Reduced motion is respected.

The local limiter allows three distinct submission UUIDs per hour per connection IP and bounded retries for the same UUID (30 attempts/hour). It does not trust a browser-supplied forwarded IP or a resettable cookie. Its bounded state is in memory per Node process: restarts reset it, visitors behind one IP share the allowance, and multiple serverless instances do not share counters. For multiple instances or a shared reverse-proxy connection, deployment-wide visitor limits require a trusted shared limiter at the existing edge/backend. No database or dependency was introduced for rate limiting.

All submitted text and business replies render through React's normal text escaping. Public backend validation/status codes are retained; private response fields and unsafe error messages are omitted. Feed and media requests use no-store, including CDN directives, so a new request sees upstream moderation changes. Already-rendered content refreshes using **Refresh reviews** or a page reload; there is no background download of every page.

## Local preview and verification

Use the existing installed dependencies and your own issued private settings. Do not submit invented reviews to a live backend.

```sh
npm run dev
```

Open `http://127.0.0.1:3000/`. If credentials are absent, the existing site may display its unavailable state. If feedback is disabled or unavailable upstream, the footer review link and native feeds are hidden. The `/write-a-review` route remains a valid page: it offers an availability message and retry when the API is down, and the existing review form when available. A draft already being edited is preserved and disabled during an outage, then becomes usable again after recovery. For a synthetic interactive preview that cannot write to a live backend, run the browser tests in headed mode:

```sh
node node_modules/@playwright/test/cli.js test tests/browser/feedback.spec.mjs --headed
```

The tests intercept API/media requests and block external traffic. They generate a short local solid-color WebM with the existing system `ffmpeg`; no package is installed. Tests require a local browser and loopback access. Playwright starts/stops the dev server. To point tests to an already-running local server, set `BROWSER_BASE_URL`.

```sh
npm test
npm run typecheck
npm run build
node node_modules/@playwright/test/cli.js test tests/browser/feedback.spec.mjs
```

Tests cover both scopes, credential separation/redaction, config 404, invalid/body-limited requests, Origin checks, rate limiting, idempotent retries, exact 202 handling, published pages, plain-text escaping, business replies, hidden media/feed responses, null averages, API failures, native video controls/seeking/volume, pause on navigation/close/offscreen, keyboard controls, and 1440/390/320px layouts. Synthetic browser screenshots are stored under `.verification/`. Actual publication/moderation still depends on the upstream backend and migration; no live moderation mutations are performed.

## Changed files

- `server/feedback.mjs`: private scope selection, upstream calls, safe public projection, media authentication.
- `server/feedback-http.mjs`: same-origin routes, request limits/validation, limiter and media streaming.
- `server/brokbuddy.mjs`, `server/http.mjs`: connect feedback to the existing client and shared Node/Vercel handler.
- `vercel.json`, `api/index.mjs`: feedback route rewrites and raw-stream comment.
- `src/components/NativeFeedback.jsx`, `NativeFeedback.css`: published feeds and accessible video viewer.
- `src/components/ReviewForm.jsx`, `WriteReviewPage.jsx`: dedicated review page, existing photo/rating/consent validation, retry keys and pending confirmation.
- `src/lib/feedback.js`, `feedback-config.mjs`: shared config validation and automatic availability checks.
- `src/components/Footer.jsx`: conditional link to `/write-a-review`.
- `src/components/Testimonials.jsx`: retained component entry delegates to native feedback instead of demonstration testimonials.
- `src/App.jsx`: share review availability across routes, mount published feedback on the home page and serve `/write-a-review`.
- `tests/feedback-fixtures.mjs`, `tests/feedback.test.mjs`, `tests/browser/feedback.spec.mjs`: synthetic contract, proxy and browser checks.
- `.env.example`, `README.md`, `NATIVE_FEEDBACK.md`: configuration and handoff.

Earlier baseline validation: 72 Node tests and all 69 Playwright browser tests passed; TypeScript and the production build passed. The build retains Vite’s large-chunk advisory. Populated screenshots: `.verification/native-feedback-desktop.png`, `.verification/native-feedback-mobile.png`, and `.verification/native-feedback-form-mobile.png`.

The review section follows the profile page’s sans-serif headings, gutters and card borders. On phones, video cards form a wide swipeable row and the dedicated review page uses full-width rating rows and normal page scrolling. The mobile flow is checked at both 320px and 390px.

The published review area keeps its selected-review label and backend disclosure without promotional taglines or duplicate disclosure text. Single-page feeds omit pagination. Testimonial cards contain only a video player and an expand control; the expanded viewer uses icon controls.

The dedicated review-page update passed 22 targeted Node checks, all 8 feedback browser tests and the production build. Browser tests cover the footer link, automatic outage recovery, direct route reloads, draft retention, existing moderation acknowledgement and 320px/390px form layouts; all submissions remain intercepted synthetic data.
