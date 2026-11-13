# BrokBuddy integration

This remains the original React/Vite template. Node provides a same-origin API and serves the existing Vite application. There is no framework migration or external UI template.

## Run locally

Use Node 22+ and npm:

```sh
npm ci
cp .env.example .env
# Enter operator-supplied server settings in .env.
npm run dev
```

Open http://localhost:3000. The local `.env` has been populated with the values supplied by the operator in this session. It is not an application asset. Do not paste its contents into browser code or build settings exposed to clients.

Environment names:

- `BROKBUDDY_API_BASE_URL`: the HTTPS API origin. HTTP is accepted only for loopback test fixtures.
- `BROKBUDDY_BROKER_PROFILE_SLUG`: the individual broker's public profile slug.
- `BROKBUDDY_BROKER_CODE`: the issued 32-character lowercase hexadecimal code, read only in Node.
- `PORT`: optional local/server listener port, default 3000.
- `HOST`: optional listener address, default 127.0.0.1. Set to 0.0.0.0 when the deployment platform requires it.

Production commands:

```sh
npm run build
npm start
```

`npm run preview` also starts the production Node server. A standalone Vite preview/static host does not provide the required API. Reverse proxies must preserve the public Host header, terminate HTTPS, and route `/api/*` to Node. Browser enquiries must have an exact same-host HTTP(S) Origin. The app does not trust forwarded origin/host values supplied by a request.

Do not upload `.env` or other real environment files. `.gitignore`, `.dockerignore`, and `.vercelignore` exclude them and the verification snapshots. The supplied `.env.example` contains placeholders only. On a managed platform, configure secrets through its server runtime environment. The standalone Node deployment target remains available; Vercel uses `api/index.mjs` to run the same API handler as a function alongside the static frontend. See [Vercel deployment](VERCEL.md).

## API and publication prerequisites

The integration was checked against these files in the local BrokBuddy API checkout:

- `services/api/docs/broker-public-template.md`
- `services/api/docs/website-publication.md`
- `services/api/src/modules/public/public.routes.ts`
- `services/api/src/modules/public/public-template.controller.ts`
- `services/api/src/modules/public/public-template.service.ts`
- `services/api/src/modules/public/public.controller.ts`

Deploy an API version with the individual broker template routes and the publication/origin changes. Apply migration `20261110120000_add_website_publication_switch` before starting an API version that selects `Organization.websitePublishingEnabled`. Fresh installations need the regenerated baseline schema. The organization and broker must be active, the broker profile and listings public, Show Listings enabled, the individual code valid, and Company Website connected. Existing public asset URLs remain subject to publication checks.

Before publishing the template, the operator should save its canonical HTTPS website URL in the broker's BrokBuddy Branding settings. The API uses the exact parsed origin (scheme, host and port) to register broker feed/media access automatically. `www` and the bare domain are different origins: redirect aliases to the saved canonical hostname. Do not add tenant domains to the first-party `ALLOWED_ORIGIN`; no global tenant CORS list or API restart is required for a Branding URL update. Follow a returned public photo URL and verify its final image response, including its matching CORS origin if browser-origin access/canvas is needed.

No BrokBuddy settings, migrations, publication switches, credentials, or deployment were changed by this integration.

## Request and data handling

Node alone requests:

```text
GET /api/public/broker-template/{configured-slug}
GET /api/public/broker-template/{configured-slug}/listings?page=1&limit=12
GET /api/public/broker-template/{configured-slug}/listings/{listing-id}
```

Only these server reads carry `X-BrokBuddy-Broker-Code`. They use no-store, bounded timeouts and redirect rejection. Server responses select public fields, validate the configured slug and broker ID in both listing ownership shapes, and never include upstream errors or the raw credential. A changing, duplicate, truncated, malformed or unauthorized feed fails closed. The broker profile and first inventory page are requested concurrently. Inventory requests use the API-supported 100-listing page size; the visible UI still starts with six cards and keeps its existing Load More behavior. All active listing pages are validated and loaded before existing local filters, sorting, search and load-more operate. No partial inventory is presented as a complete feed. The profile preview is not used as the inventory database. No organization or sibling broker fallback exists.

Browser reads use `/api/site`; direct `/property/:id` and `/properties/:id` visits fetch the dedicated scoped detail endpoint. Missing details have the existing not-found view; feed/auth failures have the neutral unavailable view. Broker navigation and footer are absent in the unavailable state, with non-identifying, non-indexable metadata. Focus, page restore and a 60-second check revalidate the feed. A healthy background recheck retains form state; failures clear public feed state. Previously downloaded images cannot be retracted by the site.

Profile biography and listing descriptions support HTML, escaped HTML, Markdown and plain text through `marked` plus DOMPurify. Executable elements, event handlers, inline styles and unsafe links are stripped. Rich text inherits the existing content containers' typography. Google Maps popup interpolation is escaped. Image URLs come from the API; gallery identity/URL deduplication excludes documents and floor-plan/360 assets. Map pins use actual coordinates only.

Prices retain numeric values and their source currencies. Rental periods are not supplied by this contract, so none are appended. Mortgage estimates appear only for sales and calculate in the source currency. Mixed-currency inventory disables the existing numeric price filter/sort options. The existing map and mortgage currency conversion controls remain in place but unavailable because this contract provides no exchange rates.


## Google Maps for this website

Novalux is a React/Vite application, so it does not use Next.js's
`NEXT_PUBLIC_*` environment variables. Maps configuration is read by the Node
server at runtime and exposed through a deliberately public, no-store
`GET /api/maps-config` response. It contains only `enabled`, the restricted
Maps browser `apiKey`, and `mapId`; no BrokBuddy feed credentials are included.

Configure each deployed website independently:

```dotenv
BROKBUDDY_API_BASE_URL=https://api.brokbuddy.si
BROKBUDDY_BROKER_PROFILE_SLUG=the-brokers-public-slug
BROKBUDDY_BROKER_CODE=the-issued-server-only-code
GOOGLE_MAPS_BROWSER_API_KEY=the-websites-restricted-google-browser-key
GOOGLE_MAPS_MAP_ID=8f9c7f3389f798b89cdc534a
```

Keep these settings in the Node host's runtime environment or ignored `.env`.
The Maps browser key is intentionally visible in browser network requests;
restrict it to the canonical website and any supported aliases in Google
Cloud, with one website entry per hostname, such as
`https://agency.example/*` and `https://www.agency.example/*`. Add the local
origin only to a development key when testing locally. The key needs Maps
JavaScript API for these listing maps. This implementation does not use Places
or Geocoding, so those APIs do not need to be authorized on the template key.
Use a dedicated key per customer website to allow independent restrictions and
rotation. Keys in the same Cloud project share that project's billing/quotas.

The supplied Map ID can be reused for common styling by websites using the
same Google Cloud project. Set a different JavaScript Map ID to give a website
its own map configuration. Missing/invalid Maps settings disable only the map;
property details, browsing and enquiries continue to work.

For this code release, run `npm run build` and restart/redeploy Node. Later
changes to Maps settings require a Node restart and a browser reload, without
rebuilding Vite assets. Separate repositories/hosts must each receive their
own settings; changing the Broker OS VM does not update this website.

Both the map explorer and the listing-detail map use the feed's validated
`coordinates: {lat, lng}` directly. The detail page requests Maps only after
**Show map** is selected. Missing coordinates show **Location unavailable**;
zero coordinates are valid. No address geocoding, nearby-place requests or
invented listing pins are used. The SDK is loaded once per browser page, and
map failures retain the normal property-list/details experience.

BrokBuddy requests still go from Node to `api.brokbuddy.si` using the broker
code. Google Maps requests go from the visitor's browser directly to Google
using the restricted Maps browser key. Register the website's canonical URL
in BrokBuddy Branding as described above; separately authorize its hostname
in the Google Maps key's website restrictions. These are distinct settings.

For agency templates in other repositories, keep their existing agency
slug/code server integration and use the same Maps configuration/coordinate
contract. Do not replace an agency credential with this broker template's code.
The browser must never receive either type of BrokBuddy access code.

## Enquiries and retries

Every active contact, broker consultation, valuation and viewing form posts JSON to `/api/inquiries`. The server checks origin, method, MIME type, a 16 KiB size limit, the exact inquiry contract, contact details and a retry key. It verifies the configured broker feed, and verifies listing ownership/status when a listing ID is present, before sending:

```text
POST /api/public/broker/{configured-slug}/inquiry
```

The POST receives the idempotency key and **never** the feed code. Appointment date, time, transport preferences and valuation address are carried in `message`, not invented API fields. Property requests retain `listingId`. A successful UI requires a valid API `inquiry.id` confirmation. Failed submissions keep entered values; unchanged retries retain their key, and changing the payload creates a fresh key. A viewing request is an enquiry, not a confirmed calendar appointment.

## Unsupported information and features

- This individual feed supplies no organization/agency identity, career transaction value, seller performance statistics or testimonial content. Existing value containers use `—`; the profile's original no-testimonials condition is retained. No reviews/ratings are synthesized.
- HVAC, garage spaces, HOA charges, lot dimensions and construction/handover years are not supplied in the inspected listing response. Their original containers show unavailable values.
- Brochure download and request controls have been removed from property pages and modals. The profile's Bayut and Property Finder links open the configured broker profiles in new tabs.
- The original “AI Search” control performs immediate keyword matching across actual listing text and amenities. Its dialog states that AI interpretation is unavailable. There is no simulated AI delay or external AI service.
- No exchange-rate feed, newsletter subscription service, calendar booking, chauffeur fulfillment or valuation computation is added. Existing viewing/valuation preferences are enquiries only.
- Existing unrelated editorial/marketing pages, blog articles, decorative imagery, animations and FAQ structure remain. Their copy should be reviewed by the operator before publication; the broker API is not an editorial CMS.

## Rotate the code

An authorized operator issues/rotates the individual broker code in Admin Console, updates `BROKBUDDY_BROKER_CODE` only in the server runtime, and restarts the Node process. Rotation invalidates the previous code; verify the new feed and the old code's denial. Do not log or publish either code. No rotation was performed here.

## Verification

```sh
npm test
npm run test:browser
npm run typecheck
npm run build
node tests/capture-visuals.mjs
```

The browser suite uses Playwright Chromium. On a fresh machine, install it with `node node_modules/@playwright/test/cli.js install chromium`. All browser-test submissions are intercepted, and server submission tests use synthetic upstream responses. They do not create real leads.

Original desktop (1440×1000) and mobile (390×844) screenshots, source hashes, page/control inventories, integrated captures and comparison reports live in ignored `.verification/`. `tests/capture-visuals.mjs` reads the live feed once and freezes that verified response only in the browser test's route interception so screenshots have consistent content. It never changes the app's runtime fetching/caching behavior. The original compiled stylesheet fingerprint and all existing component className expressions are compared separately from content. See [VERIFICATION.md](VERIFICATION.md) for the completed audit and its limits.
