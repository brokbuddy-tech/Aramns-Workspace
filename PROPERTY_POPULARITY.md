# Property popularity integration

Novalux consumes a template-independent public broker API. Its design and routing
are local choices; other broker website templates can use the same backend contract.
Existing server-only `BROKBUDDY_API_BASE_URL`, `BROKBUDDY_BROKER_PROFILE_SLUG` and
`BROKBUDDY_BROKER_CODE` settings continue to select and authenticate the broker.

- Feed collection and detail listings carry `viewCount` (including zero), `areaId`
  and `createdAt`. `server/brokbuddy.mjs` preserves those values for the browser.
- The mounted ACTIVE detail page waits two continuously visible seconds. It uses
  a cross-tab Web Lock to provision an HttpOnly anonymous cookie with
  `POST /api/visitor`, then posts `{"visibleDurationMs":2000}` to the same-origin
  `POST /api/property-views/{id}` proxy. Hidden pages, prefetch and cards never
  initiate tracking. Browsers without Web Locks skip analytics and keep browsing.
- The server adds the anonymous cookie UUID and private broker code when calling
  `POST /api/public/broker-template/{slug}/listings/{id}/views`. It forwards the
  original User-Agent and marks broker/admin previews, without forwarding tokens.
  The backend enforces a rolling 24-hour window and atomic persistence. Errors
  never prevent the page from loading.
- Hottest deals sorts all filtered inventory by view count descending, creation
  date descending and ID ascending. Latest sorts only by creation date and ID.
  When an older feed lacks counts, Hottest deals is disabled and requested
  popularity falls back to Latest.
- Popular areas sits above the results search bar. It groups the complete
  filtered inventory before card pagination using API area IDs, ranks by views,
  listing count and name, and preserves advanced filters and Buy/Rent paths in
  real results links. Its `quickLinksLimit` component prop defaults to six.
  Loading uses the existing feed skeleton; empty searches show no invented totals.

The backend also offers the reusable
`GET /api/public/broker-template/{slug}/popular-areas?transactionType=RENT&limit=6`
endpoint for templates that filter and paginate on the server. Novalux groups its
already complete inventory locally so all of its additional UI-only filters
remain consistent with link counts.

Deploy the BrokBuddy migration
`20261113210000_verified_public_listing_views` before the updated API, followed by
the template. Verified counters start at zero, preserving old imported metrics
separately. Full API payloads and migration instructions are documented in
`services/api/docs/broker-public-template.md` in the BrokBuddy API repository.

Run `npm test`, `npm run build`, `npm run typecheck`, and `npm run test:browser`.
The API repository's isolated real-browser verification can also exercise this
production bundle and the real proxy against temporary PostgreSQL:

```sh
cd /home/rithsomware/brokbuddy-V1-Rebuild/services/api
POPULARITY_TEMPLATE_DIR=/home/rithsomware/Desktop/Novalux node scripts/test-property-popularity-integration.mjs
```
