# Integration verification — 2026-11-12

The configured live broker feed was verified successfully with **27 active listings in AED**. The same-origin production detail request returned the requested broker-scoped listing. Real enquiry POSTs were not used during verification.

## Checks completed

| Check | Result |
| --- | --- |
| `npm test` | 13 server/contract tests passed |
| `npm run test:browser` | 10 browser tests passed against development and production; final production run recorded in `.verification/browser-results.json` |
| `npm run typecheck` | Passed |
| `npm run build` | Passed; Vite retains its large-bundle advisory |
| Original screenshots | 18 source-page captures at 1440×1000 and 390×844, before UI edits, plus 2 existing-dist captures |
| Integrated screenshots | 16 captures at the same sizes across profile/home, inventory, rental detail, contact, sell, advisors, about and map |
| Browser errors / overflow | None in the completed 16-view audit |
| Credential checks | No credential found in audited browser requests/responses or production assets |
| Existing component class expressions | No added/removed `className` expressions in the modified existing components |
| Styles and assets | Original CSS, Tailwind/PostCSS/Vite configuration and all public assets unchanged |

Server coverage includes complete three-page inventory versus a partial profile preview, exact broker ownership, direct details, missing details, duplicate/truncated/malformed feeds, valid empty inventory versus authorization failures, server-only headers, no-store/timeout/redirect behavior, numeric prices and source currencies, unique gallery images, safe errors, origin/MIME/body-size validation, and code-free inquiry POSTs with idempotent retry context.

Browser coverage includes existing search, location/type/price/bedroom/amenity filters, sorting, load-more across the final inventory page, card navigation, direct details, galleries/lightbox, rental calculator suppression, missing/empty/unavailable states, contact errors/success, preserved input and retry keys, property viewing context, consultation/scheduler/valuation forms, all four rich-text formats with unsafe markup stripping, mobile menu and map matching. All submissions are mocked.

## Visual comparison

The original source was inventoried before edits, with its page headings, controls, geometry and hashes saved in `.verification/original/`. Integrated captures use one freshly verified public feed snapshot inside the test browser only, so the comparison remains consistent without repeated upstream reads. Runtime requests remain uncached and authenticated by the server.

The captured mobile/desktop profile, inventory, contact, rental detail and map views were compared side by side. There are ten comparison PNGs in `.verification/`. Navigation and primary heading geometry matched exactly on 14 views sharing the original routes. The unchanged desktop contact-form crop was pixel-identical over 739,200 pixels; the corresponding mobile crop differed at 8 of 354,900 pixels using a per-channel difference threshold of 10. This is evidence for those regions, not a claim that every dynamic full-page image is pixel-identical.

The compiled stylesheet keeps the original Vite content fingerprint `index-CvW8cMMw.css`. The source stylesheet and all original component class expressions are also unchanged. No unrelated layout/style differences were found in the reviewed captures. Changes visible in content are the actual broker portrait/contact details/biography/BRN, real listing text/photos/prices/counts, unavailable facts, and the profile's pre-existing no-testimonials behavior. Mobile subtitle wrapping and page height change with the actual content.

The live inventory currently contains rentals only. Sale detail/mortgage behavior is covered by synthetic contract/browser fixtures; no live sales inventory is invented. Original property detail URLs used demo IDs, so the live rental detail is compared as the same component with actual IDs/content, rather than as an identical URL/data record. Offscreen lazy images can remain unloaded in full-page screenshots; a separate live-image check confirmed the visible broker/property API images returned successfully.

## Files changed

New server integration:

- `server/index.mjs`, `server/http.mjs`, `server/brokbuddy.mjs`
- `src/lib/broker-feed.js`, `src/lib/inquiry.js`
- `src/components/RichText.jsx`, `src/components/InquiryError.jsx`

Existing data/routing bindings:

- `src/App.jsx`, `src/data/agents.js`, `src/data/properties.js`
- `src/components/AgentDetailPage.jsx`, `AgentsDirectoryPage.jsx`
- `src/components/PropertyCard.jsx`, `PropertyCategoryPage.jsx`, `PropertyDetailPage.jsx`, `PropertyDetailModal.jsx`, `PropertyMapPage.jsx`
- `src/components/Navbar.jsx`, `Footer.jsx`, `FavoritesDrawer.jsx`, `MortgageCalculator.jsx`
- `src/components/ContactPage.jsx`, `ContactAgentModal.jsx`, `ScheduleViewingModal.jsx`, `SellPropertyPage.jsx`, `AboutUsPage.jsx`

Configuration, tests and documentation:

- `package.json`, `package-lock.json`, `tsconfig.json`, `index.html` (neutral/verified metadata)
- `.env.example`, `.gitignore`, `.dockerignore`, `.vercelignore`
- `playwright.config.mjs`, `tests/`, `README.md`, `docs/INTEGRATION.md`, this report
- Local `.env` populated from operator-supplied settings and excluded from Git/deployment uploads

## Original files confirmed unchanged

`src/index.css`, `src/main.jsx`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, and every existing `public/` asset are byte-for-byte unchanged from the saved baseline.

These original component files also remain byte-for-byte unchanged: `Agents.jsx`, `BackToTop.jsx`, `BlogArchivePage.jsx`, `BlogCard.jsx`, `BlogDetailPage.jsx`, `BlogSection.jsx`, `FAQ.jsx`, `FeaturedProperties.jsx`, `Hero.jsx`, `KeyStats.jsx`, `Neighborhoods.jsx`, `SellWithUs.jsx`, `Testimonials.jsx`, `Toast.jsx`, `VisionCTA.jsx`, `WhoWeAre.jsx`, `WhyNovalux.jsx`, and the existing `ui/` components. Original blog, neighborhood, map and testimonial data modules and `src/lib/utils.ts` are unchanged. Dormant template components remain dormant; no new UI was inserted to expose them.

Full source comparisons are recorded in `.verification/source-comparison.json` and `.verification/component-class-comparison.json`.

## Remaining operational prerequisites and limits

See [INTEGRATION.md](INTEGRATION.md) for server settings, publication/migration prerequisites, canonical-domain registration and code rotation. The local feed and images currently work. Production requires a Node runtime, server-only environment settings and the intended canonical website origin saved in BrokBuddy Branding. No production deployment, settings update, migration, code rotation, commit or push was performed.

Unsupported broker/agency statistics, testimonial content, property facts, brochure downloads, portal profile links, exchange-rate conversion, AI interpretation, newsletter delivery and actual calendar/transport/valuation fulfillment are documented there. Missing facts use the original containers and unavailable/empty behavior. The source checkout does not expose usable Git repository metadata, so preservation was verified using saved source hashes instead of a Git diff.
