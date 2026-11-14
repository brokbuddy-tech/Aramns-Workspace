import {popularAreaLinks, listingAreaId, normalizeArea} from '../lib/property-popularity.mjs';
import React, { useState, useMemo, useEffect } from 'react';
import {X, Sparkles, Filter, RotateCcw, PhoneCall, ShieldCheck} from 'lucide-react';
import PropertyCard from './PropertyCard';
import PropertySearchBar from './PropertySearchBar';
import QuickLinkCards from './QuickLinkCards';
import {emptyAdvancedFilters, readListingSearch, writeListingSearch, matchesAdvancedFilters, advancedFilterChips, propertySector, hasListingViews, compareListingActivity, matchesRoomCount} from '../lib/property-filters.mjs';
import {plainText} from './RichText';
import { PROPERTY_MARKET_CATEGORIES } from '../data/properties';

export default function PropertyCategoryPage({
  category = 'buy',
  properties = [],
  favorites = [],
  onToggleFavorite,
  onSelectProperty,
  onNavigate,
  onContactClick,
  quickLinksLimit = 6,
  quickLinkClicks = []
}) {
  const [initialSearch] = useState(() => readListingSearch(window.location.search));
  const [searchQuery, setSearchQuery] = useState(initialSearch.basic.q);
  const [selectedAreaId, setSelectedAreaId] = useState(initialSearch.basic.areaId || '');
  const [selectedLocation, setSelectedLocation] = useState(initialSearch.basic.location || 'All');
  const [selectedType, setSelectedType] = useState(initialSearch.basic.type || 'All');
  const [selectedPriceRange, setSelectedPriceRange] = useState(initialSearch.basic.price || 'All');
  const [selectedBeds, setSelectedBeds] = useState(initialSearch.basic.beds || 'All');
  const [selectedAmenity, setSelectedAmenity] = useState(initialSearch.basic.amenity || 'All');
  const [sortBy, setSortBy] = useState(initialSearch.basic.sort || 'featured');
  const [advancedFilters, setAdvancedFilters] = useState(initialSearch.advanced);
  const [visibleCount, setVisibleCount] = useState(6);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // AI Description Search States
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiDescription, setAiDescription] = useState(initialSearch.basic.description);
  const [activeAiPrompt, setActiveAiPrompt] = useState(initialSearch.basic.description);
  const [isAiSearching, setIsAiSearching] = useState(false);

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
  }, [category]);

  useEffect(() => {
    const query = writeListingSearch(window.location.search, {
      q:searchQuery, location:selectedLocation, areaId:selectedAreaId, type:selectedType, price:selectedPriceRange,
      beds:selectedBeds, amenity:selectedAmenity, sort:sortBy, description:activeAiPrompt,
    }, advancedFilters);
    const url = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
    window.history.replaceState(window.history.state, '', url);
  }, [selectedAreaId, searchQuery, selectedLocation, selectedType, selectedPriceRange, selectedBeds, selectedAmenity, sortBy, activeAiPrompt, advancedFilters]);

  useEffect(() => {
    const restore = () => {
      const {basic, advanced} = readListingSearch(window.location.search);
      setSelectedAreaId(basic.areaId || ''); setSearchQuery(basic.q); setSelectedLocation(basic.location || 'All');
      setSelectedType(basic.type || 'All'); setSelectedPriceRange(basic.price || 'All');
      setSelectedBeds(basic.beds || 'All'); setSelectedAmenity(basic.amenity || 'All');
      setSortBy(basic.sort || 'featured'); setActiveAiPrompt(basic.description);
      setAiDescription(basic.description); setAdvancedFilters(advanced);
    };
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, []);

  // Reset pagination when active filter inputs change
  useEffect(() => {
    setVisibleCount(6);
  }, [selectedAreaId, searchQuery, selectedLocation, selectedType, selectedPriceRange, selectedBeds, selectedAmenity, activeAiPrompt, sortBy, advancedFilters]);

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
      if (category === 'commercial') return propertySector(p) === 'commercial';
      return true;
    });
  }, [properties, category]);

  const amenityOptions = useMemo(() => {
    const amenities = [...new Set(baseCategoryProperties.flatMap(property => property.amenities || []))].sort();
    return [{label:'All Amenities', value:'All'}, ...amenities.map(label => ({
      label: /pool/i.test(label) ? 'Pool' : label, value: /pool/i.test(label) ? 'pool' : label.toLowerCase(),
    }))].filter((option, index, options) => options.findIndex(item => item.value === option.value) === index);
  }, [baseCategoryProperties]);

  // Available unique locations for current category
  const availableLocations = useMemo(() => {
    const locs = new Set();
    baseCategoryProperties.forEach(p => {
      if (p.neighborhood) locs.add(p.neighborhood);
      else if (p.cityState) locs.add(p.cityState.split(',')[0].trim());
    });
    return ['All', ...Array.from(locs).sort()];
  }, [baseCategoryProperties]);

  const sourceCurrencies = useMemo(() => [...new Set(baseCategoryProperties.map(p=>p.currency))], [baseCategoryProperties]);
  const canComparePrice = sourceCurrencies.length === 1 || Boolean(advancedFilters.currency);
  const hasViewCounts = baseCategoryProperties.some(hasListingViews);
  useEffect(() => {
    if (sortBy === 'most-viewed' && !hasViewCounts) setSortBy('latest');
  }, [sortBy, hasViewCounts]);
  const priceCurrency = advancedFilters.currency || (sourceCurrencies.length === 1 ? sourceCurrencies[0] : '');
  const extraChips = advancedFilterChips(advancedFilters, priceCurrency);
  const commercialOnly = advancedFilters.sector === 'commercial' || category === 'commercial' || (selectedType !== 'All' && baseCategoryProperties.filter(p => p.category === selectedType).every(p => propertySector(p) === 'commercial'));

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
  const filterProperties = (advanced, {type = selectedType, beds = selectedBeds, amenity = selectedAmenity, priceRange = selectedPriceRange} = {}) => {
    return baseCategoryProperties.filter(p => {
      if (!matchesAdvancedFilters(p, advanced, sourceCurrencies)) return false;
      // 0. AI Natural Language Description Search Matching
      if (activeAiPrompt.trim()) {
        const score = getAiScore(p, activeAiPrompt);
        if (score === 0) return false;
        // Relevance is derived locally without changing listing data.
      }

      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesTitle = p.title?.toLowerCase().includes(q);
        const matchesLoc = p.location?.toLowerCase().includes(q);
        const matchesCity = p.cityState?.toLowerCase().includes(q);
        const matchesType = p.propertyType?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q);
        const matchesHeadline = p.headline?.toLowerCase().includes(q) || p.id?.toLowerCase().includes(q) || plainText(p.description).toLowerCase().includes(q) || p.amenities?.some(amenity => amenity.toLowerCase().includes(q));
        if (!matchesTitle && !matchesLoc && !matchesCity && !matchesType && !matchesHeadline) {
          return false;
        }
      }

      // 2. Location
      if (selectedAreaId && listingAreaId(p) !== selectedAreaId) return false;
      if (!selectedAreaId && selectedLocation !== 'All') {
        const pLoc = p.neighborhood || p.cityState || '';
        if (!normalizeArea(pLoc).includes(normalizeArea(selectedLocation))) {
          return false;
        }
      }

      // 3. Property Sub-Type
      if (type !== 'All') {
        const matchesCat = p.category === type;
        const matchesPropType = p.propertyType?.toLowerCase().includes(type.toLowerCase());
        if (!matchesCat && !matchesPropType) {
          return false;
        }
      }

      // 4. Price Range
      if (priceRange !== 'All' && (sourceCurrencies.length === 1 || advanced.currency) && advanced.minPrice === '' && advanced.maxPrice === '') {
        if (category === 'rent') {
          if (priceRange === 'under-20k' && p.price >= 20000) return false;
          if (priceRange === '20k-35k' && (p.price < 20000 || p.price > 35000)) return false;
          if (priceRange === 'above-35k' && p.price < 35000) return false;
        } else {
          if (priceRange === 'under-15m' && p.price >= 15000000) return false;
          if (priceRange === '15m-25m' && (p.price < 15000000 || p.price > 25000000)) return false;
          if (priceRange === 'above-25m' && p.price < 25000000) return false;
        }
      }

      // 5. Bedrooms
      if (beds !== 'All' && advanced.sector !== 'commercial') {
        if (!matchesRoomCount(p.beds,beds) || (beds === 'studio' && propertySector(p) === 'commercial')) return false;
      }

      // 6. Amenities Filter
      if (amenity !== 'All') {
        const q = amenity.toLowerCase();
        const hasAmenity = (p.amenities || []).some(a => a.toLowerCase().includes(q));
        if (!hasAmenity) return false;
      }

      return true;
    });
  };

  const filteredProperties = useMemo(() => {
    return filterProperties(advancedFilters).sort((a, b) => {
      // Prioritize AI relevance if AI search is active
      if (activeAiPrompt.trim() && sortBy === 'featured') {
        const diff = getAiScore(b, activeAiPrompt) - getAiScore(a, activeAiPrompt);
        if (diff !== 0) return diff;
      }
      if (sortBy === 'price-asc' && canComparePrice) return a.price - b.price;
      if (sortBy === 'price-desc' && canComparePrice) return b.price - a.price;
      if (sortBy === 'sqft-desc') return (typeof b.sqft === 'number' ? b.sqft : -1) - (typeof a.sqft === 'number' ? a.sqft : -1);
      if (sortBy === 'beds-desc') return (typeof b.beds === 'number' ? b.beds : -1) - (typeof a.beds === 'number' ? a.beds : -1);
      if (sortBy === 'latest' || sortBy === 'most-viewed') return compareListingActivity(a,b,sortBy);
      // Default: featured first
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    });
  }, [selectedAreaId, baseCategoryProperties, searchQuery, selectedLocation, selectedType, selectedPriceRange, selectedBeds, selectedAmenity, activeAiPrompt, sortBy, category, advancedFilters, sourceCurrencies, canComparePrice, hasViewCounts]);

  const quickLinks = useMemo(() => popularAreaLinks(filteredProperties, {path:window.location.pathname, search:writeListingSearch('', {q:searchQuery,type:selectedType,price:selectedPriceRange,beds:selectedBeds,amenity:selectedAmenity,description:activeAiPrompt,sort:sortBy},advancedFilters), limit:quickLinksLimit, clicks:quickLinkClicks}), [filteredProperties, quickLinksLimit, quickLinkClicks, searchQuery, selectedType, selectedPriceRange, selectedBeds, selectedAmenity, activeAiPrompt, advancedFilters, sortBy]);

  const resetFilters = () => {
    setSelectedAreaId('');
    setSearchQuery('');
    setSelectedLocation('All');
    setSelectedType('All');
    setSelectedPriceRange('All');
    setSelectedBeds('All');
    setSelectedAmenity('All');
    setActiveAiPrompt('');
    setAiDescription('');
    setSortBy('featured');
    setAdvancedFilters(emptyAdvancedFilters());
  };

  const activeChips = [
    ...(activeAiPrompt ? [{key:'description', label:`Search: ${activeAiPrompt}`, remove:() => {setActiveAiPrompt(''); setAiDescription('');}}] : []),
    ...(searchQuery ? [{key:'query', label:`Keyword: ${searchQuery}`, remove:() => setSearchQuery('')}] : []),
    ...(selectedLocation !== 'All' ? [{key:'location', label:selectedLocation, remove:() => {setSelectedAreaId('');setSelectedLocation('All');}}] : []),
    ...(selectedType !== 'All' ? [{key:'type', label:selectedType, remove:() => setSelectedType('All')}] : []),
    ...(selectedPriceRange !== 'All' && advancedFilters.minPrice === '' && advancedFilters.maxPrice === '' ? [{key:'price', label:priceRangeOptions.find(option => option.value === selectedPriceRange)?.label || selectedPriceRange, remove:() => setSelectedPriceRange('All')}] : []),
    ...(selectedBeds !== 'All' ? [{key:'beds', label:selectedBeds === 'studio' ? 'Studio' : `${selectedBeds} ${selectedBeds === '1' ? 'bed' : 'beds'}`, remove:() => setSelectedBeds('All')}] : []),
    ...(selectedAmenity !== 'All' ? [{key:'amenity', label:amenityOptions.find(option => option.value === selectedAmenity)?.label || selectedAmenity, remove:() => setSelectedAmenity('All')}] : []),
    ...extraChips.map(chip => ({...chip, remove:() => {
      setAdvancedFilters(previous => ({...previous, ...chip.clear}));
      if (chip.key === 'currency' && sourceCurrencies.length > 1) {setSelectedPriceRange('All'); if (sortBy.startsWith('price-')) setSortBy('featured');}
    }})),
  ];

  const handleExecuteAiSearch = () => {
    if (!aiDescription.trim()) return;
    setActiveAiPrompt(aiDescription.trim());
    setIsAiModalOpen(false);
    document.getElementById('listings')?.scrollIntoView({behavior:'smooth'});
  };

  const getCategoryCount = id => properties.filter(property => {
    if (id === 'all') return true;
    if (id === 'buy') return property.marketCategory === 'buy' || property.listingType === 'FOR SALE';
    if (id === 'rent') return property.marketCategory === 'rent' || property.listingType === 'FOR RENT';
    return false;
  }).length;

  return (
    <div className="w-full bg-[#FDFDFD] min-h-screen text-[#0A0A0C]">
      
      {/* 1. HERO & CATEGORY INTRO SECTION */}
      <section className="relative w-full bg-[#0A0A0C] text-white pt-36 pb-20 sm:pt-40 sm:pb-24 overflow-hidden border-b border-white/10">
        {/* Subtle architectural grid backdrop */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-[600px] h-[300px] bg-white/[0.03] rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 relative z-10">
          
          {/* Page headline and introduction */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pt-2">
            <div className="max-w-3xl space-y-4">
              <h1 className="text-[36px] sm:text-[46px] lg:text-[54px] font-semibold text-white tracking-tight leading-[1.12] font-sans">
                {currentCategoryMeta.headline}
              </h1>

              <p className="text-[15px] sm:text-[17px] text-white/70 leading-[1.6] max-w-2xl font-normal">
                {currentCategoryMeta.description}
              </p>
            </div>

            <div role="group" aria-label="Listing categories" className="flex flex-nowrap items-center gap-1 sm:gap-3 p-1.5 bg-white/10 backdrop-blur-md rounded-[12px] border border-white/10 w-full sm:w-fit max-w-full overflow-x-auto shrink-0 self-start lg:self-end">
              {PROPERTY_MARKET_CATEGORIES.map(tab => {
                const isActive = tab.id === category;
                return (
                  <button key={tab.id} type="button" aria-pressed={isActive}
                    onClick={() => {if (!isActive) onNavigate(tab.path);}}
                    className={`flex-1 sm:flex-none shrink-0 px-2 sm:px-5 py-2.5 rounded-[9px] text-[12px] sm:text-[14px] font-medium transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2.5 whitespace-nowrap select-none cursor-pointer ${isActive ? 'bg-white text-black shadow-md font-semibold' : 'text-white/80 hover:text-white hover:bg-white/10'}`}>
                    <span>{tab.label}</span>
                    <span className={`shrink-0 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-black text-white' : 'bg-white/20 text-white'}`}>{getCategoryCount(tab.id)}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      {/* 2. FILTER BAR & PROPERTY LISTINGS SECTION */}
      <section id="listings" className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-12 lg:py-16 space-y-10">
        
        <QuickLinkCards areas={quickLinks} />

        <PropertySearchBar
          category={category}
          value={{query:searchQuery, location:selectedLocation, type:selectedType, priceRange:selectedPriceRange, beds:selectedBeds, amenity:selectedAmenity, sort:sortBy, advanced:advancedFilters}}
          onChange={changes => {
            if ('query' in changes) setSearchQuery(changes.query);
            if ('location' in changes) {setSelectedAreaId('');setSelectedLocation(changes.location);}
            if ('type' in changes) {
              setSelectedType(changes.type);
              if (changes.type !== 'All' && baseCategoryProperties.filter(property => property.category === changes.type).every(property => propertySector(property) === 'commercial')) {
                setSelectedBeds('All');
                setAdvancedFilters(previous => ({...previous,baths:'All'}));
              }
            }
            if ('beds' in changes) setSelectedBeds(changes.beds);
            if ('amenity' in changes) setSelectedAmenity(changes.amenity);
            if ('priceRange' in changes) setSelectedPriceRange(changes.priceRange);
            if ('sort' in changes) setSortBy(changes.sort);
            if ('advanced' in changes) {
              setAdvancedFilters(changes.advanced);
              if (!changes.advanced.currency && sourceCurrencies.length > 1) {
                setSelectedPriceRange('All');
                if (sortBy.startsWith('price-')) setSortBy('featured');
              }
            }
          }}
          locations={availableLocations}
          properties={baseCategoryProperties}
          priceOptions={priceRangeOptions}
          currency={priceCurrency}
          commercialOnly={commercialOnly}
          hasViewCounts={hasViewCounts}
          previewCount={draft => filterProperties(draft.advanced, draft).length}
          resultCount={filteredProperties.length}
          activeChips={activeChips}
          onReset={resetFilters}
          onDescriptionSearch={() => setIsAiModalOpen(true)}
        />

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
          <div id="property-results" className="scroll-mt-24 space-y-12">
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
          <div id="property-results" className="scroll-mt-24 bg-white border border-[#E5E7EB] rounded-[16px] py-16 px-6 text-center space-y-4 max-w-lg mx-auto">
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
