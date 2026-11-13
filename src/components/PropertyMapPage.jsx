import React, { useState, useEffect, useRef, useMemo } from 'react';
import {useGoogleMaps, validCoordinates} from '../lib/google-maps';
import { 
  MapPin, Layers, ChevronRight, ChevronDown, X, ExternalLink, 
  ArrowLeft, Check, Search, SlidersHorizontal, List, Map as MapIcon,
  Maximize2, Minimize2, PanelLeftClose, PanelLeftOpen, Compass
} from 'lucide-react';
import {CURRENCY_OPTIONS} from '../data/mapData';
import {buildMapAreas, defaultMapArea, matchesMapArea, getMapViewport, fitMapViewport} from '../lib/map-geography.mjs';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export default function PropertyMapPage({
  properties = [],
  favorites = [],
  onToggleFavorite,
  onNavigate,
  initialArea = null
}) {
  const {sdk, error: sdkError} = useGoogleMaps();
  const [mapReady, setMapReady] = useState(false);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const popupsRef = useRef({});
  const currencyDropdownRef = useRef(null);

  // Filter States
  const mapAreas = useMemo(() => buildMapAreas(properties), [properties]);
  const [selectedAreaId, setSelectedAreaId] = useState(() => initialArea || defaultMapArea(mapAreas));
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currencyCode, setCurrencyCode] = useState(properties[0]?.currency || 'AED');
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');
  const [activePropertyId, setActivePropertyId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Responsive UI States
  const [sidebarOpen, setSidebarOpen] = useState(true); // Desktop/tablet sidebar toggle
  const [mobileViewMode, setMobileViewMode] = useState('map'); // 'map' or 'list' on mobile

  // Current active currency object
  const activeCurrency = CURRENCY_OPTIONS.find(c => c.code === currencyCode) || CURRENCY_OPTIONS[0];

  // Selected area object
  const currentArea = mapAreas.find(area => area.id === selectedAreaId) || mapAreas[0];

  // Close currency dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target)) {
        setIsCurrencyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter properties based on area, category, and search query
  const filteredProperties = useMemo(() => properties.filter((prop) => {
    if (!matchesMapArea(prop,currentArea)) return false;

    // Category filter
    if (selectedCategory !== 'All') {
      const market = (prop.marketCategory || '').toLowerCase();
      const cat = (prop.category || '').toLowerCase();
      const filterLower = selectedCategory.toLowerCase();

      if (filterLower === 'buy' && market !== 'buy') return false;
      if (filterLower === 'rent' && market !== 'rent') return false;
      if (!['buy', 'rent'].includes(filterLower)) {
        if (!cat.includes(filterLower)) return false;
      }
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = [prop.title,prop.location,prop.neighborhood,prop.cityState].some(value => (value || '').toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  }), [properties, currentArea, selectedCategory, searchQuery]);

  const viewport = useMemo(() => getMapViewport(filteredProperties,currentArea.viewport), [filteredProperties,currentArea]);

  // Active property object (for mobile floating card and highlight)
  const activeProperty = properties.find(p => p.id === activePropertyId) || null;

  // Google Maps uses the API's listing coordinates directly; no geocoding.
  useEffect(() => {
    if (!sdk || !mapContainerRef.current) return;
    const map = new sdk.Map(mapContainerRef.current, {
      center: viewport.center,
      zoom: viewport.zoom, maxZoom:16, mapId: sdk.mapId,
      mapTypeControl: false, streetViewControl: false,
      gestureHandling: 'greedy', zoomControl: true,
      zoomControlOptions: {position: window.google.maps.ControlPosition.LEFT_CENTER},
    });
    mapInstanceRef.current = map;
    setMapReady(true);
    return () => {
      Object.values(markersRef.current).forEach(marker => {
        marker.map = null;
        sdk.event.clearInstanceListeners(marker);
      });
      Object.values(popupsRef.current).forEach(popup => {
        popup.close();
        sdk.event.clearInstanceListeners(popup);
      });
      sdk.event.clearInstanceListeners(map);
      mapInstanceRef.current = null;
    };
  }, [sdk]);

  useEffect(() => {
    if (!mapReady || !sdk || !mapInstanceRef.current) return;
    const timer = setTimeout(() => sdk.event.trigger(mapInstanceRef.current, 'resize'), 350);
    return () => clearTimeout(timer);
  }, [sidebarOpen, mobileViewMode, mapReady, sdk]);

  useEffect(() => {
    if (mobileViewMode === 'map' && window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileViewMode]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!mapReady || !sdk || !map) return;
    Object.values(markersRef.current).forEach(marker => {
      marker.map = null;
      sdk.event.clearInstanceListeners(marker);
    });
    Object.values(popupsRef.current).forEach(popup => {
      popup.close();
      sdk.event.clearInstanceListeners(popup);
    });
    markersRef.current = {};
    popupsRef.current = {};

    filteredProperties.forEach(property => {
      if (!validCoordinates(property.coordinates)) return;
      const shortPrice = property.priceFormatted;
      const pin = document.createElement('button');
      pin.type = 'button';
      pin.className = 'map-price-pin';
      pin.textContent = shortPrice;
      pin.setAttribute('aria-label', property.title);
      const marker = new sdk.AdvancedMarkerElement({
        map, position: property.coordinates, content: pin, title: property.title,
      });
      const popupHtml = `
        <div class="flex items-center gap-3.5 p-3.5 min-w-[310px] sm:min-w-[340px] max-w-[360px] bg-white rounded-2xl relative select-none font-sans">
          <button 
            id="popup-close-${property.id}"
            type="button"
            class="absolute top-2.5 right-2.5 text-gray-400 hover:text-black w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-[18px] leading-none cursor-pointer"
            aria-label="Close"
          >
            &times;
          </button>
          
          <img 
            src="${escapeHtml(property.images?.[0])}" 
            alt="${escapeHtml(property.title)}" 
            class="w-24 h-22 sm:w-26 sm:h-24 object-cover rounded-xl shrink-0 border border-black/5 shadow-inner" 
          />
          
          <div class="flex-1 pr-4 min-w-0 text-left">
            <h4 class="text-[13px] font-bold text-gray-900 leading-snug line-clamp-2 hover:text-[#C5A059] transition-colors cursor-pointer" id="popup-title-${property.id}">
              ${escapeHtml(property.title)}
            </h4>
            
            <div class="text-[14px] font-extrabold text-[#0F172A] mt-1 tracking-tight">
              Starting ${escapeHtml(shortPrice)}
            </div>
            
            <div class="text-[11px] text-gray-500 font-medium mt-0.5 flex items-center gap-1.5">
              <span>${property.sqft ? property.sqft.toLocaleString() + ' ft²' : ''}</span>
              ${property.beds ? `<span>•</span><span>${escapeHtml(property.beds)} Beds</span>` : ''}
              <span>•</span>
              <span class="truncate max-w-[90px]">${escapeHtml(property.neighborhood)}</span>
            </div>
            
            <button 
              id="popup-view-btn-${property.id}"
              type="button"
              class="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-black hover:text-[#C5A059] transition-colors cursor-pointer group"
            >
              <span>View Residence</span>
              <span class="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
            </button>
          </div>
        </div>
      `;
      const popup = new sdk.InfoWindow({content: popupHtml, maxWidth: 380});
      pin.addEventListener('click', () => setActivePropertyId(property.id));
      popup.addListener('closeclick', () => setActivePropertyId(null));
      popup.addListener('domready', () => {
        const close = document.getElementById(`popup-close-${property.id}`);
        if (close) close.onclick = () => setActivePropertyId(null);
        const open = () => onNavigate?.(`/property/${property.id}`);
        const view = document.getElementById(`popup-view-btn-${property.id}`);
        const title = document.getElementById(`popup-title-${property.id}`);
        if (view) view.onclick = open;
        if (title) title.onclick = open;
      });
      markersRef.current[property.id] = marker;
      popupsRef.current[property.id] = popup;
    });
    return () => {
      Object.values(markersRef.current).forEach(marker => {
        marker.map = null;
        sdk.event.clearInstanceListeners(marker);
      });
      Object.values(popupsRef.current).forEach(popup => {
        popup.close();
        sdk.event.clearInstanceListeners(popup);
      });
      markersRef.current = {};
      popupsRef.current = {};
    };
  }, [filteredProperties, mapReady, sdk, onNavigate]);

  useEffect(() => {
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      const active = id === activePropertyId;
      marker.content.classList.toggle('is-active', active);
      marker.zIndex = active ? 1000 : 1;
      const popup = popupsRef.current[id];
      if (active) popup.open({map: mapInstanceRef.current, anchor: marker});
      else popup.close();
    });
  }, [activePropertyId, filteredProperties, mapReady, sdk, onNavigate]);

  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || activePropertyId) return;
    fitMapViewport(mapInstanceRef.current,viewport,window.innerWidth < 768);
  }, [mapReady,viewport,sidebarOpen,mobileViewMode,activePropertyId]);

  useEffect(() => {
    if (activePropertyId && !filteredProperties.some(property => property.id === activePropertyId)) setActivePropertyId(null);
  }, [filteredProperties,activePropertyId]);

  const centerMap = () => {
    if (mapInstanceRef.current) fitMapViewport(mapInstanceRef.current,viewport,window.innerWidth < 768);
  };

  const handleSelectArea = areaId => {
    setSelectedAreaId(areaId);
    setActivePropertyId(null);
  };

  const handlePropertyCardClick = property => {
    if (!validCoordinates(property.coordinates)) return;
    setActivePropertyId(property.id);
    mapInstanceRef.current?.panTo(property.coordinates);
    mapInstanceRef.current?.setZoom(16);
    if (window.innerWidth < 768) setMobileViewMode('map');
  };

  const categories = ['All', 'Buy', 'Rent'];

  // Filtered currency options for dropdown search
  const filteredCurrencies = CURRENCY_OPTIONS.filter(c => {
    if (!currencySearch.trim()) return true;
    const q = currencySearch.toLowerCase();
    return c.code.toLowerCase().includes(q) || 
           c.name.toLowerCase().includes(q) || 
           c.symbol.toLowerCase().includes(q);
  });

  return (
    <div className="w-full h-screen max-h-screen bg-[#F9F9F8] flex flex-col pt-[96px] sm:pt-[106px] md:pt-[116px] lg:pt-[124px] overflow-hidden select-none">
      
      {/* TOP HEADER CONTROLS BAR (Comfortable Spacing Below Floating Navbar) */}
      <section className="bg-white border-b border-black/10 px-3 sm:px-5 lg:px-6 py-3 sm:py-3.5 shadow-xs z-30 shrink-0">
        <div className="w-full flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Left: Back Arrow + Title + Active Area Tag */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('/')}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-gray-700 transition-colors cursor-pointer shrink-0"
              title="Return to Home"
            >
              <ArrowLeft size={16} />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-[15px] sm:text-[18px] font-bold text-gray-900 tracking-tight flex items-center gap-1.5 truncate">
                  <MapPin size={17} className="text-[#000000] shrink-0" />
                  <span className="hidden sm:inline">Map Residence Explorer</span>
                  <span className="sm:hidden">Map Explorer</span>
                </h1>
                <span className="text-[10px] sm:text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-black text-white shrink-0">
                  {filteredProperties.length}
                </span>
              </div>
              <p className="text-[11px] sm:text-[12px] text-gray-500 font-medium truncate hidden md:block">
                {currentArea.name} &bull; {currentArea.tagline}
              </p>
            </div>
          </div>

          {/* Right: Currency Dropdown + Categories + Mobile Mode & Desktop Sidebar Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* 1. CURRENCY CONVERTER DROPDOWN */}
            <div className="relative" ref={currencyDropdownRef}>
              <button
                type="button"
                disabled onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
                className="flex items-center gap-1.5 sm:gap-2 bg-gray-100 hover:bg-gray-200/80 border border-gray-200 text-gray-900 px-2.5 sm:px-3 py-1.5 rounded-lg text-[12px] sm:text-[13px] font-bold transition-all cursor-pointer shadow-2xs"
                title="Currency conversion unavailable; prices use source currencies"
              >
                <span className="text-[14px]">{activeCurrency.flag}</span>
                <span className="font-semibold">{activeCurrency.code}</span>
                <span className="text-gray-500 text-[11px] hidden sm:inline">({activeCurrency.symbol})</span>
                <ChevronDown 
                  size={14} 
                  className={`text-gray-500 transition-transform duration-200 ${isCurrencyDropdownOpen ? 'rotate-180' : ''}`} 
                />
              </button>

              {/* CURRENCY DROPDOWN MENU */}
              {isCurrencyDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-[260px] sm:w-[280px] bg-white border border-gray-200 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.22)] py-2 z-[9999] animate-fade-in">
                  <div className="px-3 pb-2 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-gray-500 font-bold">
                      Select Currency ({CURRENCY_OPTIONS.length})
                    </span>
                    <span className="text-[10px] text-gray-400">Live Rates</span>
                  </div>

                  {/* Currency Quick Search */}
                  <div className="p-2 border-b border-gray-100">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search currency..."
                        value={currencySearch}
                        onChange={(e) => setCurrencySearch(e.target.value)}
                        className="w-full text-[12px] bg-gray-50 border border-gray-200 rounded-md pl-7 pr-2 py-1 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black"
                      />
                      <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>

                  {/* Currencies Scroll List */}
                  <div className="max-h-[260px] overflow-y-auto py-1 divide-y divide-gray-50">
                    {filteredCurrencies.map((curr) => {
                      const isSelected = currencyCode === curr.code;
                      return (
                        <button
                          key={curr.code}
                          type="button"
                          onClick={() => {
                            setCurrencyCode(curr.code);
                            setIsCurrencyDropdownOpen(false);
                            setCurrencySearch('');
                          }}
                          className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer ${
                            isSelected ? 'bg-amber-50/70' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-[16px]">{curr.flag}</span>
                            <div>
                              <div className="text-[12px] font-bold text-gray-900 flex items-center gap-1.5">
                                <span>{curr.code}</span>
                                <span className="text-gray-500 font-medium">({curr.symbol})</span>
                              </div>
                              <div className="text-[10px] text-gray-500 leading-none mt-0.5">
                                {curr.name}
                              </div>
                            </div>
                          </div>

                          {isSelected && (
                            <Check size={14} className="text-black font-bold shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 2. CATEGORY SELECTOR (Desktop/Tablet) */}
            <div className="hidden md:inline-flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-[12px] font-semibold px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-white text-gray-950 shadow-2xs font-bold'
                      : 'text-gray-600 hover:text-gray-950'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* 3. MAP VIEW BUTTON (Quickly show properties on map) */}
            <button
              type="button"
              onClick={() => {
                centerMap();
                setMobileViewMode('map');
              }}
              className="inline-flex items-center gap-1.5 bg-black hover:bg-neutral-800 text-white px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-[12px] font-bold transition-all shadow-xs hover:scale-102 active:scale-98 cursor-pointer shrink-0"
              title="Show properties in map"
            >
              <MapPin size={13} className="text-amber-400 shrink-0" />
              <span>Map View</span>
            </button>

            {/* 4. SIDEBAR COLLAPSE TOGGLE (Desktop & Tablet) */}
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden md:inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all border border-gray-200 cursor-pointer"
              title={sidebarOpen ? "Hide property panel to maximize map" : "Show property panel"}
            >
              {sidebarOpen ? (
                <>
                  <PanelLeftClose size={15} />
                  <span className="hidden lg:inline text-[11px]">Collapse List</span>
                </>
              ) : (
                <>
                  <PanelLeftOpen size={15} />
                  <span className="hidden lg:inline text-[11px]">Show List</span>
                </>
              )}
            </button>

            {/* 4. MOBILE VIEW SWITCHER (Map vs List for screens < 768px) */}
            <div className="flex md:hidden bg-black text-white p-0.5 rounded-lg shrink-0">
              <button
                type="button"
                onClick={() => setMobileViewMode('map')}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                  mobileViewMode === 'map' ? 'bg-white text-black shadow-xs' : 'text-white/80'
                }`}
              >
                <MapIcon size={12} />
                <span>Map</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileViewMode('list')}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                  mobileViewMode === 'list' ? 'bg-white text-black shadow-xs' : 'text-white/80'
                }`}
              >
                <List size={12} />
                <span>List ({filteredProperties.length})</span>
              </button>
            </div>

          </div>

        </div>

        {/* AREA FILTER HORIZONTAL PILLS SCROLL */}
        <div className="w-full mt-2.5 pt-2.5 border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-semibold shrink-0 mr-1 flex items-center gap-1">
            <Layers size={11} />
            <span className="hidden sm:inline">Select Area:</span>
          </span>
          {mapAreas.map((area) => {
            const isSelected = currentArea.id === area.id;
            return (
              <button
                key={area.id}
                type="button"
                onClick={() => handleSelectArea(area.id)}
                className={`text-[11px] sm:text-[12px] font-semibold px-3 py-1 rounded-full whitespace-nowrap transition-all duration-150 cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-black text-white shadow-xs font-bold scale-[1.02]'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-400' : 'bg-gray-400'}`} />
                <span>{area.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* MAIN FULL-HEIGHT SPLIT WORKSPACE */}
      <div className="flex-1 min-h-0 w-full flex relative overflow-hidden">

        {/* LEFT PROPERTIES LIST SECTION (Fixed Width, Full Height, ONLY THIS SCROLLS) */}
        <div 
          className={`h-full flex flex-col bg-white border-r border-black/10 shrink-0 z-10 overflow-hidden transition-all duration-300 ${
            // Mobile: conditional on mobileViewMode
            mobileViewMode === 'list' ? 'w-full block' : 'hidden',
            // Tablet & Desktop: conditional on sidebarOpen
            sidebarOpen ? 'md:flex md:w-[340px] lg:w-[400px] xl:w-[440px]' : 'md:hidden'
          }`}
        >
          {/* Sidebar Top: Search & Category Filter (Mobile) */}
          <div className="p-3 border-b border-gray-100 bg-[#FBFBFA] shrink-0 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[12px] font-bold text-gray-900 uppercase tracking-wider block">
                  {currentArea.name} Portfolio
                </span>
                <span className="text-[10px] text-gray-500 font-medium">
                  {filteredProperties.length} residences available
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  centerMap();
                  setMobileViewMode('map');
                }}
                className="text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2.5 py-1 rounded-md flex items-center gap-1 transition-all cursor-pointer shadow-2xs hover:scale-102 active:scale-98"
                title="Show properties in map"
              >
                <MapPin size={12} className="text-amber-700" />
                <span>Map View</span>
              </button>
            </div>

            {/* Mobile Category Pills inside sidebar */}
            <div className="flex md:hidden items-center gap-1 overflow-x-auto no-scrollbar pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-md whitespace-nowrap border transition-all ${
                    selectedCategory === cat
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-700 border-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search residences or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-[12px] bg-white border border-gray-200 rounded-lg pl-8 pr-7 py-1.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black transition-colors"
              />
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* SCROLLABLE PROPERTIES CONTAINER (ONLY THIS SCROLLS) */}
          <div className="flex-1 min-h-0 h-full overflow-y-auto divide-y divide-gray-100 p-2.5 space-y-2.5">
            {filteredProperties.length === 0 ? (
              <div className="py-16 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400 mb-3">
                  <MapPin size={22} />
                </div>
                <h4 className="text-[14px] font-bold text-gray-900 mb-1">
                  No residences in {currentArea.name}
                </h4>
                <p className="text-[12px] text-gray-500 mb-4 max-w-xs mx-auto">
                  Try switching area or clearing category filters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    handleSelectArea('all');
                    setSelectedCategory('All');
                    setSearchQuery('');
                  }}
                  className="text-[11px] font-semibold bg-black text-white px-3.5 py-1.5 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  View All Areas
                </button>
              </div>
            ) : (
              filteredProperties.map((property) => {
                const isActive = activePropertyId === property.id;
                const isRent = property.marketCategory === 'rent' || property.listingType === 'FOR RENT' || (property.priceFormatted && (property.priceFormatted.includes('/mo') || property.priceFormatted.includes('year') || property.priceFormatted.includes('/yr')));
                const shortPrice = property.priceFormatted;

                return (
                  <div
                    key={property.id}
                    onClick={() => handlePropertyCardClick(property)}
                    className={`p-2.5 rounded-xl border transition-all duration-200 cursor-pointer flex gap-3 group ${
                      isActive 
                        ? 'bg-amber-50/70 border-black shadow-md ring-1 ring-black' 
                        : 'bg-white hover:bg-gray-50/90 border-gray-200/90 hover:border-gray-300'
                    }`}
                  >
                    {/* Thumbnail Image */}
                    <div className="relative w-24 h-22 sm:w-28 sm:h-24 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                      <img
                        src={property.images && property.images[0]}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <span className="absolute top-1 left-1 text-[8.5px] font-bold px-1.5 py-0.5 rounded-md bg-black/80 text-white backdrop-blur-xs uppercase tracking-wider">
                        {property.marketCategory || 'Luxury'}
                      </span>
                    </div>

                    {/* Content Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h4 className="text-[13px] font-bold text-gray-900 group-hover:text-black line-clamp-1 leading-snug">
                          {property.title}
                        </h4>
                        <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                          {property.location}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-[10.5px] text-gray-600 font-medium my-0.5">
                        <span>{property.beds} Beds</span>
                        <span>&bull;</span>
                        <span>{property.baths} Baths</span>
                        <span>&bull;</span>
                        <span>{property.sqft ? property.sqft.toLocaleString() + ' sqft' : ''}</span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                        <div className="text-[13px] font-extrabold text-black">
                          {shortPrice}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePropertyCardClick(property);
                            }}
                            className="text-[10.5px] font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 px-2 py-0.5 rounded transition-all flex items-center gap-1 shadow-2xs hover:scale-102 active:scale-98 cursor-pointer"
                            title="Show this property on the map"
                          >
                            <MapPin size={11} className="text-amber-600" />
                            <span>Map View</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onNavigate) onNavigate(`/property/${property.id}`);
                            }}
                            className="text-[10px] font-semibold bg-black text-white px-2 py-0.5 rounded hover:bg-gray-800 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span>Details</span>
                            <ExternalLink size={9} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT MAP SECTION (Full-Screen on Mobile when in 'map' mode; Split-Workspace on Desktop/Tablet) */}
        <div 
          className={
            mobileViewMode === 'map'
              ? 'fixed inset-0 z-[10000] w-full h-[100dvh] flex flex-col md:relative md:inset-auto md:z-0 md:flex-1 md:h-full md:min-h-0'
              : 'hidden md:block md:relative md:inset-auto md:z-0 md:flex-1 md:h-full md:min-h-0'
          }
        >
          {/* Google Maps listing explorer */}
          <div 
            ref={mapContainerRef} 
            role="region" aria-label="Property map"
            className="google-property-map w-full h-full min-h-full bg-slate-100"
          />

          {(!mapReady || sdkError) && (
            <div role="status" className="absolute inset-0 flex items-center justify-center p-8 bg-stone-50 text-sm text-stone-600">
              {sdkError ? 'The map is temporarily unavailable. You can still browse the property list.' : 'Loading map…'}
            </div>
          )}

          {/* MOBILE FULL-SCREEN FLOATING TOP CONTROLS */}
          {mobileViewMode === 'map' && (
            <div className="md:hidden absolute top-3 inset-x-3 z-[10001] bg-black/90 text-white backdrop-blur-md rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.45)] border border-white/15 p-2.5 space-y-2 pointer-events-auto">
              {/* Top Row: Back to List | Title & Active Area | Currency Selector */}
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setMobileViewMode('list')}
                  className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all shrink-0 cursor-pointer shadow-xs"
                  title="Return to List View"
                >
                  <ArrowLeft size={13} />
                  <span>List ({filteredProperties.length})</span>
                </button>

                <div className="min-w-0 text-center flex-1 px-1">
                  <div className="text-[12px] font-bold text-white flex items-center justify-center gap-1 truncate">
                    <MapPin size={12} className="text-amber-400 shrink-0" />
                    <span className="truncate">{currentArea.name}</span>
                  </div>
                  <div className="text-[10px] text-white/60 font-medium">
                    {filteredProperties.length} residences on map
                  </div>
                </div>

                {/* Mobile Currency Picker */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    disabled onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
                    className="flex items-center gap-1 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white px-2 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                    title="Currency conversion unavailable; prices use source currencies"
                  >
                    <span className="text-[13px]">{activeCurrency.flag}</span>
                    <span>{activeCurrency.code}</span>
                    <ChevronDown size={12} className={`transition-transform duration-200 ${isCurrencyDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu when clicked on mobile */}
                  {isCurrencyDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-[220px] bg-white text-gray-900 rounded-xl shadow-2xl border border-gray-200 py-1.5 z-[10005]">
                      <div className="max-h-[200px] overflow-y-auto divide-y divide-gray-100">
                        {CURRENCY_OPTIONS.map((c) => (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => {
                              setCurrencyCode(c.code);
                              setIsCurrencyDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 flex items-center justify-between text-xs hover:bg-gray-50 cursor-pointer ${
                              currencyCode === c.code ? 'font-bold bg-amber-50 text-amber-900' : ''
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <span>{c.flag}</span>
                              <span>{c.code}</span>
                              <span className="text-gray-400 text-[10px]">({c.symbol})</span>
                            </span>
                            {currencyCode === c.code && <Check size={12} className="text-black" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Area Horizontal Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-white/10">
                {mapAreas.map((area) => {
                  const isSelected = currentArea.id === area.id;
                  return (
                    <button
                      key={area.id}
                      type="button"
                      onClick={() => handleSelectArea(area.id)}
                      className={`text-[10.5px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap transition-all duration-150 cursor-pointer shrink-0 flex items-center gap-1 ${
                        isSelected
                          ? 'bg-white text-black font-bold shadow-xs scale-102'
                          : 'bg-white/15 text-white/90 hover:bg-white/25 border border-white/10'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-400' : 'bg-gray-400'}`} />
                      <span>{area.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mobile Recenter Button */}
          {mobileViewMode === 'map' && (
            <button
              type="button"
              onClick={() => {
                centerMap();
              }}
              className="md:hidden absolute top-30 right-3 z-[10001] w-9 h-9 rounded-full bg-white/95 text-gray-900 shadow-[0_8px_20px_rgba(0,0,0,0.3)] border border-gray-200 flex items-center justify-center hover:bg-white active:scale-95 transition-all cursor-pointer"
              title="Recenter area"
            >
              <Compass size={17} className="text-black" />
            </button>
          )}

          {/* Floating Map Hint / Guide at top-right (Desktop & Tablet) */}
          <div className="absolute top-4 right-4 z-[1000] hidden md:flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-black/10">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-gray-800">
              Click price pins to view residence info
            </span>
          </div>

          {/* Floating Area Tag at bottom left (Desktop & Tablet) */}
          <div className="absolute bottom-5 left-5 z-[1000] bg-black/90 text-white backdrop-blur-md px-3.5 py-2 rounded-xl shadow-xl border border-white/10 hidden md:block">
            <div className="text-[10px] uppercase tracking-wider text-white/60 font-mono">
              Active Area
            </div>
            <div className="text-[13px] font-bold text-white flex items-center gap-2">
              <span>{currentArea.name}</span>
              <span className="text-amber-400 text-[11px]">
                ({filteredProperties.length} residences)
              </span>
            </div>
          </div>

          {/* Floating Mobile Bottom Card when property is selected on full-screen map */}
          {activeProperty && mobileViewMode === 'map' && (
            <div className="md:hidden absolute bottom-20 inset-x-3 z-[10001] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-gray-200 p-3 animate-fade-in pointer-events-auto">
              <button
                type="button"
                onClick={() => setActivePropertyId(null)}
                className="absolute top-2.5 right-2.5 text-gray-400 hover:text-black w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer"
                title="Dismiss"
              >
                <X size={15} />
              </button>
              <div className="flex items-center gap-3">
                <img
                  src={activeProperty.images && activeProperty.images[0]}
                  alt={activeProperty.title}
                  className="w-22 h-20 object-cover rounded-xl shrink-0"
                />
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black text-white">
                      {activeProperty.marketCategory || 'Luxury'}
                    </span>
                    <span className="text-[10px] text-gray-500 font-medium truncate">
                      {activeProperty.neighborhood || activeProperty.location}
                    </span>
                  </div>
                  <h4 className="text-[12px] font-bold text-gray-900 leading-snug truncate mt-0.5">
                    {activeProperty.title}
                  </h4>
                  <div className="text-[13px] font-extrabold text-black mt-0.5">
                    {activeProperty.priceFormatted}
                  </div>
                  <div className="text-[10px] text-gray-500 font-medium">
                    {activeProperty.sqft ? activeProperty.sqft.toLocaleString() + ' ft²' : ''} &bull; {activeProperty.beds} Beds &bull; {activeProperty.baths} Baths
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate && onNavigate(`/property/${activeProperty.id}`)}
                    className="mt-1 text-[11px] font-bold text-black underline underline-offset-2 flex items-center gap-1 hover:text-amber-700 cursor-pointer"
                  >
                    <span>View Property Details</span>
                    <ExternalLink size={10} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Floating Mobile Switcher Pill on Full-Screen Map */}
          {mobileViewMode === 'map' && (
            <div className="md:hidden absolute bottom-5 left-1/2 -translate-x-1/2 z-[10001] pointer-events-auto">
              <button
                type="button"
                onClick={() => setMobileViewMode('list')}
                className="bg-black text-white px-5 py-2.5 rounded-full shadow-[0_12px_35px_rgba(0,0,0,0.6)] flex items-center gap-2 text-[12.5px] font-bold border border-white/20 active:scale-95 transition-all cursor-pointer"
              >
                <List size={15} />
                <span>List View ({filteredProperties.length})</span>
              </button>
            </div>
          )}

        </div>

      </div>

      {/* Floating Mobile View Switcher Pill at bottom center (When in List mode) */}
      {mobileViewMode === 'list' && (
        <div className="md:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-[2000]">
          <button
            type="button"
            onClick={() => {
              centerMap();
              setMobileViewMode('map');
            }}
            className="bg-black text-white px-5 py-2.5 rounded-full shadow-[0_12px_30px_rgba(0,0,0,0.5)] flex items-center gap-2 text-[12.5px] font-bold border border-white/20 active:scale-95 transition-all cursor-pointer"
          >
            <MapPin size={15} className="text-amber-400" />
            <span>Map View</span>
          </button>
        </div>
      )}

    </div>
  );
}
