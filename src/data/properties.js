export const PROPERTY_CATEGORIES = [
  "All",
  "Villas",
  "Penthouses",
  "Waterfront",
  "Historic"
];

export const PROPERTY_MARKET_CATEGORIES = [
  { 
    id: "all", 
    label: "All Listings", 
    path: "/properties",
    headline: "Curated Luxury Real Estate Portfolio",
    description: "Browse our complete collection of Dubai's most prestigious residences, waterfront villas, and trophy sky palaces available for purchase and lease."
  },
  { 
    id: "buy", 
    label: "Buy", 
    path: "/properties/buy",
    headline: "Luxury Estates & Residences For Sale",
    description: "Browse Dubai's most coveted private estates, waterfront villas, and landmark penthouses available for immediate ownership."
  },
  { 
    id: "rent", 
    label: "Rent", 
    path: "/properties/rent",
    headline: "Exclusive High-End Residences For Lease",
    description: "Discover fully serviced designer sky palaces, beachfront retreats, and panoramic city suites for premier annual leasing."
  }
];

// Populated only after the same-origin server verifies the configured broker.
export let PROPERTIES = [];
export function setProperties(properties) { PROPERTIES = properties; }
