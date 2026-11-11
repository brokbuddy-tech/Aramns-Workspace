import React from 'react';
import { TESTIMONIALS } from '../data/testimonials';
import { ScrollReelTestimonials } from './ui/scroll-reel-testimonials';
import { ShieldCheck, Award, Sparkles } from 'lucide-react';

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-12 sm:py-20 lg:py-32 bg-[#FAFAFA] text-[#111827] relative overflow-hidden w-full">
      {/* Subtle luxury watermark typography - dynamically sized so NOVALUX is 100% fully visible without clipping on mobile and desktop */}
      <div className="absolute left-0 right-0 -bottom-1 sm:-bottom-4 md:-bottom-8 select-none pointer-events-none opacity-[0.04] font-serif text-[12.5vw] md:text-[145px] lg:text-[170px] font-bold tracking-widest text-center whitespace-nowrap overflow-hidden leading-none">
        NOVALUX
      </div>

      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 relative z-10 space-y-8 sm:space-y-10 lg:space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 pb-4 sm:pb-6 border-b border-black/10">
          <div className="space-y-1.5 sm:space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
              <span className="text-[10px] sm:text-[11px] font-semibold tracking-luxury uppercase text-[#C5A059]">
                PATRON TESTIMONIALS
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-medium text-[#111827] tracking-tight">
              Words From Our Discerning Clients
            </h2>
            <p className="text-[#64748B] text-xs sm:text-base font-light">
              Reflections on off-market discretion, architectural acquisitions, and tailored portfolio management.
            </p>
          </div>

          {/* Quick trust metrics */}
          <div className="flex items-center gap-4 sm:gap-6 text-[11px] sm:text-xs text-[#64748B] font-mono uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-[#C5A059]" />
              <span>100% Private & Verified</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <Award size={16} className="text-[#C5A059]" />
              <span>$1.8B+ Transacted</span>
            </div>
          </div>
        </div>

        {/* Scroll Reel Testimonials UI Component */}
        <div className="flex justify-center items-center py-2 sm:py-4">
          <ScrollReelTestimonials
            testimonials={TESTIMONIALS}
            autoPlayIntervalMs={4000}
            charStaggerMs={6}
            loop={true}
            pauseOnHover={true}
            className="w-full max-w-[1060px] bg-white border-black/10 shadow-[0_20px_50px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)]"
          />
        </div>

        {/* Bottom Trust Indicators - Single row on mobile with compact size, 3-column row on desktop */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 pt-4 sm:pt-6 border-t border-black/10 pb-4 sm:pb-6">
          
          {/* Card 1: Off-Market Discretion */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-1 sm:gap-3 p-2 xs:p-2.5 sm:p-4 rounded-lg sm:rounded-xl bg-white/80 border border-black/5 text-center sm:text-left transition-all">
            <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-full bg-[#F5F4EF] flex items-center justify-center shrink-0 text-[#C5A059]">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" />
            </div>
            <div className="space-y-0.5 min-w-0 w-full">
              <h4 className="text-[9px] xs:text-[10px] sm:text-xs font-semibold uppercase tracking-tight sm:tracking-wider text-[#111827] leading-snug">
                Off-Market <br className="sm:hidden" />Discretion
              </h4>
              <p className="hidden xs:block text-[8px] sm:text-xs text-[#64748B] font-light leading-tight line-clamp-2 sm:line-clamp-none">
                Private listings under strict NDAs.
              </p>
            </div>
          </div>

          {/* Card 2: Architectural Verification */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-1 sm:gap-3 p-2 xs:p-2.5 sm:p-4 rounded-lg sm:rounded-xl bg-white/80 border border-black/5 text-center sm:text-left transition-all">
            <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-full bg-[#F5F4EF] flex items-center justify-center shrink-0 text-[#C5A059]">
              <Award className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" />
            </div>
            <div className="space-y-0.5 min-w-0 w-full">
              <h4 className="text-[9px] xs:text-[10px] sm:text-xs font-semibold uppercase tracking-tight sm:tracking-wider text-[#111827] leading-snug">
                Architectural <br className="sm:hidden" />Verified
              </h4>
              <p className="hidden xs:block text-[8px] sm:text-xs text-[#64748B] font-light leading-tight line-clamp-2 sm:line-clamp-none">
                Evaluated for structural pedigree.
              </p>
            </div>
          </div>

          {/* Card 3: Concierge Advisory */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-1 sm:gap-3 p-2 xs:p-2.5 sm:p-4 rounded-lg sm:rounded-xl bg-white/80 border border-black/5 text-center sm:text-left transition-all">
            <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-full bg-[#F5F4EF] flex items-center justify-center shrink-0 text-[#C5A059]">
              <Sparkles className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" />
            </div>
            <div className="space-y-0.5 min-w-0 w-full">
              <h4 className="text-[9px] xs:text-[10px] sm:text-xs font-semibold uppercase tracking-tight sm:tracking-wider text-[#111827] leading-snug">
                Concierge <br className="sm:hidden" />Advisory
              </h4>
              <p className="hidden xs:block text-[8px] sm:text-xs text-[#64748B] font-light leading-tight line-clamp-2 sm:line-clamp-none">
                Dedicated 24/7 global advisory.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
