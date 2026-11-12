import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronRight, ChevronLeft, ArrowLeft, Phone, Mail, Calendar, ShieldCheck, 
  Award, Globe2, Star, Quote, Share2, Check, ExternalLink 
} from 'lucide-react';
import PropertyCard from './PropertyCard';
import RichText from './RichText';

export default function AgentDetailPage({ 
  agent, 
  properties = [], 
  favorites = [], 
  onToggleFavorite, 
  onSelectProperty, 
  onNavigate,
  onScheduleShowing,
  onContactAgent
}) {
  const [copied, setCopied] = useState(false);
  const [activeTestimonialIdx, setActiveTestimonialIdx] = useState(0);
  const [isTestimonialsPaused, setIsTestimonialsPaused] = useState(false);
  const testimonialsScrollRef = useRef(null);

  const testimonialsCount = agent?.testimonials?.length || 0;

  // Auto-advance client testimonials every 4 seconds when not paused
  useEffect(() => {
    if (isTestimonialsPaused || testimonialsCount <= 1) return;

    const timer = setInterval(() => {
      setActiveTestimonialIdx((prev) => {
        const next = (prev + 1) % testimonialsCount;
        scrollToTestimonial(next);
        return next;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [isTestimonialsPaused, testimonialsCount]);

  const scrollToTestimonial = (index) => {
    if (testimonialsScrollRef.current) {
      const container = testimonialsScrollRef.current;
      const targetCard = container.children[index];
      if (targetCard) {
        const targetLeft = targetCard.offsetLeft - container.offsetLeft;
        container.scrollTo({
          left: targetLeft,
          behavior: 'smooth'
        });
      }
    }
  };

  const handlePrevTestimonial = () => {
    const next = (activeTestimonialIdx - 1 + testimonialsCount) % testimonialsCount;
    setActiveTestimonialIdx(next);
    scrollToTestimonial(next);
  };

  const handleNextTestimonial = () => {
    const next = (activeTestimonialIdx + 1) % testimonialsCount;
    setActiveTestimonialIdx(next);
    scrollToTestimonial(next);
  };

  if (!agent) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] pt-36 pb-20 px-6 text-center space-y-4">
        <h2 className="font-serif text-3xl text-[#111827]">Advisor Profile Not Found</h2>
        <p className="text-sm text-[#6B7280]">The requested advisor portfolio may have been updated or moved.</p>
        <button
          onClick={() => onNavigate && onNavigate('/agents')}
          className="px-6 py-2.5 rounded-lg bg-black text-white text-xs uppercase tracking-wider font-semibold cursor-pointer"
        >
          View All Advisors
        </button>
      </div>
    );
  }

  // Find properties belonging to this agent (for Arman Alam, represents his full exclusive portfolio)
  const agentProperties = properties.filter(p => p.agentId === agent.id && p.status === 'ACTIVE');

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="w-full min-h-screen bg-[#FAF8F5] text-[#111827] pt-24 sm:pt-28 lg:pt-32 pb-24">
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 space-y-12 sm:space-y-16">
        
        {/* 2. PROFILE HEADER (SPLIT BALANCED SECTION) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          
          {/* Left Column: Portrait & Direct Contact Actions */}
          <div className="lg:col-span-5 flex flex-col space-y-2.5">
            {/* Complete Portrait Container */}
            <div className="relative h-[380px] sm:h-[420px] lg:h-[430px] w-full rounded-[16px] overflow-hidden bg-stone-200 border border-black/[0.08] shadow-md shrink-0">
              <img
                src={agent.avatar || undefined}
                alt={agent.name}
                className="w-full h-full object-cover object-[center_15%]"
                loading="eager"
                onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

              {/* Career Volume Badge */}
              <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-center justify-between text-white z-10">
                <div>
                  <span className="text-[9.5px] font-mono uppercase tracking-widest text-white/80 block">
                    Career Realization
                  </span>
                  <span className="text-[20px] sm:text-[22px] font-bold font-sans tracking-tight">
                    {agent.careerVolume}
                  </span>
                </div>

                <div className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-[10.5px] font-mono">
                  {agent.experience}
                </div>
              </div>
            </div>

            {/* Direct Contact CTAs & Consultation with tight spacing */}
            <div className="space-y-2 pt-0.5">
              <div className="grid grid-cols-3 gap-2">
                <a
                  href={agent.phone ? `tel:${agent.phone}` : undefined}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-white border border-black/[0.08] text-[#111827] text-[11px] sm:text-xs font-semibold uppercase tracking-wider hover:bg-stone-50 hover:border-black transition-all shadow-2xs"
                  title="Call Agent"
                >
                  <Phone size={13} className="text-bronze shrink-0" />
                  <span className="truncate">Call Agent</span>
                </a>

                <a
                  href={agent.email ? `mailto:${agent.email}` : undefined}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-white border border-black/[0.08] text-[#111827] text-[11px] sm:text-xs font-semibold uppercase tracking-wider hover:bg-stone-50 hover:border-black transition-all shadow-2xs"
                  title="Email Agent"
                >
                  <Mail size={13} className="text-bronze shrink-0" />
                  <span className="truncate">Email Agent</span>
                </a>

                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-white border border-black/[0.08] text-[#111827] text-[11px] sm:text-xs font-semibold uppercase tracking-wider hover:bg-stone-50 hover:border-black transition-all shadow-2xs cursor-pointer"
                  title="Share Profile"
                >
                  {copied ? (
                    <>
                      <Check size={13} className="text-emerald-600 shrink-0" />
                      <span className="truncate text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Share2 size={13} className="text-bronze shrink-0" />
                      <span className="truncate">Share Profile</span>
                    </>
                  )}
                </button>
              </div>

              {/* Primary Schedule Consultation Button */}
              <button
                onClick={() => onContactAgent && onContactAgent(agent)}
                className="w-full py-3 px-4 rounded-xl bg-[#000000] text-white text-xs font-semibold uppercase tracking-widest hover:bg-[#1E1E1E] active:scale-[0.99] transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Calendar size={14} />
                <span>Schedule Private Consultation</span>
              </button>
            </div>
          </div>

          {/* Right Column: Details, Biography, Key Metrics & Social */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            
            {/* Title & Specialization Header */}
            <div className="space-y-1.5 pb-3 border-b border-black/[0.08]">
              <h1 className="text-[32px] sm:text-[38px] font-bold text-[#111827] tracking-tight font-sans leading-[1.1]">
                {agent.name}
              </h1>

              <div className="flex flex-wrap items-center gap-2.5 text-[13px] text-[#6B7280]">
                <span className="font-medium text-[#111827]">{agent.title}</span>
                <span>•</span>
                <span>{agent.region}</span>
              </div>
            </div>

            {/* 4-Item Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3.5 rounded-2xl border border-black/[0.08] shadow-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase tracking-wider text-[#9CA3AF] block font-mono">Experience</span>
                <span className="text-base sm:text-lg font-bold text-[#111827] font-sans">{agent.experience}</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] uppercase tracking-wider text-[#9CA3AF] block font-mono">License ID</span>
                <span className="text-xs font-mono font-bold text-bronze block pt-0.5">{agent.licenseId}</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] uppercase tracking-wider text-[#9CA3AF] block font-mono">Languages</span>
                <span className="text-xs sm:text-[13px] font-semibold text-[#111827] block truncate">
                  {agent.languages?.length ? agent.languages.join(', ') : '—'}
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] uppercase tracking-wider text-[#9CA3AF] block font-mono">Career Volume</span>
                <span className="text-base sm:text-lg font-bold text-[#111827] font-sans">{agent.careerVolume}</span>
              </div>
            </div>

            {/* Detailed Biography - IN DEDICATED SCROLLABLE CONTAINER IF LARGE */}
            <div className="space-y-1.5">
              <h3 className="text-[11px] uppercase tracking-luxury text-[#111827] font-semibold flex items-center justify-between">
                <span>Executive Biography &amp; Practice</span>
              </h3>
              <div 
                className="max-h-[140px] sm:max-h-[160px] overflow-y-auto pr-2 text-[13.5px] sm:text-[14px] text-[#475569] leading-[1.65] font-normal rounded-xl border border-black/[0.06] bg-white/60 p-3.5 shadow-2xs"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#CBD5E1 transparent' }}
              >
                <RichText value={agent.bio} />
              </div>
            </div>

            {/* Direct Line & Agency Information (Al Baqa Properties LLC) */}
            <div className="p-3.5 rounded-xl bg-white border border-black/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-[#111827] block">Agency: {agent.agency}</span>
                <span className="text-[11px] text-[#6B7280]">Official Brokerage &amp; Prime Advisory Partner</span>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <a href={agent.phone ? `tel:${agent.phone}` : undefined} className="text-bronze font-bold hover:underline">
                  {agent.phone}
                </a>
                <span>•</span>
                <a href={agent.email ? `mailto:${agent.email}` : undefined} className="text-[#111827] hover:underline">
                  {agent.email}
                </a>
              </div>
            </div>

            {/* Social & Portal Connectivity */}
            <div className="space-y-1.5 pt-0.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#9CA3AF] block">Official Channels:</span>
              <div className="flex flex-wrap items-center gap-2">
                <a 
                  href={agent.socialLinks?.facebook} 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-xs font-medium text-[#111827] hover:border-black transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <span>Facebook</span>
                  <ExternalLink size={11} className="text-[#9CA3AF]" />
                </a>
                <a 
                  aria-disabled="true" title="Profile link unavailable" 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-xs font-medium text-[#111827] hover:border-black transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <span>Property Finder</span>
                  <ExternalLink size={11} className="text-[#9CA3AF]" />
                </a>
                <a 
                  aria-disabled="true" title="Profile link unavailable" 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-xs font-medium text-[#111827] hover:border-black transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <span>Bayut</span>
                  <ExternalLink size={11} className="text-[#9CA3AF]" />
                </a>
                <a 
                  href={agent.socialLinks?.linkedin} 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-xs font-medium text-[#111827] hover:border-black transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <span>LinkedIn</span>
                  <ExternalLink size={11} className="text-[#9CA3AF]" />
                </a>
                <a 
                  href={agent.socialLinks?.instagram} 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-xs font-medium text-[#111827] hover:border-black transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <span>Instagram</span>
                  <ExternalLink size={11} className="text-[#9CA3AF]" />
                </a>
              </div>
            </div>

          </div>
        </div>

        {/* 3. AGENT'S ACTIVE LISTINGS GRID */}
        <div className="pt-8 space-y-8 border-t border-black/[0.08]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-black inline-block" />
                <span className="text-[12px] font-medium tracking-[0.12em] uppercase text-[#111827]">
                  EXCLUSIVE PORTFOLIO
                </span>
              </div>
              <h2 className="text-[28px] sm:text-[34px] font-semibold text-[#111827] tracking-tight">
                Active Listings by {agent.name}
              </h2>
            </div>
          </div>

          {agentProperties.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-black/[0.06] space-y-2">
              <p className="text-base text-[#111827] font-medium">No active listings available</p>
              <p className="text-xs text-[#6B7280]">
                Contact {agent.name} directly to discuss your requirements.
              </p>
              <button
                onClick={() => onContactAgent && onContactAgent(agent)}
                className="mt-3 px-5 py-2.5 rounded-lg bg-black text-white text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                Inquire Off-Market
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {agentProperties.slice(0, 3).map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    isFavorite={favorites.includes(property.id)}
                    onToggleFavorite={onToggleFavorite}
                    onSelectProperty={onSelectProperty}
                  />
                ))}
              </div>

              {agentProperties.length > 3 && (
                <div className="text-center pt-2">
                  <a
                    href="/properties"
                    onClick={(event) => {
                      if (!onNavigate || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                      event.preventDefault();
                      onNavigate('/properties');
                    }}
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-semibold uppercase tracking-widest transition-all duration-200 shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    <span>View More Properties ({agentProperties.length} Total)</span>
                    <ChevronRight size={14} />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. CLIENT TESTIMONIALS (AUTOMATIC SCROLLABLE ROW) */}
        {agent.testimonials && agent.testimonials.length > 0 && (
          <div className="pt-8 space-y-6 sm:space-y-8 border-t border-black/[0.08]">
            
            {/* Section Header with Controls */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-[#C5A059] inline-block" />
                  <span className="text-[12px] font-medium tracking-[0.12em] uppercase text-[#C5A059]">
                    PATRON REFLECTIONS
                  </span>
                </div>
                <h2 className="text-[26px] xs:text-[28px] sm:text-[34px] font-semibold text-[#111827] tracking-tight">
                  Client Testimonials for {agent.name}
                </h2>
              </div>

              {/* Navigation Controls & Auto-scroll status */}
              <div className="flex items-center gap-3">
                {/* Subtle auto indicator */}
                <div className="hidden xs:flex items-center gap-1.5 text-xs text-[#6B7280] font-mono pr-2">
                  <span className={`w-2 h-2 rounded-full ${isTestimonialsPaused ? 'bg-amber-400' : 'bg-emerald-500 animate-pulse'}`} />
                  <span>{isTestimonialsPaused ? 'Paused' : 'Auto-Playing'}</span>
                </div>

                {/* Previous / Next buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handlePrevTestimonial}
                    aria-label="Previous testimonial"
                    className="w-9 h-9 rounded-lg border border-black/15 bg-white text-[#111827] flex items-center justify-center hover:bg-black hover:text-white transition-colors active:scale-95 shadow-sm cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextTestimonial}
                    aria-label="Next testimonial"
                    className="w-9 h-9 rounded-lg border border-black/15 bg-white text-[#111827] flex items-center justify-center hover:bg-black hover:text-white transition-colors active:scale-95 shadow-sm cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Horizontal Scrollable Row Container */}
            <div
              ref={testimonialsScrollRef}
              onMouseEnter={() => setIsTestimonialsPaused(true)}
              onMouseLeave={() => setIsTestimonialsPaused(false)}
              onTouchStart={() => setIsTestimonialsPaused(true)}
              onTouchEnd={() => setIsTestimonialsPaused(false)}
              className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory pb-4 pt-1 -mx-4 px-4 sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0 touch-pan-x"
            >
              {agent.testimonials.map((test, idx) => (
                <div
                  key={idx}
                  className="w-[85vw] max-w-[340px] xs:w-[80vw] xs:max-w-[390px] sm:w-[460px] md:w-[490px] lg:w-[520px] shrink-0 snap-start bg-white p-6 sm:p-8 rounded-2xl border border-black/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_35px_rgba(0,0,0,0.08)] transition-all flex flex-col justify-between space-y-6 select-none"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Quote size={28} className="text-[#C5A059] opacity-80 rotate-180" />
                      <div className="flex items-center gap-0.5 text-[#C5A059]">
                        {[...Array(test.rating || 5)].map((_, i) => (
                          <Star key={i} size={14} className="fill-[#C5A059]" />
                        ))}
                      </div>
                    </div>

                    <p className="font-serif text-base sm:text-lg lg:text-[19px] text-[#111827] leading-[1.6] italic">
                      "{test.quote}"
                    </p>
                  </div>

                  <div className="pt-4 border-t border-stone-100 flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm sm:text-base text-[#111827] truncate">
                        {test.clientName}
                      </h4>
                      <p className="text-xs text-[#6B7280] truncate">
                        {test.clientTitle}
                      </p>
                      <p className="text-[11px] font-mono text-bronze mt-1 font-medium truncate">
                        {test.transaction}
                      </p>
                    </div>

                    {test.verifiedYear && (
                      <span className="text-[10px] font-mono text-[#6B7280] bg-stone-50 border border-stone-200 px-2 py-0.5 rounded shrink-0">
                        {test.verifiedYear.replace('Verified Transaction • ', '')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Interactive Pagination Indicator Dots */}
            <div className="flex items-center justify-center gap-2 pt-2">
              {agent.testimonials.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() => {
                    setActiveTestimonialIdx(dotIdx);
                    scrollToTestimonial(dotIdx);
                  }}
                  aria-label={`Jump to review ${dotIdx + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    activeTestimonialIdx === dotIdx
                      ? 'w-7 bg-[#C5A059]'
                      : 'w-2 bg-stone-300 hover:bg-stone-400'
                  }`}
                />
              ))}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
