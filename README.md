# NOVALUX — Luxury Real Estate Web Application

An ultra-luxury real estate web application inspired by the modern, minimalist aesthetics of high-end Framer templates (like Novalux). Built with React, Tailwind CSS, Lucide icons, and modern micro-interactions.

---

## 1. Design System & Visual Identity

### Color Palette
- **Primary Background**: Obsidian Dark (`#0A0B0D`) with Off-White / Warm Cream (`#FAFAFA`) for high-contrast thematic contrast sections.
- **Accent & Primary CTAs**: Warm Bronze / Brushed Gold (`#C5A059` and `#D4AF37`) paired with Deep Charcoal (`#1A1C20`).
- **Surface Cards**: Glassmorphic and elevated surfaces (`#14161A` with 1px border `rgba(255, 255, 255, 0.08)`).
- **Typography Colors**: Pure White (`#FFFFFF`) for primary headings, Muted Silver (`#94A3B8`) for body/secondary text, and Dark Charcoal (`#111827`) on light sections.

### Typography
- **Headings & Display**: Serif display fonts (*Cormorant Garamond* & *Playfair Display*) with tight tracking (`-0.02em` / `-0.03em`) and sophisticated luxury weight.
- **Body & UI Text**: *Plus Jakarta Sans* / *Inter* for optimal legibility at 14px–16px with 1.6 line-height.

### Micro-Interactions & Styling
- **Border Radius**: Modern subtle curves (`8px` for media cards, `24px` for container sections, pills/capsules for tags).
- **Subtle Inner Borders**: 1px translucent borders (`rgba(255, 255, 255, 0.1)`) instead of heavy outer drop shadows.
- **Animations**: Ambient photographic transitions, subtle scale-up on hover (`1.02x transform`), slide-up actions, and toast feedback.

---

## 2. Page Structure & Section Breakdown

1. **Sticky Navigation Bar (`Navbar.jsx`)**:
   - Floating glassmorphic header (`backdrop-filter: blur(16px)`, `rgba(10, 11, 13, 0.82)`).
   - Brand Logo: "NOVALUX" in refined serif display with a minimal gold geometric icon accent.
   - Center Links: Home, Featured Listings, Neighborhoods, Why Novalux, Agents, Sell With Us.
   - Right CTAs: "Schedule Viewing" (glass pill outline) and "Contact Agent" (solid warm bronze pill button), plus persistent Saved Estates counter pill.
   - Mobile responsive menu drawer.

2. **Hero Section (`Hero.jsx`)**:
   - Full-viewport (100vh) split dynamic layout with gradient overlays.
   - Architectural photography slider with auto-rotation, pause/play, slide indicators, and active estate micro-badge.
   - Eyebrow Badge: `"EXCLUSIVITY DEFINED — LUXURY REAL ESTATE"` in uppercase gold tracking.
   - Main Headline: `"Architectural Masterpieces Designed for Extraordinary Living."` (64px Display Serif).
   - Integrated Floating Search / Filter Card:
     - Prime Location Dropdown
     - Property Type Dropdown (Villas, Penthouses, Waterfront, Historic)
     - Price Range Slider ($10M - $60M+)
     - Suite Count Selector + "Find Properties" CTA (live filters and scrolls to properties).

3. **Key Stats / Trust Bar (`KeyStats.jsx`)**:
   - Clean 4-column horizontal grid below hero with gold micro-accents:
     - `$2.4B+` in Completed Transactions
     - `150+` Exclusive Off-Market Estates
     - `98%` Client Retention Rate
     - `12` Global Metropolitan Hubs

4. **Curated Portfolio CMS Grid (`FeaturedProperties.jsx` & `PropertyCard.jsx`)**:
   - Split-alignment header with category filter tabs: `[ All | Villas | Penthouses | Waterfront | Historic ]`.
   - 3-Column responsive card grid with 4:3 aspect-ratio media containers, multi-photo carousel, status badges (*Exclusive*, *Pending*, *Off-Market*), favorite heart toggles, price in bold, and slide-up `"View Property Archive"` CTA.
   - Full **Property Detail Modal (`PropertyDetailModal.jsx`)** with multi-image gallery view, architectural narrative, comprehensive specifications, curated amenity badges, inline private showing booking form, and direct advisor contact.

5. **Neighborhood / Location Discovery (`Neighborhoods.jsx`)**:
   - Asymmetric Bento Grid layout.
   - Full-card atmospheric background photography for Malibu, Manhattan, Aspen, Côte d'Azur, and Lake Como.
   - Visual hover state: tiles subtly expand and reveal active listing counts and average values.
   - Clicking any neighborhood instantly filters the portfolio to that enclave.

6. **Why Novalux / Value Proposition (`WhyNovalux.jsx`)**:
   - 50/50 container layout with high-resolution architectural crop on the left.
   - Interactive feature accordion on the right:
     1. Off-Market Access (Private collection shielded from public MLS)
     2. Concierge Advisory (End-to-end legal, cross-border tax, and asset stewardship)
     3. Bespoke Virtual Walkthroughs (4K 3D photogrammetry & spatial storytelling)
     4. Global Private Syndicate (Discreet buyer matching across 12 financial capitals)

7. **Agent / Advisor Profiles (`Agents.jsx`)**:
   - 4-column showcase of top luxury advisors with portraits, titles, regions, career volumes, direct phone & email links, and direct modal consultation trigger.

8. **Client Testimonials (`Testimonials.jsx`)**:
   - High-contrast warm off-white (`#FAFAFA`) surface with dark charcoal (`#111827`) typography.
   - Large display serif quotes, client portraits, verified transaction badges, and interactive testimonial tabs.

9. **Lead Generation & "Sell With Us" (`SellWithUs.jsx`)**:
   - Dark charcoal background with ambient radial gold glow effect.
   - Split layout with confidential advisory narrative on the left and a minimalist private valuation inquiry card on the right (Full Legal Name, Confidential Email, Property Address, Estimated Value bracket, Target Discretion mode, and celebration confetti submission).

10. **Footer (`Footer.jsx`)**:
    - Upper Footer: Newsletter signup (*"Stay updated with exclusive market insights"*).
    - Main 4-column directory: Brand & Overview, Navigation, Global Enclaves, Private Client Desk.
    - Bottom bar: Copyright, social media vectors (Instagram, LinkedIn, YouTube), and Back-to-Top floating pill.

11. **Interactive Modals & Drawers**:
    - `ScheduleViewingModal.jsx`: Full showing appointment scheduler with time slot and concierge transfer options.
    - `ContactAgentModal.jsx`: Encrypted inquiry dispatch to individual senior partners.
    - `FavoritesDrawer.jsx`: Slide-in drawer showing saved estates, cumulative portfolio valuation, and quick viewing scheduling.
    - `Toast.jsx`: Real-time feedback toast notifications for actions across the app.

---

## 3. Getting Started

### Prerequisites
- Node.js (v18+ or v20+)
- npm

### Installation & Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```
The application will be running at `http://127.0.0.1:3000/`.

## BrokBuddy server integration

This template now requires its Node server for broker data and enquiries. See [integration setup, environment settings, deployment prerequisites and limitations](docs/INTEGRATION.md) and the [verification report](docs/VERIFICATION.md). Run `npm run dev` locally, or `npm run build` followed by `npm start` for production. Real environment files must stay server-only and out of source uploads.
