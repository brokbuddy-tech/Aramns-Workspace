import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, SlidersHorizontal, X, ArrowUpDown, MapPin, 
  Building2, Home, Key, Sparkles, Filter, ChevronRight,
  RotateCcw, Check, PhoneCall, ShieldCheck, Layers, Bot, Send
} from 'lucide-react';
import PropertyCard from './PropertyCard';
import {plainText} from './RichText';
import { PROPERTY_MARKET_CATEGORIES } from '../data/properties';

export default function PropertyCategoryPage({
  category = 'buy',
  properties = [],
  favorites = [],
  onToggleFavorite,
  onSelectProperty,
  onNavigate,
  onContactClick
}) {
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedPriceRange, setSelectedPriceRange] = useState('All');
  const [selectedBeds, setSelectedBeds] = useState('All');
  const [selectedAmenity, setSelectedAmenity] = useState('All');
  const [sortBy, setSortBy] = useState('featured');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // AI Description Search States
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiDescription, setAiDescription] = useState('');
  const [activeAiPrompt, setActiveAiPrompt] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);

  // Curated Luxury Amenities Options
  const amenityOptions = useMemo(() => [
    { label: 'All Amenities', value: 'All' },
    { label: 'Private / Infinity Pool', value: 'pool' },
    { label: 'Private Beach / Beachfront', value: 'beach' },
    { label: 'Superyacht / Marina Berth', value: 'berth' },
    { label: 'Burj Khalifa / Skyline Views', value: 'view' },
    { label: 'Private Spa & Hammam', value: 'spa' },
    { label: 'Wine Cellar & Tasting Room', value: 'wine' },
    { label: 'Private Cinema Room', value: 'cinema' },
    { label: 'Smart Home Automation', value: 'smart' },
    { label: 'Private Elevator', value: 'elevator' },
    { label: '24/7 Butler & Concierge', value: 'butler' }
  ], []);

  // Quick Inspiration Prompts for Description Search
  const aiInspirations = useMemo(() => [
    { text: "Beachfront villa with private white sand beach and infinity pool", tag: "Waterfront" },
    { text: "High-floor penthouse with direct Burj Khalifa view and private elevator", tag: "Penthouse" },
    { text: "Modernist estate with private yacht mooring and sunset terrace", tag: "Yacht Dock" },
    { text: "Sanctuary villa with botanical garden, wine cellar, and wellness spa", tag: "Wellness" },
    { text: "Branded residence with 24/7 butler service and private chef dining", tag: "Butler Service" }
  ], []);

  // Stop words for AI Tokenizer
  const stopWords = useMemo(() => new Set([
    'a', 'an', 'the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'with', 
    'of', 'is', 'are', 'was', 'were', 'by', 'from', 'as', 'that', 'this', 
    'it', 'its', 'my', 'your', 'our', 'their', 'want', 'looking', 'need', 
    'like', 'would', 'some', 'any', 'me', 'i', 'find', 'show', 'properties', 'property'
  ]), []);

  // AI Semantic Relevance Scorer
  const getAiScore = (property, promptText) => {
    if (!promptText.trim()) return 0;
    const tokens = promptText
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));

    if (tokens.length === 0) return 0;

    const fullText = [
      property.title || '',
      plainText(property.description),
      property.headline || '',
      property.location || '',
      property.neighborhood || '',
      property.cityState || '',
      property.propertyType || '',
      property.category || '',
      (property.amenities || []).join(' ')
    ].join(' ').toLowerCase();

    let score = 0;
    tokens.forEach(token => {
      if (fullText.includes(token)) {
        score += 1;
        if ((property.title || '').toLowerCase().includes(token)) score += 2;
        if ((property.amenities || []).some(a => a.toLowerCase().includes(token))) score += 1.5;
      }
    });

    return score;
  };

  // Scroll to top when category changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Reset filters on category switch for fresh context
    setSearchQuery('');
    setSelectedLocation('All');
    setSelectedType('All');
    setSelectedPriceRange('All');
    setSelectedBeds('All');
    setSelectedAmenity('All');
    setActiveAiPrompt('');
    setAiDescription('');
    setSortBy('featured');
    setVisibleCount(6);
  }, [category]);

  // Reset pagination when active filter inputs change
  useEffect(() => {
    setVisibleCount(6);
  }, [searchQuery, selectedLocation, selectedType, selectedPriceRange, selectedBeds, selectedAmenity, activeAiPrompt, sortBy]);

  // Current category metadata
  const currentCategoryMeta = useMemo(() => {
    return PROPERTY_MARKET_CATEGORIES.find(c => c.id === category) || PROPERTY_MARKET_CATEGORIES[0];
  }, [category]);

  // Base properties belonging to this category
  const baseCategoryProperties = useMemo(() => {
    return properties.filter(p => {
      if (category === 'buy') {
        return p.marketCategory === 'buy' || p.listingType === 'FOR SALE';
      }
      if (category === 'rent') {
        return p.marketCategory === 'rent' || p.listingType === 'FOR RENT';
      }
      if (category === 'off-plan') return p.readiness === 'OFFPLAN';
      if (category === 'commercial') return /commercial/i.test(p.category);
      return true;
    });
  }, [properties, category]);

  // Available unique locations for current category
  const availableLocations = useMemo(() => {
    const locs = new Set();
    baseCategoryProperties.forEach(p => {
      if (p.neighborhood) locs.add(p.neighborhood);
      else if (p.cityState) locs.add(p.cityState.split(',')[0].trim());
    });
    return ['All', ...Array.from(locs).sort()];
  }, [baseCategoryProperties]);

  // Available unique types for current category
  const availableTypes = useMemo(() => {
    const types = new Set();
    baseCategoryProperties.forEach(p => {
      if (p.category) types.add(p.category);
    });
    return ['All', ...Array.from(types).sort()];
  }, [baseCategoryProperties]);

  const sourceCurrencies = [...new Set(baseCategoryProperties.map(p=>p.currency))];
  const priceCurrency = sourceCurrencies.length === 1 ? sourceCurrencies[0] : '';

  // Dynamic price ranges based on category
  const priceRangeOptions = useMemo(() => {
    if (category === 'rent') {
      return [
        { label: 'All Rates', value: 'All' },
        { label: `Under ${priceCurrency} 20,000`, value: 'under-20k' },
        { label: `${priceCurrency} 20,000 – 35,000`, value: '20k-35k' },
        { label: `${priceCurrency} 35,000+`, value: 'above-35k' }
      ];
    }
    return [
      { label: 'All Prices', value: 'All' },
      { label: `Under ${priceCurrency} 15 Million`, value: 'under-15m' },
      { label: `${priceCurrency} 15M – 25 Million`, value: '15m-25m' },
      { label: `${priceCurrency} 25 Million & Above`, value: 'above-25m' }
    ];
  }, [category, priceCurrency]);

  // Filter application
  const filteredProperties = useMemo(() => {
    return baseCategoryProperties.filter(p => {
      // 0. AI Natural Language Description Search Matching
      if (activeAiPrompt.trim()) {
        const score = getAiScore(p, activeAiPrompt);
        if (score === 0) return false;
        // Relevance is derived locally without changing listing data.
      }

      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = p.title?.toLowerCase().includes(q);
        const matchesLoc = p.location?.toLowerCase().includes(q);
        const matchesCity = p.cityState?.toLowerCase().includes(q);
        const matchesType = p.propertyType?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q);
        const matchesHeadline = p.headline?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesLoc && !matchesCity && !matchesType && !matchesHeadline) {
          return false;
        }
      }

      // 2. Location
      if (selectedLocation !== 'All') {
        const pLoc = p.neighborhood || p.cityState || '';
        if (!pLoc.toLowerCase().includes(selectedLocation.toLowerCase())) {
          return false;
        }
      }

      // 3. Property Sub-Type
      if (selectedType !== 'All') {
        const matchesCat = p.category === selectedType;
        const matchesPropType = p.propertyType?.toLowerCase().includes(selectedType.toLowerCase());
        if (!matchesCat && !matchesPropType) {
          return false;
        }
      }

      // 4. Price Range
      if (selectedPriceRange !== 'All' && sourceCurrencies.length === 1) {
        if (category === 'rent') {
          if (selectedPriceRange === 'under-20k' && p.price >= 20000) return false;
          if (selectedPriceRange === '20k-35k' && (p.price < 20000 || p.price > 35000)) return false;
          if (selectedPriceRange === 'above-35k' && p.price < 35000) return false;
        } else {
          if (selectedPriceRange === 'under-15m' && p.price >= 15000000) return false;
          if (selectedPriceRange === '15m-25m' && (p.price < 15000000 || p.price > 25000000)) return false;
          if (selectedPriceRange === 'above-25m' && p.price < 25000000) return false;
        }
      }

      // 5. Bedrooms
      if (selectedBeds !== 'All') {
        const minBeds = parseInt(selectedBeds, 10);
        if (typeof p.beds !== 'number' || p.beds < minBeds) return false;
      }

      // 6. Amenities Filter
      if (selectedAmenity !== 'All') {
        const q = selectedAmenity.toLowerCase();
        const hasAmenity = (p.amenities || []).some(a => a.toLowerCase().includes(q));
        if (!hasAmenity) return false;
      }

      return true;
    }).sort((a, b) => {
      // Prioritize AI relevance if AI search is active
      if (activeAiPrompt.trim() && sortBy === 'featured') {
        const diff = getAiScore(b, activeAiPrompt) - getAiScore(a, activeAiPrompt);
        if (diff !== 0) return diff;
      }
      if (sortBy === 'price-asc' && sourceCurrencies.length <= 1) return a.price - b.price;
      if (sortBy === 'price-desc' && sourceCurrencies.length <= 1) return b.price - a.price;
      if (sortBy === 'sqft-desc') return b.sqft - a.sqft;
      if (sortBy === 'beds-desc') return b.beds - a.beds;
      // Default: featured first
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    });
  }, [baseCategoryProperties, searchQuery, selectedLocation, selectedType, selectedPriceRange, selectedBeds, selectedAmenity, activeAiPrompt, sortBy, category]);

  // Check if any filter is active
  const hasActiveFilters = searchQuery !== '' || 
    selectedLocation !== 'All' || 
    selectedType !== 'All' || 
    selectedPriceRange !== 'All' || 
    selectedBeds !== 'All' ||
    selectedAmenity !== 'All' ||
    activeAiPrompt !== '';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedLocation('All');
    setSelectedType('All');
    setSelectedPriceRange('All');
    setSelectedBeds('All');
    setSelectedAmenity('All');
    setActiveAiPrompt('');
    setAiDescription('');
    setSortBy('featured');
  };

  const handleExecuteAiSearch = () => {
    if (!aiDescription.trim()) return;
    setActiveAiPrompt(aiDescription.trim());
    setIsAiModalOpen(false);
    document.getElementById('listings')?.scrollIntoView({behavior:'smooth'});
  };

  const getCategoryCount = (catId) => {
    return properties.filter(p => {
      if (catId === 'all') return true;
      if (catId === 'buy') return p.marketCategory === 'buy' || p.listingType === 'FOR SALE';
      if (catId === 'rent') return p.marketCategory === 'rent' || p.listingType === 'FOR RENT';
      return false;
    }).length;
  };

  return (
    <div className="w-full bg-[#FDFDFD] min-h-screen text-[#0A0A0C]">
      
      {/* 1. HERO & CATEGORY INTRO SECTION */}
      <section className="relative w-full bg-[#0A0A0C] text-white pt-36 pb-20 sm:pt-40 sm:pb-24 overflow-hidden border-b border-white/10">
        {/* Subtle architectural grid backdrop */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-[600px] h-[300px] bg-white/[0.03] rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 relative z-10">
          
          {/* Headline, Description & Category Switcher Tabs */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pt-2">
            <div className="max-w-3xl space-y-4">
              <h1 className="text-[36px] sm:text-[46px] lg:text-[54px] font-semibold text-white tracking-tight leading-[1.12] font-sans">
                {currentCategoryMeta.headline}
              </h1>

              <p className="text-[15px] sm:text-[17px] text-white/70 leading-[1.6] max-w-2xl font-normal">
                {currentCategoryMeta.description}
              </p>
            </div>

            {/* CATEGORY SWITCHER TABS (Buy, Rent) - Placed in the right side */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-1.5 bg-white/10 backdrop-blur-md rounded-[12px] border border-white/10 w-fit shrink-0 self-start lg:self-end">
              {PROPERTY_MARKET_CATEGORIES.map((tab) => {
                const isActive = tab.id === category;
                const count = getCategoryCount(tab.id);
                return (
                  <button
                    key={tab.id}
                    onClick={() => onNavigate(tab.path)}
                    className={`px-4 sm:px-5 py-2.5 rounded-[9px] text-[13px] sm:text-[14px] font-medium transition-all duration-200 flex items-center gap-2.5 select-none cursor-pointer ${
                      isActive
                        ? 'bg-white text-black shadow-md font-semibold scale-[1.02]'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-black text-white' : 'bg-white/20 text-white'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      {/* 2. FILTER BAR & PROPERTY LISTINGS SECTION */}
      <section id="listings" className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-12 lg:py-16 space-y-10">
        
        {/* ====================================================
            FILTER COMPONENT ON TOP OF THE LISTING SECTION
            ==================================================== */}
        <div className="bg-white border border-[#E5E7EB] rounded-[16px] shadow-sm p-4 sm:p-6 space-y-4">
          
          {/* TOP ROW: Search Bar (Left) and Description Search Button (Right Corner) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
            
            {/* Search Input (Left Side) */}
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${category} properties by name, area, or keywords...`}
                className="w-full pl-10 pr-10 py-3 bg-[#F9F9FB] border border-[#E5E7EB] rounded-[10px] text-[14px] text-[#0A0A0C] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-black p-1 cursor-pointer"
                  title="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* AI Natural Description Search Button (Right Corner) */}
            <button
              type="button"
              onClick={() => setIsAiModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-stone-900 via-black to-stone-900 hover:from-black hover:to-black text-white text-[13px] font-bold rounded-[10px] transition-all shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0 border border-white/10"
              title="Keyword matching in live listings; AI interpretation is unavailable"
            >
              <Sparkles size={16} className="text-amber-400 animate-pulse" />
              <span>AI Search</span>
            </button>
          </div>

          {/* BELOW: Other Filter Options / Dropdowns */}
          <div className="pt-2 border-t border-[#F1F3F5]">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              
              {/* Location Filter */}
              <div className="relative">
                <label className="block text-[10px] uppercase font-bold text-stone-600 mb-1 tracking-wider">
                  Location
                </label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full bg-[#F9F9FB] border border-[#E5E7EB] rounded-[8px] px-3 py-2 text-[13px] text-[#0A0A0C] font-medium focus:outline-none focus:border-black cursor-pointer truncate"
                >
                  <option value="All">All Locations</option>
                  {availableLocations.filter(loc => loc !== 'All').map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Property Type Filter */}
              <div className="relative">
                <label className="block text-[10px] uppercase font-bold text-stone-600 mb-1 tracking-wider">
                  Property Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full bg-[#F9F9FB] border border-[#E5E7EB] rounded-[8px] px-3 py-2 text-[13px] text-[#0A0A0C] font-medium focus:outline-none focus:border-black cursor-pointer truncate"
                >
                  <option value="All">All Types</option>
                  {availableTypes.filter(t => t !== 'All').map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Price Range Filter */}
              <div className="relative">
                <label className="block text-[10px] uppercase font-bold text-stone-600 mb-1 tracking-wider">
                  Price Bracket
                </label>
                <select
                  disabled={sourceCurrencies.length !== 1} title={sourceCurrencies.length !== 1 ? 'Price filters require one source currency' : undefined} value={selectedPriceRange}
                  onChange={(e) => setSelectedPriceRange(e.target.value)}
                  className="w-full bg-[#F9F9FB] border border-[#E5E7EB] rounded-[8px] px-3 py-2 text-[13px] text-[#0A0A0C] font-medium focus:outline-none focus:border-black cursor-pointer truncate"
                >
                  {priceRangeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Bedrooms Filter */}
              <div className="relative">
                <label className="block text-[10px] uppercase font-bold text-stone-600 mb-1 tracking-wider">
                  Bedrooms
                </label>
                <select
                  value={selectedBeds}
                  onChange={(e) => setSelectedBeds(e.target.value)}
                  className="w-full bg-[#F9F9FB] border border-[#E5E7EB] rounded-[8px] px-3 py-2 text-[13px] text-[#0A0A0C] font-medium focus:outline-none focus:border-black cursor-pointer truncate"
                >
                  <option value="All">Any Beds</option>
                  <option value="3">3+ Beds</option>
                  <option value="4">4+ Beds</option>
                  <option value="5">5+ Beds</option>
                  <option value="6">6+ Beds</option>
                </select>
              </div>

              {/* Amenities Filter */}
              <div className="relative">
                <label className="block text-[10px] uppercase font-bold text-stone-600 mb-1 tracking-wider">
                  Amenities
                </label>
                <select
                  value={selectedAmenity}
                  onChange={(e) => setSelectedAmenity(e.target.value)}
                  className="w-full bg-[#F9F9FB] border border-[#E5E7EB] rounded-[8px] px-3 py-2 text-[13px] text-[#0A0A0C] font-medium focus:outline-none focus:border-black cursor-pointer truncate"
                >
                  {amenityOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Sort Filter */}
              <div className="relative">
                <label className="block text-[10px] uppercase font-bold text-stone-600 mb-1 tracking-wider">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-[#F9F9FB] border border-[#E5E7EB] rounded-[8px] px-3 py-2 text-[13px] text-[#0A0A0C] font-medium focus:outline-none focus:border-black cursor-pointer truncate"
                >
                  <option value="featured">Featured First</option>
                  <option value="price-asc" disabled={sourceCurrencies.length > 1}>Price: Low to High</option>
                  <option value="price-desc" disabled={sourceCurrencies.length > 1}>Price: High to Low</option>
                  <option value="sqft-desc">Largest Sqft</option>
                  <option value="beds-desc">Most Bedrooms</option>
                </select>
              </div>

            </div>
          </div>

          {/* Active Filters Bar & Counter */}
          <div className="pt-3 border-t border-[#F1F3F5] flex flex-wrap items-center justify-between gap-3 text-[13px]">
            
            <div className="flex items-center gap-2 text-stone-600">
              <span className="font-semibold text-black">{filteredProperties.length}</span>
              <span>
                {filteredProperties.length === 1 ? 'residence' : 'properties'} found in {currentCategoryMeta.label}
              </span>
            </div>

            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2">
                {activeAiPrompt && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-semibold border border-amber-300 text-[12px] shadow-2xs">
                    <Sparkles size={12} className="text-amber-600 shrink-0" />
                    <span>Search: &ldquo;{activeAiPrompt}&rdquo;</span>
                    <button onClick={() => { setActiveAiPrompt(''); setAiDescription(''); }} className="hover:text-black cursor-pointer ml-0.5">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-stone-800 text-[12px]">
                    Keyword: "{searchQuery}"
                    <button onClick={() => setSearchQuery('')} className="hover:text-black cursor-pointer">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {selectedLocation !== 'All' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-stone-800 text-[12px]">
                    {selectedLocation}
                    <button onClick={() => setSelectedLocation('All')} className="hover:text-black cursor-pointer">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {selectedType !== 'All' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-stone-800 text-[12px]">
                    {selectedType}
                    <button onClick={() => setSelectedType('All')} className="hover:text-black cursor-pointer">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {selectedPriceRange !== 'All' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-stone-800 text-[12px]">
                    Price Filter Active
                    <button onClick={() => setSelectedPriceRange('All')} className="hover:text-black cursor-pointer">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {selectedBeds !== 'All' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-stone-800 text-[12px]">
                    {selectedBeds}+ Beds
                    <button onClick={() => setSelectedBeds('All')} className="hover:text-black cursor-pointer">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {selectedAmenity !== 'All' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-stone-800 text-[12px]">
                    Amenity: {amenityOptions.find(o => o.value === selectedAmenity)?.label || selectedAmenity}
                    <button onClick={() => setSelectedAmenity('All')} className="hover:text-black cursor-pointer">
                      <X size={12} />
                    </button>
                  </span>
                )}

                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-red-600 hover:text-red-700 ml-1 underline underline-offset-2 transition-colors cursor-pointer"
                >
                  <RotateCcw size={12} />
                  Reset Filters
                </button>
              </div>
            )}

          </div>

        </div>

        {/* Active AI Prompt Banner */}
        {activeAiPrompt && (
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-300/40 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in shadow-xs">
            <div className="flex items-start sm:items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                <Sparkles size={17} />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                  Description Search Active
                </div>
                <div className="text-[13px] font-medium text-stone-800">
                  &ldquo;{activeAiPrompt}&rdquo; &bull; <span className="font-bold text-stone-900">{filteredProperties.length} {filteredProperties.length === 1 ? 'residence' : 'properties'} matched</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveAiPrompt('');
                setAiDescription('');
              }}
              className="text-xs font-semibold text-stone-700 hover:text-black px-3 py-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-50 transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-2xs"
            >
              <RotateCcw size={12} />
              <span>Clear Description Search</span>
            </button>
          </div>
        )}

        {/* 3. PROPERTY GRID */}
        {filteredProperties.length > 0 ? (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProperties.slice(0, visibleCount).map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  isFavorite={favorites.includes(property.id)}
                  onToggleFavorite={onToggleFavorite}
                  onSelectProperty={onSelectProperty}
                />
              ))}
            </div>

            {/* Load More Button Block */}
            {visibleCount < filteredProperties.length ? (
              <div className="pt-4 flex flex-col items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={isLoadingMore}
                  onClick={() => {
                    setVisibleCount((prev) => prev + 6);
                  }}
                  className="px-8 py-3.5 rounded-full bg-[#111827] hover:bg-[#27272A] active:scale-[0.98] text-white text-xs font-semibold uppercase tracking-wider transition-all duration-200 flex items-center gap-2.5 shadow-md hover:shadow-lg disabled:opacity-60 cursor-pointer"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Loading Residences...</span>
                    </>
                  ) : (
                    <>
                      <span>Load More Properties</span>
                      <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-mono">
                        +{Math.min(6, filteredProperties.length - visibleCount)}
                      </span>
                    </>
                  )}
                </button>
                <p className="text-xs text-stone-500 font-mono">
                  Showing {Math.min(visibleCount, filteredProperties.length)} of {filteredProperties.length} residences
                </p>
              </div>
            ) : filteredProperties.length > 6 ? (
              <div className="pt-4 text-center">
                <p className="text-xs text-stone-400 font-mono uppercase tracking-wider">
                  All {filteredProperties.length} residences displayed
                </p>
              </div>
            ) : null}
          </div>
        ) : (
          /* Empty Search State */
          <div className="bg-white border border-[#E5E7EB] rounded-[16px] py-16 px-6 text-center space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 mx-auto rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
              <Filter size={24} />
            </div>
            <h3 className="text-[20px] font-semibold text-[#0A0A0C]">
              No properties match your filter selection
            </h3>
            <p className="text-[14px] text-stone-500 max-w-md mx-auto">
              We couldn't find any {category} properties matching your specific criteria. Try adjusting your search keyword, location, or price filters.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={resetFilters}
                className="px-6 py-2.5 bg-black text-white rounded-[8px] text-[14px] font-medium hover:bg-stone-800 transition-colors shadow-sm inline-flex items-center gap-2"
              >
                <RotateCcw size={14} />
                Reset All Filters
              </button>
            </div>
          </div>
        )}

        {/* 4. PRIVATE CONSULTATION ADVISORY BANNER */}
        <div className="mt-16 bg-[#000000] text-white rounded-[20px] p-8 sm:p-10 lg:p-12 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8 border border-white/10">
          <div className="space-y-2.5 max-w-xl z-10">
            <div className="inline-flex items-center gap-2 text-white/60 text-[12px] uppercase font-mono tracking-wider">
              <ShieldCheck size={16} className="text-white" />
              <span>Off-Market Acquisitions & Advisory</span>
            </div>
            <h3 className="text-[26px] sm:text-[32px] font-semibold tracking-tight text-white">
              Seeking Exclusive or Off-Market {currentCategoryMeta.label} Inventory?
            </h3>
            <p className="text-[14px] sm:text-[15px] text-white/70 leading-[1.6]">
              Due to owner confidentiality, a significant portion of our ultra-luxury residences and private estates remain strictly off-market. Connect with our senior advisory desk for discreet access.
            </p>
          </div>

          <div className="shrink-0 z-10">
            <button
              type="button"
              onClick={onContactClick}
              className="px-8 py-3.5 bg-white text-black text-[14px] font-semibold rounded-[8px] hover:bg-stone-200 transition-all duration-200 shadow-lg hover:scale-[1.02] active:scale-[0.98] inline-flex items-center gap-2"
            >
              <PhoneCall size={16} />
              Speak with an Advisor
            </button>
          </div>
        </div>

      </section>

      {/* AI NATURAL LANGUAGE SEARCH MODAL */}
      {isAiModalOpen && (
        <div 
          className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsAiModalOpen(false)}
        >
          <div 
            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden text-left animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-black text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-[17px] sm:text-[19px] font-bold text-white tracking-tight">
                    Property Description Search
                  </h3>
                  <p className="text-[11px] sm:text-[12px] text-white/70">
                    Matches keywords in live listing descriptions and amenities. AI interpretation is unavailable.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600">
                  Describe what you are looking for:
                </label>
                <textarea
                  rows={4}
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleExecuteAiSearch();
                    }
                  }}
                  placeholder="e.g. Waterfront villa with private beach, infinity pool, wine cellar, and panoramic skyline vistas..."
                  className="w-full p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-[14px] text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-black focus:bg-white transition-all resize-none"
                  autoFocus
                />
              </div>

              {/* Inspiration Prompts */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Try one of these curated searches:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {aiInspirations.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAiDescription(item.text)}
                      className="text-[11.5px] px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors text-left border border-stone-200 cursor-pointer flex items-center gap-1.5"
                    >
                      <span className="font-semibold text-stone-900">{item.tag}:</span>
                      <span>&ldquo;{item.text}&rdquo;</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 bg-stone-50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setAiDescription('');
                  setActiveAiPrompt('');
                  setIsAiModalOpen(false);
                }}
                className="text-[13px] font-semibold text-stone-500 hover:text-stone-800 px-3 py-2 cursor-pointer"
              >
                Reset
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-[13px] font-semibold hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteAiSearch}
                  disabled={!aiDescription.trim() || isAiSearching}
                  className="px-5 py-2.5 rounded-xl bg-black hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[13px] font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Sparkles size={14} className="text-amber-400 animate-pulse" />
                  <span>{isAiSearching ? 'Searching...' : 'Search Residences'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
