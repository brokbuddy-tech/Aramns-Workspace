// Map Areas and Geographic Coordinates for Novalux Luxury Real Estate

export const MAP_AREAS = [
  {
    id: "all",
    name: "All Areas",
    center: [25.1500, 55.2300],
    zoom: 11,
    tagline: "Explore all premier UAE residences"
  },
  {
    id: "palm-jumeirah",
    name: "Palm Jumeirah",
    center: [25.1220, 55.1320],
    zoom: 13,
    tagline: "World Wonder Enclave & Beachfront Fronds"
  },
  {
    id: "downtown-dubai",
    name: "Downtown Dubai",
    center: [25.1972, 55.2744],
    zoom: 14,
    tagline: "Burj Khalifa, Opera & Sky Palaces"
  },
  {
    id: "dubai-marina",
    name: "Dubai Marina",
    center: [25.0805, 55.1403],
    zoom: 14,
    tagline: "Riviera Living, Yacht Harbor & Towers"
  },
  {
    id: "difc",
    name: "DIFC",
    center: [25.2100, 55.2800],
    zoom: 14,
    tagline: "Global Financial Epicenter & Trophy Floors"
  },
  {
    id: "jumeirah-bay",
    name: "Jumeirah Bay Island",
    center: [25.2120, 55.2410],
    zoom: 14,
    tagline: "Bulgari Resort Seahorse Island"
  },
  {
    id: "emirates-hills",
    name: "Emirates Hills",
    center: [25.0740, 55.1765],
    zoom: 14,
    tagline: "Montgomerie Fairway Estates"
  },
  {
    id: "business-bay",
    name: "Business Bay",
    center: [25.1860, 55.2660],
    zoom: 14,
    tagline: "Canal Front & Architectural Towers"
  },
  {
    id: "al-barari",
    name: "Al Barari",
    center: [25.0970, 55.3160],
    zoom: 14,
    tagline: "Lush Botanical Green Sanctuary"
  },
  {
    id: "district-one",
    name: "District One",
    center: [25.1660, 55.2980],
    zoom: 14,
    tagline: "Crystal Lagoons & MBR City"
  },
  {
    id: "bluewaters-island",
    name: "Bluewaters Island",
    center: [25.0792, 55.1225],
    zoom: 15,
    tagline: "Ain Dubai & Island Luxury"
  },
  {
    id: "saadiyat-island",
    name: "Saadiyat Island",
    center: [24.5360, 54.4320],
    zoom: 13,
    tagline: "Louvre Abu Dhabi Cultural Beachfront"
  }
];

export const PROPERTY_COORDINATES = {
  "prop-1": { lat: 25.1228, lng: 55.1325 },        // Frond G, Palm Jumeirah
  "prop-2": { lat: 25.0740, lng: 55.1765 },        // Sector E, Emirates Hills
  "prop-5": { lat: 24.5420, lng: 54.4350 },        // Saadiyat Beach Villas, Abu Dhabi
  "prop-6": { lat: 25.2135, lng: 55.2425 },        // Bulgari Resort Enclave, Jumeirah Bay
  "prop-buy-1": { lat: 25.1650, lng: 55.2980 },    // District One, MBR City
  "prop-buy-2": { lat: 25.0985, lng: 55.3175 },    // The Residences, Al Barari
  "prop-3": { lat: 25.1935, lng: 55.2730 },        // Opera District, Downtown Dubai
  "prop-4": { lat: 25.0865, lng: 55.1448 },        // Marina Gate 1, Dubai Marina
  "prop-rent-1": { lat: 25.1378, lng: 55.1275 },   // Atlantis The Royal, Palm Jumeirah
  "prop-rent-2": { lat: 25.2285, lng: 55.2865 },   // One Za'abeel Tower, Za'abeel
  "prop-rent-3": { lat: 25.0792, lng: 55.1225 },   // Bluewaters Residences
  "prop-buy-3": { lat: 25.2110, lng: 55.2395 },    // Jumeirah Bay Island
  "prop-buy-4": { lat: 25.0955, lng: 55.3140 },    // Seventh Heaven, Al Barari
  "prop-rent-4": { lat: 25.1972, lng: 55.2744 },   // Armani Residence, Burj Khalifa
  "prop-rent-5": { lat: 25.1195, lng: 55.1370 }    // Frond J, Palm Jumeirah
};

export const CURRENCY_OPTIONS = [
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', rate: 3.6725, flag: '🇦🇪' },
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1.0, flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92, flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.79, flag: '🇬🇧' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', rate: 3.75, flag: '🇸🇦' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 84.15, flag: '🇮🇳' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', rate: 0.89, flag: '🇨🇭' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', rate: 1.38, flag: '🇨🇦' },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar', rate: 1.52, flag: '🇦🇺' },
  { code: 'SGD', symbol: 'SG$', name: 'Singapore Dollar', rate: 1.32, flag: '🇸🇬' },
  { code: 'QAR', symbol: 'QAR', name: 'Qatari Riyal', rate: 3.64, flag: '🇶🇦' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', rate: 7.24, flag: '🇨🇳' }
];

export const getPropertyCoordinates = (id) => {
  return PROPERTY_COORDINATES[id] || { lat: 25.1500, lng: 55.2300 };
};

export const formatPriceShort = (price, isRent = false, currencyCode = 'AED') => {
  const curr = CURRENCY_OPTIONS.find(c => c.code === currencyCode) || CURRENCY_OPTIONS[0];
  const converted = price * curr.rate;
  const prefix = curr.code === 'USD' 
    ? '$' 
    : curr.code === 'EUR' 
      ? '€' 
      : curr.code === 'GBP' 
        ? '£' 
        : curr.code === 'INR' 
          ? '₹' 
          : `${curr.code} `;

  if (isRent) {
    if (curr.code === 'INR') {
      const lakhs = (converted / 100000).toFixed(1).replace(/\.0$/, '');
      return `₹${lakhs}L / year`;
    }
    const thousands = Math.round(converted / 1000);
    return `${prefix}${thousands.toLocaleString()}K / year`;
  }

  if (curr.code === 'INR') {
    const cr = (converted / 10000000).toFixed(1).replace(/\.0$/, '');
    return `₹${cr} Cr`;
  }

  if (converted >= 1000000000) {
    const b = (converted / 1000000000).toFixed(1).replace(/\.0$/, '');
    return `${prefix}${b}B`;
  }

  if (converted >= 1000000) {
    const m = (converted / 1000000).toFixed(1).replace(/\.0$/, '');
    return `${prefix}${m}M`;
  }

  return `${prefix}${Math.round(converted / 1000)}K`;
};
