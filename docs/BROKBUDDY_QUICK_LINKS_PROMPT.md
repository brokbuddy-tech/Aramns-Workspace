# Prompt for BrokBuddy: persistent UAE quick-link popularity

Implement the following API/database change in the BrokBuddy backend. The Novalux website integration is prepared for this exact contract. Inspect the existing schema, public broker-template routes, publication checks and property-view analytics first, and reuse their conventions. Preserve existing responses and permissions.

## Required behavior

The website groups the broker's complete active inventory by UAE location and shows location quick-link cards. Initially, cards sort by active listing quantity descending. Once cards receive clicks, they sort by **quick-link click count** descending, then active listing quantity descending, then name and ID for deterministic ties. All-zero counts naturally retain the initial listing-count ordering; no manual launch switch is required.

Clicks are activations of the location cards, including keyboard and new-tab activation. They are separate from property-detail views. Never derive these counts from listing `viewCount`. Persist accepted click totals across visitors, server restarts and deployments. Use all-time totals for this version, scoped to the individual broker; no global agency or sibling-broker aggregation.

## Location identity

Use the listing's non-empty, trimmed `areaId` if present. Where legacy listings have no ID, match the website's exact fallback:

```js
const normalize = value => String(value || '').trim().replace(/\s+/gu, ' ').toLowerCase();
const id = String(listing.areaId || '').trim()
  || JSON.stringify([normalize(listing.city), normalize(listing.community)]);
```

The public listing's `community` maps to the website's `neighborhood`. Do not merge identically named communities in different cities. Missing community may fall back to a city-only card, retaining the same ID formula with an empty community. Skip locations with neither city nor community. Return `country` as a string when available (ISO `AE` preferred); explicit non-UAE countries are excluded by the website. Legacy listings without country are assumed to belong to this UAE inventory.

Keep this identity stable for a given location. If introducing a canonical area table or backfilling `areaId`, migrate existing fallback click totals to the new identity transactionally; do not silently reset or split them. Use the same identity resolver for reads, writes and active-inventory validation.

## Read contract — extend the existing broker profile

Extend the existing authenticated, broker-scoped response:

```http
GET /api/public/broker-template/:slug
X-BrokBuddy-Broker-Code: <server-only configured broker code>
```

Preserve all existing fields and add the optional field:

```json
{
  "quickLinkClicks": [
    { "id": "canonical-area-id", "clickCount": 23 },
    { "id": "[\"dubai\",\"dubai marina\"]", "clickCount": 8 }
  ]
}
```

Return counts for all eligible active locations across the complete broker inventory, not just the small profile preview. IDs are strings of 1–512 characters; counts are non-negative JavaScript-safe integers; each ID occurs at most once. Zero-count locations may be omitted. Return only `{id, clickCount}` for each area. Never expose visitor IDs, individual events, credentials, internal tenant data or analytics for unavailable/sibling listings. If optional analytics storage is temporarily unavailable, the feed must remain usable, omitting this field or returning `[]` while reporting the analytics failure internally.

The website computes listing quantities from the complete, validated inventory before UI pagination. It applies category and search filters locally, and uses these shared broker/location click totals to rank the remaining cards. Do not introduce a separate GET endpoint: the website reads this profile field already.

## Write contract — add a broker-scoped analytics route

```http
POST /api/public/broker-template/:slug/quick-link-clicks
X-BrokBuddy-Broker-Code: <server-only configured broker code>
Content-Type: application/json
User-Agent: <forwarded visitor user agent>
x-brokbuddy-preview: false
```

```json
{
  "areaId": "[\"dubai\",\"dubai marina\"]",
  "eventId": "c22e18ee-2002-4acf-aad2-ac34de3e816d",
  "visitorId": "622e18ee-2002-4acf-aad2-ac34de3e816d"
}
```

Validate an exact JSON contract, bounded body size, `areaId` length/control characters and UUIDs. Reuse the existing public-template code, publication, origin and broker ownership checks. Resolve the target only against that broker's eligible active UAE inventory; reject invented areas and areas belonging only to another broker or unpublished/sold/rented listings. Do not require a property listing ID: this event is for a location card. Existing asset, inquiry and property-view endpoints must keep their current behavior.

Use `eventId` as the idempotency key within the broker's scope. Concurrent requests and retries with the same event ID increment the total at most once. A repeat using a different location must never increment a second location. Record a distinct legitimate activation with a fresh event ID as a new click; there is no one-click-per-visitor-per-day rule in this contract. Reuse bot detection and reasonable abuse/rate limits from property-view analytics, adapting them to card activations. Preview/admin/authenticated-owner traffic must not increment counts; honor `x-brokbuddy-preview: true`. Return `204 No Content` for accepted, duplicate or deliberately ignored analytics events; return safe 4xx for invalid/unauthorized requests, and `429` for rate limits. Never report acceptance when a required database write failed.

The Novalux browser sends only `{areaId, eventId}` to its same-origin `POST /api/quick-link-clicks` endpoint. Its Node proxy validates Origin/body, derives/provisions an HttpOnly visitor cookie, and adds `visitorId`, broker credentials and preview metadata server to server. Browser code never receives the broker code. This POST is best effort and navigation-safe; upstream analytics failure must not prevent opening the listings page.

## Database and migration

Design the smallest durable schema consistent with existing analytics. Persist a broker/location aggregate with a unique `(brokerId, areaKey)` index, and persist event deduplication with a unique `(brokerId, eventId)` constraint. Use foreign keys/tenant scoping consistent with the codebase. Deduplication and atomic count increment must share a transaction so concurrent events cannot lose increments or count duplicates. Do not store per-listing view counts as quick-link clicks. Choose a count type that cannot silently overflow, and serialize safe integers.

Include an additive migration and any generated client updates. Existing locations start at zero. Do not execute a production migration or change publication settings/credentials while implementing. Document deployment order: migration, backend deployment, then verify the website's profile response and click writes. Preserve existing counts when there are temporarily no active listings in an area, while omitting those areas from the public response.

## Verification and handoff

Add meaningful API/service/database tests covering:

- No-click profile and backward compatibility; all areas included beyond the profile preview/pagination.
- Different cities with the same community; canonical IDs and exact legacy fallback IDs; city-only listings and explicit non-UAE locations.
- Broker/publication isolation, fabricated IDs and inactive/unpublished areas.
- Replayed events, concurrent duplicate events, concurrent different events and atomic increments.
- Preview/admin/bot suppression, bounded input and rate limits.
- Durable counts after service restart; failed writes never acknowledged as accepted; optional read failures do not break the inventory feed.
- Click totals remain independent of listing-detail views and survive the transition from fallback to canonical area IDs.

Return the implementation summary, migration files, response examples, tests run, and deployment steps. Flag any required contract adjustment before changing the shape expected by Novalux.
