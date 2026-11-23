import {hasDisplayValue, displayValues} from '../lib/display-data.mjs';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Mail,
  MapPin,
  Phone,
  Quote, Share2,
  Star
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import PropertyCard from './PropertyCard';
import RichText from './RichText';
import QuickLinkCards from './QuickLinkCards';
import ErrorPage from './ErrorPage';
import OfficialProfileLinks from './OfficialProfileLinks';
import './AgentProfile.css';
import {popularAreaLinks} from '../lib/property-popularity.mjs';

export default function AgentDetailPage({
  agent,
  properties = [],
  quickLinkClicks = [],
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
    return <ErrorPage variant="advisor" embedded onNavigate={onNavigate} />;
  }

  const configuredAgency=typeof agent.agency==='string' ? agent.agency.trim():'';
  // Agency identity supplied for this profile; other brokers still require feed data.
  const profileAgency=agent.name?.trim().toLowerCase()==='arman alam' ? 'Al Baqa Properties LLC' : '';
  const agencyName=hasDisplayValue(configuredAgency) ? configuredAgency : profileAgency;
  const languages=displayValues(agent.languages);
  const experience=hasDisplayValue(agent.experience) ? String(agent.experience).replace(/^(\d+(?:\.\d+)?)\s*\+?\s*(?:years?)?$/i,'$1+ years') : '';
  const metrics=[
    {label:'Experience',value:experience,labelClass:'text-base sm:text-lg',valueClass:'text-base sm:text-lg font-bold text-[#111827] font-sans'},
    {label:'License ID',value:agent.licenseId,labelClass:'text-base sm:text-lg',valueClass:'text-base sm:text-lg font-mono font-bold text-bronze block pt-0.5'},
    {label:'Languages',value:languages.join(', '),labelClass:'text-base sm:text-lg',valueClass:'text-xs sm:text-[13px] font-semibold text-[#111827] block whitespace-normal break-words'},
    {label:'Career Volume',value:agent.careerVolume,labelClass:'text-base sm:text-lg',valueClass:'text-base sm:text-lg font-bold text-[#111827] font-sans'},
  ].filter(metric=>hasDisplayValue(metric.value));

  // Find properties belonging to this agent (for Arman Alam, represents his full exclusive portfolio)
  const agentProperties = properties.filter(p => p.agentId === agent.id && p.status === 'ACTIVE');

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="profile-page w-full min-h-screen bg-[#FAF8F5] text-[#111827] pt-24 sm:pt-28 lg:pt-32 pb-24">
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 space-y-12 sm:space-y-16">

        {/* 2. PROFILE HEADER (SPLIT BALANCED SECTION) */}
        <div className="profile-header grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">

          {/* Left Column: Portrait & Direct Contact Actions */}
          <div className="lg:col-span-5 flex flex-col space-y-2.5">
            {/* Complete Portrait Container */}
            <div className="profile-portrait relative h-[380px] sm:h-[420px] lg:h-[430px] w-full rounded-[16px] overflow-hidden bg-stone-200 border border-black/[0.08] shadow-md shrink-0">
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
                {hasDisplayValue(agent.careerVolume) && (<div>
                  <span className="text-[9.5px] font-mono uppercase tracking-widest text-white/80 block">
                    Career Realization
                  </span>
                  <span className="text-[20px] sm:text-[22px] font-bold font-sans tracking-tight">
                    {agent.careerVolume}
                  </span>
                </div>)}

                {hasDisplayValue(experience) && (<div className="ml-auto px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-[10.5px] font-mono">
                  {experience}
                </div>)}
              </div>
            </div>

            {/* Direct contact actions and official profile links. */}
            <div className="profile-actions space-y-2 pt-0.5">
              <div className="profile-contact-actions grid grid-cols-3 gap-2">
                {hasDisplayValue(agent.phone) && (<a
                  href={agent.phone ? `tel:${agent.phone}` : undefined}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-white border border-black/[0.08] text-[#111827] text-[11px] sm:text-xs font-semibold uppercase tracking-wider hover:bg-stone-50 hover:border-black transition-all shadow-2xs"
                  title="Call Agent" aria-label="Call Agent"
                >
                  <Phone size={13} className="text-bronze shrink-0" />
                  <span className="truncate">Call Agent</span>
                </a>)}

                {hasDisplayValue(agent.email) && (<a
                  href={agent.email ? `mailto:${agent.email}` : undefined}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-white border border-black/[0.08] text-[#111827] text-[11px] sm:text-xs font-semibold uppercase tracking-wider hover:bg-stone-50 hover:border-black transition-all shadow-2xs"
                  title="Email Agent" aria-label="Email Agent"
                >
                  <Mail size={13} className="text-bronze shrink-0" />
                  <span className="truncate">Email Agent</span>
                </a>)}

                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-white border border-black/[0.08] text-[#111827] text-[11px] sm:text-xs font-semibold uppercase tracking-wider hover:bg-stone-50 hover:border-black transition-all shadow-2xs cursor-pointer"
                  title="Share Profile" aria-label={copied ? "Profile link copied":"Share Profile"}
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

              <OfficialProfileLinks agent={agent}/>
            </div>
          </div>

          {/* Right column: details, expanded biography and agency. */}
          <div className="profile-details min-w-0 lg:col-span-7 flex flex-col gap-4">

            {/* Title & Specialization Header */}
            <div className="space-y-1.5 pb-3 border-b border-black/[0.08]">
              <h1 className="text-[32px] sm:text-[38px] font-bold text-[#111827] tracking-tight font-sans leading-[1.1]">
                {agent.name}
              </h1>

              {(hasDisplayValue(agent.title) || hasDisplayValue(agent.region)) && <div className="profile-meta flex flex-wrap items-center gap-2.5 text-[13px] text-[#6B7280]">
                {hasDisplayValue(agent.title) && <span className="font-medium text-[#111827]">{agent.title}</span>}
                {hasDisplayValue(agent.region) && <span className="profile-region inline-flex min-w-0 items-start gap-2.5">
                  {hasDisplayValue(agent.title) && <span className="hidden md:inline" aria-hidden="true">•</span>}
                  <MapPin size={14} className="mt-0.5 shrink-0 md:hidden" aria-hidden="true"/>
                  <span className="min-w-0 break-words">{agent.region}</span>
                </span>}
              </div>}
            </div>

            {/* Only show metrics supplied by the broker. */}
            {metrics.length > 0 && <div className="profile-metrics grid gap-3 bg-white p-3.5 rounded-2xl border border-black/[0.08] shadow-xs">
              {metrics.map(metric=><div key={metric.label} className="min-w-0 space-y-0.5">
                <span className={`profile-metric-label ${metric.labelClass} uppercase tracking-wider text-[#9CA3AF] block font-mono`}>{metric.label}</span>
                <span className={`profile-metric-value ${metric.valueClass}`}>{metric.value}</span>
              </div>)}
            </div>}

            {/* Biography uses the space released by the official links. */}
            {hasDisplayValue(agent.bio) && (<div className="profile-biography space-y-1.5">
              <h3 className="text-[11px] uppercase tracking-luxury text-[#111827] font-semibold flex items-center justify-between">
                <span>Executive Biography &amp; Practice</span>
              </h3>
              <div className="description-scroll-region" tabIndex={0} role="region" aria-label="Broker biography">
                <RichText value={agent.bio} className="profile-bio text-[14px] text-[#475569] leading-[1.75] font-normal"/>
              </div>
            </div>)}

            {(hasDisplayValue(agencyName) || hasDisplayValue(agent.phone) || hasDisplayValue(agent.email)) && <div className="profile-agency p-3.5 rounded-xl bg-white border border-black/[0.08] flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-2.5">
              {hasDisplayValue(agencyName) && <div className="min-w-0 w-full space-y-0.5 sm:w-auto">
                <span className="text-base sm:text-lg font-semibold text-[#111827] block whitespace-normal break-words">Agency: {agencyName}</span>
              </div>}
              {(hasDisplayValue(agent.phone) || hasDisplayValue(agent.email)) && <div className="profile-direct-links flex min-w-0 flex-wrap items-center gap-3 text-base sm:text-lg font-mono">
                {hasDisplayValue(agent.phone) && <a href={`tel:${agent.phone}`} className="text-bronze font-bold hover:underline">{agent.phone}</a>}
                {hasDisplayValue(agent.phone) && hasDisplayValue(agent.email) && <span>•</span>}
                {hasDisplayValue(agent.email) && <a href={`mailto:${agent.email}`} className="min-w-0 break-all text-[#111827] hover:underline">{agent.email}</a>}
              </div>}
            </div>}

            {agentProperties.length > 0 && <div className="profile-area-links">
              <QuickLinkCards areas={popularAreaLinks(agentProperties, {clicks:quickLinkClicks})}/>
            </div>}

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
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${activeTestimonialIdx === dotIdx
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
