import React, { useState, useEffect, useRef } from 'react';
import { AGENTS } from '../data/agents';
import { ChevronRight, ChevronLeft } from 'lucide-react';

export default function Agents({ onNavigate }) {
  const sectionRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  // Trigger scroll animation when section reaches 20% viewport visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleAgentClick = (agent) => {
    const targetRoute = `/agents/${agent.slug}`;
    if (onNavigate) {
      onNavigate(targetRoute, agent);
    } else {
      window.history.pushState({}, '', targetRoute);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handleMeetAllClick = () => {
    const targetRoute = '/agents';
    if (onNavigate) {
      onNavigate(targetRoute);
    } else {
      window.history.pushState({}, '', targetRoute);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handleScroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section 
      ref={sectionRef}
      id="agents" 
      className="relative w-full bg-[#FAF8F5] text-[#111827] border-t border-black/[0.08] pt-12 sm:pt-16 md:pt-[100px] pb-10 sm:pb-14 md:pb-[60px] overflow-hidden"
    >
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 space-y-8 sm:space-y-12 md:space-y-16">
        
        {/* 1. SECTION HEADER BLOCK */}
        <div 
          className="flex flex-col md:flex-row md:items-end justify-between gap-5 md:gap-6 transition-all duration-700 ease-out"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(30px)'
          }}
        >
          {/* Left Block */}
          <div className="max-w-[620px] space-y-2 sm:space-y-3">
            {/* Eyebrow Badge */}
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#111827] inline-block" />
              <span className="text-[11px] sm:text-[12px] font-medium tracking-[0.12em] uppercase text-[#111827]">
                OUR AGENTS
              </span>
            </div>

            {/* Main Title */}
            <h2 className="text-[26px] xs:text-[28px] sm:text-[38px] lg:text-[46px] font-semibold text-[#111827] tracking-[-0.02em] leading-[1.15] font-sans">
              Agents Who Know the Market Inside Out
            </h2>

            {/* Subtitle */}
            <p className="text-[13px] sm:text-[15px] md:text-[16px] text-[#6B7280] leading-[1.5] font-normal">
              Our realtors bring deep market knowledge, skills, discretion, and a personal touch to every transaction.
            </p>
          </div>

          {/* Right Action Button & Mobile Scroll Controls */}
          <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 md:pt-0 shrink-0">
            {/* Mobile swipe navigation arrows */}
            <div className="flex md:hidden items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleScroll('left')}
                aria-label="Previous agent"
                className="w-9 h-9 rounded-lg border border-black/15 bg-white text-[#111827] flex items-center justify-center hover:bg-black hover:text-white transition-colors active:scale-95 shadow-sm cursor-pointer"
              >
                <ChevronLeft size={17} />
              </button>
              <button
                type="button"
                onClick={() => handleScroll('right')}
                aria-label="Next agent"
                className="w-9 h-9 rounded-lg border border-black/15 bg-white text-[#111827] flex items-center justify-center hover:bg-black hover:text-white transition-colors active:scale-95 shadow-sm cursor-pointer"
              >
                <ChevronRight size={17} />
              </button>
            </div>

            <button
              type="button"
              onClick={handleMeetAllClick}
              className="group inline-flex items-center gap-2 px-5 sm:px-[28px] py-2.5 sm:py-[14px] bg-[#000000] text-[#FFFFFF] text-xs sm:text-[15px] font-medium rounded-[8px] transition-all duration-300 hover:scale-[1.02] hover:bg-[#1A1A1A] active:scale-[0.99] select-none shadow-sm cursor-pointer"
            >
              <span>Meet All Agents</span>
              <ChevronRight 
                size={16} 
                className="transition-transform duration-300 group-hover:translate-x-1" 
              />
            </button>
          </div>
        </div>

        {/* 2. AGENTS LIST: Sideways scrollable carousel on mobile (< md), regular grid on tablet & desktop (≥ md) */}
        <div 
          ref={scrollContainerRef}
          className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 overflow-x-auto md:overflow-x-visible no-scrollbar scroll-smooth snap-x snap-mandatory -mx-4 px-4 sm:-mx-8 sm:px-8 md:mx-0 md:px-0 pb-3 md:pb-0 touch-pan-x"
        >
          {AGENTS.slice(0, 6).map((agent, index) => {
            const delaySeconds = 0.08 * (index + 1);

            return (
              <div
                key={agent.id}
                onClick={() => handleAgentClick(agent)}
                className="group cursor-pointer flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 w-[76vw] max-w-[280px] xs:w-[72vw] xs:max-w-[300px] shrink-0 md:w-auto md:max-w-none md:shrink snap-start"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                  transition: `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delaySeconds}s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delaySeconds}s, box-shadow 0.3s ease`
                }}
              >
                {/* 1. Portrait Image Container */}
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[12px] bg-stone-200 shadow-sm group-hover:shadow-md transition-shadow">
                  <img
                    src={agent.avatar}
                    alt={agent.name}
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                    loading="lazy"
                  />
                  {/* Subtle top/bottom gradient overlay for rich contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* 2. Agent Details Row (Below Image) */}
                <div className="mt-3 sm:mt-4 pt-0.5 sm:pt-1 flex items-center justify-between gap-2">
                  <div className="space-y-0.5 truncate">
                    <h3 className="text-[19px] sm:text-[22px] md:text-[24px] font-bold text-[#111827] tracking-tight font-sans transition-colors group-hover:text-black truncate">
                      {agent.name}
                    </h3>
                    <p className="text-[12px] sm:text-[14px] text-[#6B7280] font-normal truncate">
                      {agent.title}
                    </p>
                  </div>

                  {/* Right Arrow Action Square */}
                  <div className="w-[34px] h-[34px] sm:w-[38px] sm:h-[38px] rounded-[6px] bg-[#000000] text-white flex items-center justify-center shrink-0 transition-all duration-300 group-hover:bg-[#C5A059] group-hover:scale-105 shadow-sm">
                    <ChevronRight size={16} className="transform transition-transform duration-200 group-hover:translate-x-0.5" />
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* Mobile Swipe Hint Bar */}
        <div className="flex md:hidden items-center justify-center gap-1.5 pt-1 text-[11px] text-[#6B7280] font-medium">
          <span>Swipe sideways to explore all 6 advisors</span>
          <span className="text-black font-bold">→</span>
        </div>

      </div>
    </section>
  );
}
