import React, { useState } from 'react';
import { EyeOff, Compass, Box, ShieldCheck, ChevronDown, CheckCircle2, ArrowRight } from 'lucide-react';

const FEATURES = [
  {
    id: "off-market",
    title: "Off-Market Access",
    subtitle: "Private collections shielded from public portals & MLS",
    icon: EyeOff,
    badge: "Confidentiality First",
    content: "More than 45% of our highest-tier architectural acquisitions take place entirely off-market. Through our protected global ledger, buyers and sellers interact under strict non-disclosure agreements, preserving absolute anonymity and investment integrity.",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80",
    metrics: "Over $1.2B closed confidentially"
  },
  {
    id: "concierge",
    title: "Concierge Advisory",
    subtitle: "End-to-end legal, cross-border tax & asset stewardship",
    icon: Compass,
    badge: "Full Syndicate Service",
    content: "Acquiring international landmark residences entails intricate regulatory frameworks. Our in-house advisory board collaborates directly with your family office, maritime attorneys, and tax specialists to orchestrate frictionless global transactions.",
    image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=80",
    metrics: "Single-point fiduciary liaison"
  },
  {
    id: "tours",
    title: "Bespoke Virtual Walkthroughs",
    subtitle: "4K 3D photogrammetry & cinematic architectural storytelling",
    icon: Box,
    badge: "Next-Gen Spatial Tech",
    content: "Experience residences before international travel. Using millimeter-accurate lidar scanning and cinematic aerial drone captures, we provide our private clients with interactive spatial walkthroughs indistinguishable from an in-person viewing.",
    image: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1400&q=80",
    metrics: "4K volumetric spatial rendering"
  },
  {
    id: "syndicate",
    title: "Global Private Syndicate",
    subtitle: "Direct connectivity to pre-vetted UHNW capital across 12 hubs",
    icon: ShieldCheck,
    badge: "Worldwide Reach",
    content: "With dedicated partner suites in Zurich, London, Dubai, Tokyo, and New York, Novalux bridges ultra-prime properties with sovereign wealth and private capital looking for generational architectural troves.",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80",
    metrics: "Direct presence across 4 continents"
  }
];

export default function WhyNovalux({ onScheduleClick }) {
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <section id="why-us" className="py-20 lg:py-28 relative bg-white border-t border-stone-200/80 w-full">
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 space-y-12">
        
        {/* Section Header */}
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-bronze" />
            <span className="text-[11px] font-semibold tracking-luxury uppercase text-bronze">
              THE NOVALUX ADVANTAGE
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium text-[#0A0A0C] tracking-tight">
            Crafted Exclusively For The Connoisseur
          </h2>
          <p className="text-[#64748B] text-sm sm:text-base font-light">
            We transcend conventional brokerage. Novalux is an elite architectural advisory uniting private discretion with institutional execution.
          </p>
        </div>

        {/* 50/50 Split Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Side: High-Resolution Architectural Detail Crop */}
          <div className="lg:col-span-6 relative">
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-stone-200/80 shadow-2xl">
              <img
                src={FEATURES[activeIdx].image}
                alt={FEATURES[activeIdx].title}
                className="w-full h-full object-cover transition-all duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Floating Highlight Card on Image */}
              <div className="absolute bottom-6 inset-x-6 bg-white/95 backdrop-blur-md p-5 rounded-xl border border-stone-200 shadow-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-luxury text-bronze font-mono font-semibold">
                    {FEATURES[activeIdx].badge}
                  </span>
                  <span className="text-[11px] text-[#64748B] font-mono">
                    {FEATURES[activeIdx].metrics}
                  </span>
                </div>
                <h4 className="font-serif text-xl text-[#0A0A0C] font-medium">
                  {FEATURES[activeIdx].title}
                </h4>
                <p className="text-xs text-[#64748B] font-light">
                  {FEATURES[activeIdx].subtitle}
                </p>
              </div>
            </div>

            {/* Subtle decorative gold line glow */}
            <div className="absolute -bottom-4 -right-4 w-48 h-48 bg-bronze/10 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* Right Side: Accordion List / Feature Cards */}
          <div className="lg:col-span-6 space-y-4">
            {FEATURES.map((feature, idx) => {
              const Icon = feature.icon;
              const isOpen = activeIdx === idx;

              return (
                <div
                  key={feature.id}
                  onClick={() => setActiveIdx(idx)}
                  className={`rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                    isOpen
                      ? 'bg-white border-bronze/60 shadow-[0_10px_30px_rgba(0,0,0,0.06)]'
                      : 'bg-stone-50 border-stone-200/80 hover:border-stone-300 hover:bg-stone-100/60'
                  }`}
                >
                  {/* Accordion Header */}
                  <div className="p-5 sm:p-6 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isOpen ? 'bg-[#0A0A0C] text-white shadow-sm' : 'bg-stone-200/70 text-[#475569]'
                      }`}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono tracking-widest uppercase text-bronze font-semibold">
                            0{idx + 1}
                          </span>
                          <h3 className={`font-serif text-lg sm:text-xl font-medium transition-colors ${
                            isOpen ? 'text-[#0A0A0C]' : 'text-[#1E293B]'
                          }`}>
                            {feature.title}
                          </h3>
                        </div>
                        <p className="text-xs text-[#64748B] font-light pt-0.5">
                          {feature.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className={`p-1 rounded-full border text-[#64748B] transition-transform duration-300 ${
                      isOpen ? 'rotate-180 text-bronze border-bronze/50' : 'border-stone-200'
                    }`}>
                      <ChevronDown size={16} />
                    </div>
                  </div>

                  {/* Accordion Expanded Body */}
                  {isOpen && (
                    <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0 border-t border-stone-100 mt-1 space-y-4 animate-fade-in">
                      <p className="text-sm text-[#475569] font-light leading-relaxed pt-3">
                        {feature.content}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onScheduleClick) onScheduleClick();
                        }}
                        className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-bronze hover:text-bronze-dark transition-colors group"
                      >
                        <span>Consult Our Advisory Team</span>
                        <ArrowRight size={13} className="transform group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
