import React from 'react';
import { ChevronRight } from 'lucide-react';

export default function VisionCTA({ onContactClick }) {
  return (
    <section className="w-full relative overflow-hidden bg-[#0A0A0C]">
      {/* Background Image Container */}
      <div className="relative w-full h-[540px] sm:h-[620px] lg:h-[700px] flex flex-col justify-start items-center text-center">
        
        {/* Architectural Villa Background Photo */}
        <img
          src="/cta-mansion.jpg"
          alt="Modern Architectural Luxury Estate"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* Subtle contrast gradient over the sky to ensure pristine legibility */}
        <div 
          className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-transparent pointer-events-none"
          aria-hidden="true" 
        />

        {/* Content Container (Positioned in the upper sky portion matching reference) */}
        <div className="relative z-10 w-full max-w-4xl px-6 pt-14 sm:pt-20 lg:pt-24 mx-auto flex flex-col items-center">
          
          {/* Main Headline */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-bold text-white tracking-tight leading-[1.12] drop-shadow-sm max-w-3xl">
            Let's Find the Property <br className="hidden sm:inline" />
            That Fits Your Vision
          </h2>

          {/* Subtitle Paragraph */}
          <p className="text-white/95 text-sm sm:text-base md:text-[17px] font-normal leading-relaxed max-w-xl mx-auto mt-4 mb-7 drop-shadow-sm">
            Every move begins with a conversation. Reach out today <br className="hidden sm:inline" />
            and let's turn your next move into your best one yet.
          </p>

          {/* Call-to-action Button */}
          <button
            type="button"
            onClick={onContactClick}
            className="group inline-flex items-center gap-1.5 bg-white text-[#111827] px-7 py-3.5 rounded-lg text-sm sm:text-[15px] font-semibold hover:bg-white/95 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 shadow-md cursor-pointer"
          >
            <span>Get in Touch</span>
            <ChevronRight 
              size={16} 
              strokeWidth={2.2} 
              className="transition-transform duration-300 group-hover:translate-x-0.5" 
            />
          </button>

        </div>

      </div>
    </section>
  );
}
