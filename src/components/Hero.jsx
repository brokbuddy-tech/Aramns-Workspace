import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, MapPin, Building2, ArrowRight, ChevronDown, Check, X 
} from 'lucide-react';

export default function Hero({ onNavigate, onAISearch }) {
  const [activeCategory, setActiveCategory] = useState('buy');
  const [location, setLocation] = useState('All Locations');
  const [propertyType, setPropertyType] = useState('All Types');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isPromptDropdownOpen, setIsPromptDropdownOpen] = useState(false);
  
  const dropdownRef = useRef(null);

  const categories = [
    { id: 'buy', label: 'Buy' },
    { id: 'rent', label: 'Rent' }
  ];

  const quickPrompts = [
    { text: 'Beachfront Villa with Private Berth', tag: 'Palm Jumeirah', icon: '🏝️' },
    { text: 'Penthouse with Private Infinity Pool', tag: 'Downtown Dubai', icon: '🏊' },
    { text: 'Golf Course Sanctuary in Emirates Hills', tag: 'Emirates Hills', icon: '⛳' },
    { text: 'Branded Luxury Sky Residence', tag: 'Skyline View', icon: '🌆' },
    { text: 'Waterfront Compound with Private Yacht Slip', tag: 'Jumeirah Bay', icon: '🛥️' },
    { text: 'Eco-Luxury Smart Villa in Saadiyat Island', tag: 'Saadiyat Island', icon: '🌿' }
  ];

  // Close dropdown on outside click or escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsPromptDropdownOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsPromptDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSearch = (customPrompt) => {
    const promptToUse = typeof customPrompt === 'string' ? customPrompt : aiPrompt;
    if (typeof customPrompt === 'string') {
      setAiPrompt(customPrompt);
    }

    setIsSearching(true);

    setTimeout(() => {
      setIsSearching(false);

      if (onAISearch) {
        onAISearch({
          category: activeCategory,
          location: location === 'All Locations' ? '' : location,
          propertyType: propertyType === 'All Types' ? '' : propertyType,
          query: promptToUse
        });
      } else if (onNavigate) {
        onNavigate(`/properties/${activeCategory}`);
      } else {
        const el = document.getElementById('properties');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 450);
  };

  const handleSelectPrompt = (promptText) => {
    setAiPrompt(promptText);
    setIsPromptDropdownOpen(false);
    handleSearch(promptText);
  };

  return (
    <section 
      id="home" 
      className="relative w-full min-h-[620px] sm:min-h-[700px] md:min-h-[760px] lg:min-h-screen flex flex-col justify-center sm:justify-end pt-22 sm:pt-26 md:pt-28 pb-10 sm:pb-14 md:pb-18 lg:pb-20 overflow-x-clip"
    >
      {/* 1. HERO BACKGROUND & ATMOSPHERE */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="/hero-daylight-villa.jpg"
          className="w-full h-full object-cover object-center"
        >
          <source src="/hero-section-video.mp4" type="video/mp4" />
          <img
            src="/hero-daylight-villa.jpg"
            alt="Sun-drenched architectural luxury villa in natural daylight with travertine patio and turquoise pool"
            className="w-full h-full object-cover object-center"
          />
        </video>

        {/* Soft bottom vignette to ensure pristine text legibility */}
        <div 
          className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/20 sm:from-black/85 sm:via-black/40 sm:to-black/15"
        />
      </div>

      {/* 2. HERO CONTENT BLOCK */}
      <div className="relative z-10 w-full px-3.5 sm:px-6 md:px-10 lg:px-12 xl:px-16 2xl:px-20">
        <div className="max-w-[1040px] mx-auto text-center flex flex-col items-center">
          
          {/* Main Headline - Balanced typography across Mobile, Tablet, and Desktop */}
          <h1 className="max-w-[880px] text-[25px] xs:text-[29px] sm:text-[36px] md:text-[46px] lg:text-[58px] xl:text-[62px] font-bold text-[#FFFFFF] tracking-[-0.02em] leading-[1.16] font-sans drop-shadow-[0_3px_16px_rgba(0,0,0,0.6)]">
            Your Trusted Partner in Luxury Real Estate
          </h1>

          {/* Sub-Headline / Body Text */}
          <p className="mt-2.5 sm:mt-3.5 max-w-[660px] text-[12px] sm:text-[14px] md:text-[16px] text-white/85 sm:text-white/90 font-normal leading-[1.5] sm:leading-[1.55] font-sans drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] px-2 sm:px-0">
            Welcome to Novalux, where exceptional architectural homes are curated to match your lifestyle. Explore prime private estates with AI-powered search.
          </p>

          {/* ====================================================
              HERO FILTER BAR WITH AI SEARCH ENGINE (RESPONSIVE & COMPACT)
              ==================================================== */}
          <div className="mt-5 sm:mt-8 md:mt-10 w-full max-w-[940px] bg-black/70 sm:bg-black/55 backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl md:rounded-3xl p-2.5 sm:p-4 md:p-5 shadow-[0_25px_60px_rgba(0,0,0,0.7)] text-left transition-all">
            
            {/* Top Row: Category Tabs & AI Indicator */}
            <div className="flex items-center justify-between gap-2 pb-2.5 sm:pb-3 md:pb-4 border-b border-white/10">
              
              {/* Category Switcher Tabs - Even 4-grid on mobile, flex on tablet/desktop */}
              <div className="grid grid-cols-4 sm:flex items-center gap-1 p-0.5 sm:p-1 bg-white/10 rounded-lg sm:rounded-xl border border-white/10 w-full sm:w-auto">
                {categories.map((cat) => {
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-1.5 sm:px-3.5 md:px-4 py-1.5 rounded-md sm:rounded-lg text-[11px] sm:text-xs md:text-[13px] font-medium transition-all duration-200 select-none cursor-pointer text-center truncate ${
                        isActive
                          ? 'bg-white text-black font-semibold shadow-sm scale-[1.01]'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* AI Badge (desktop/tablet) */}
              <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-medium text-white/90 shrink-0">
                <Sparkles size={12} className="text-amber-300 animate-pulse" />
                <span>AI Search Engine</span>
              </div>

            </div>

            {/* Filter Inputs Grid - 2x2 on Mobile/Tablet, 1 Row on Desktop */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="pt-2.5 sm:pt-3.5 space-y-2 sm:space-y-2.5"
            >
              <div className="grid grid-cols-12 gap-2 sm:gap-2.5 md:gap-3 items-center">
                
                {/* 1. Location / Neighborhood */}
                <div className="col-span-6 lg:col-span-3 bg-white/10 border border-white/15 rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 hover:bg-white/15 focus-within:border-white/30 transition-colors h-[48px] sm:h-[52px] flex flex-col justify-center">
                  <label className="flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-white/60 leading-none mb-1">
                    <MapPin size={10} className="text-white/70 shrink-0" />
                    <span className="truncate">Location</span>
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-transparent text-white text-[11px] sm:text-xs md:text-[13px] font-medium focus:outline-none cursor-pointer truncate"
                  >
                    <option className="bg-[#111827] text-white" value="All Locations">All Locations</option>
                    <option className="bg-[#111827] text-white" value="Palm Jumeirah">Palm Jumeirah</option>
                    <option className="bg-[#111827] text-white" value="Downtown Dubai">Downtown Dubai</option>
                    <option className="bg-[#111827] text-white" value="Emirates Hills">Emirates Hills</option>
                    <option className="bg-[#111827] text-white" value="Jumeirah Bay Island">Jumeirah Bay Island</option>
                    <option className="bg-[#111827] text-white" value="Saadiyat Island">Saadiyat Island</option>
                  </select>
                </div>

                {/* 2. Property Type */}
                <div className="col-span-6 lg:col-span-3 bg-white/10 border border-white/15 rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 hover:bg-white/15 focus-within:border-white/30 transition-colors h-[48px] sm:h-[52px] flex flex-col justify-center">
                  <label className="flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-white/60 leading-none mb-1">
                    <Building2 size={10} className="text-white/70 shrink-0" />
                    <span className="truncate">Type</span>
                  </label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full bg-transparent text-white text-[11px] sm:text-xs md:text-[13px] font-medium focus:outline-none cursor-pointer truncate"
                  >
                    <option className="bg-[#111827] text-white" value="All Types">All Types</option>
                    <option className="bg-[#111827] text-white" value="Signature Villa">Signature Villa</option>
                    <option className="bg-[#111827] text-white" value="Sky Penthouse">Sky Penthouse</option>
                    <option className="bg-[#111827] text-white" value="Waterfront Estate">Waterfront Estate</option>
                    <option className="bg-[#111827] text-white" value="Branded Residence">Branded Residence</option>
                  </select>
                </div>

                {/* 3. AI Natural Language Query Input */}
                <div className="col-span-8 lg:col-span-4 bg-white/10 border border-white/15 rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 hover:bg-white/15 focus-within:bg-white/15 focus-within:border-white/35 transition-colors h-[48px] sm:h-[52px] flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-white/60 leading-none">
                      <Sparkles size={10} className="text-amber-300 shrink-0" />
                      <span className="truncate">Ask AI</span>
                    </label>
                    {aiPrompt && (
                      <button
                        type="button"
                        onClick={() => setAiPrompt('')}
                        className="text-[10px] text-white/50 hover:text-white p-0.5 cursor-pointer"
                        title="Clear prompt"
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. Waterfront villa with private pool..."
                    className="w-full bg-transparent text-white placeholder-white/40 text-[11px] sm:text-xs md:text-[13px] focus:outline-none truncate"
                  />
                </div>

                {/* 4. AI Search Button */}
                <div className="col-span-4 lg:col-span-2">
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="w-full h-[48px] sm:h-[52px] px-2 sm:px-4 rounded-lg sm:rounded-xl bg-white text-black font-semibold text-xs sm:text-[13px] shadow-[0_4px_20px_rgba(255,255,255,0.25)] hover:bg-neutral-100 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-75 shrink-0"
                  >
                    {isSearching ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        <span className="text-[11px] sm:text-xs">Finding...</span>
                      </span>
                    ) : (
                      <>
                        <Sparkles size={13} className="text-purple-600 shrink-0" />
                        <span className="text-[11px] sm:text-xs md:text-[13px]">Search</span>
                        <ArrowRight size={12} className="shrink-0 hidden xs:inline" />
                      </>
                    )}
                  </button>
                </div>

              </div>

              {/* ====================================================
                  QUICK PROMPTS DROPDOWN (COMPACT & RESPONSIVE)
                  ==================================================== */}
              <div className="pt-1.5 relative" ref={dropdownRef}>
                <div className="flex items-center gap-2">
                  
                  {/* Label */}
                  <span className="text-[10px] sm:text-[11px] text-white/50 font-medium shrink-0 flex items-center gap-1">
                    <Sparkles size={10} className="text-amber-300/80 shrink-0" />
                    <span className="hidden xs:inline">Quick</span> Prompts:
                  </span>

                  {/* Dropdown Trigger Button */}
                  <button
                    type="button"
                    onClick={() => setIsPromptDropdownOpen(!isPromptDropdownOpen)}
                    aria-expanded={isPromptDropdownOpen}
                    aria-haspopup="listbox"
                    className={`flex-1 sm:flex-initial flex items-center justify-between gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border text-[11px] sm:text-xs transition-all cursor-pointer truncate max-w-full sm:max-w-md ${
                      isPromptDropdownOpen
                        ? 'bg-white/20 border-white/40 text-white shadow-sm'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80 hover:text-white'
                    }`}
                  >
                    <span className="truncate flex items-center gap-1.5">
                      <span className="text-[11px] shrink-0">⚡</span>
                      <span className="truncate">
                        {aiPrompt || "Choose a curated prompt idea..."}
                      </span>
                    </span>
                    <ChevronDown 
                      size={13} 
                      className={`text-white/60 shrink-0 transition-transform duration-200 ${
                        isPromptDropdownOpen ? 'rotate-180 text-white' : ''
                      }`} 
                    />
                  </button>

                  {/* Clear Prompt button if prompt is selected */}
                  {aiPrompt && (
                    <button
                      type="button"
                      onClick={() => setAiPrompt('')}
                      className="inline-flex items-center gap-1 text-[10px] text-white/50 hover:text-white transition-colors cursor-pointer"
                    >
                      <X size={10} />
                      <span className="hidden xs:inline">Reset</span>
                    </button>
                  )}

                </div>

                {/* Floating Dropdown Menu Panel (High z-index, elegant glassmorphism) */}
                {isPromptDropdownOpen && (
                  <div 
                    role="listbox"
                    className="absolute left-0 right-0 sm:right-auto sm:w-[440px] mt-2 z-50 bg-[#0A0E17]/95 backdrop-blur-2xl border border-white/25 rounded-xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] p-1.5 space-y-0.5 animate-fadeIn"
                  >
                    <div className="px-2.5 py-1 text-[10px] font-semibold text-white/40 uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
                      <span>Curated Architectural Searches</span>
                      <span className="text-[9px] text-amber-300/80">1-Tap AI Search</span>
                    </div>

                    <div className="max-h-[240px] overflow-y-auto space-y-0.5 pr-0.5">
                      {quickPrompts.map((prompt, idx) => {
                        const isSelected = aiPrompt === prompt.text;
                        return (
                          <button
                            key={idx}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => handleSelectPrompt(prompt.text)}
                            className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between gap-2.5 transition-colors cursor-pointer group ${
                              isSelected
                                ? 'bg-white/20 text-white font-medium'
                                : 'text-white/80 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="text-sm shrink-0">{prompt.icon}</span>
                              <span className="truncate text-[11px] sm:text-xs">{prompt.text}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-medium group-hover:text-white/80 group-hover:bg-white/15">
                                {prompt.tag}
                              </span>
                              {isSelected && <Check size={12} className="text-amber-300 shrink-0" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>

            </form>

          </div>

        </div>
      </div>
    </section>
  );
}
