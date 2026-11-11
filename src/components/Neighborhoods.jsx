import React from 'react';
import { NEIGHBORHOODS } from '../data/neighborhoods';
import { ArrowUpRight, MapPin } from 'lucide-react';

export default function Neighborhoods({ onSelectNeighborhood, onNavigate }) {
  return (
    <section id="neighborhoods" className="py-20 lg:py-28 relative bg-[#F4F4F1] border-t border-stone-200/80 w-full">
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 space-y-12">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-stone-200/80">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-bronze" />
              <span className="text-[11px] font-semibold tracking-luxury uppercase text-bronze">
                PRIME GEOGRAPHIES
              </span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium text-[#0A0A0C] tracking-tight">
              Neighborhood Discovery
            </h2>
            <p className="text-[#64748B] text-sm sm:text-base font-light max-w-xl">
              Explore the UAE’s most coveted enclaves. From iconic Palm Jumeirah beachfronts to prestigious Downtown Dubai sky palaces and Saadiyat Island sanctuaries.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('/map')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-black text-white text-xs font-semibold hover:bg-stone-800 transition-colors cursor-pointer shadow-sm"
            >
              <MapPin size={13} className="text-amber-400" />
              <span>Explore All on Map</span>
            </button>
            <div className="text-xs uppercase tracking-luxury text-[#64748B] font-mono hidden sm:block">
              // 05 ARCHITECTURAL HUBS
            </div>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[260px] md:auto-rows-[280px]">
          {NEIGHBORHOODS.map((item) => {
            return (
              <div
                key={item.id}
                onClick={() => onSelectNeighborhood(item.name)}
                className={`group relative rounded-2xl overflow-hidden border border-stone-200/90 cursor-pointer transition-all duration-500 hover:border-bronze/50 hover:shadow-[0_20px_50px_rgba(0,0,0,0.14)] ${item.gridSpan}`}
              >
                {/* Image Background with Zoom on Hover */}
                <img
                  src={item.image}
                  alt={item.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="lazy"
                />

                {/* Dark Vignette & Gradient Overlays for readable text over images */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />

                {/* Top Badge & Corner Arrow */}
                <div className="absolute top-5 inset-x-5 flex items-center justify-between z-10">
                  <span className="px-3 py-1 rounded-full text-[10px] font-semibold tracking-luxury uppercase bg-white/95 text-[#0A0A0C] border border-stone-200 shadow-sm backdrop-blur-md">
                    {item.featuredBadge}
                  </span>

                  <div className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md border border-stone-200 text-[#0A0A0C] shadow-sm flex items-center justify-center transform group-hover:rotate-45 group-hover:bg-[#0A0A0C] group-hover:text-white group-hover:border-black transition-all duration-300">
                    <ArrowUpRight size={15} />
                  </div>
                </div>

                {/* Bottom Content: Title & Revealed Listing Count on Hover */}
                <div className="absolute bottom-5 inset-x-5 z-10 flex flex-col justify-end space-y-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs text-silver">
                      <MapPin size={12} className="text-bronze" />
                      <span>{item.state}</span>
                    </div>
                    <h3 className="font-serif text-2xl sm:text-3xl text-white font-medium group-hover:text-bronze transition-colors">
                      {item.name}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-300 font-light line-clamp-1">
                    {item.tagline}
                  </p>

                  {/* Revealed Meta Bar */}
                  <div className="pt-2 flex items-center justify-between text-xs border-t border-white/15 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <span className="text-white font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      {item.activeListings} Active Properties
                    </span>
                    <span className="text-silver/80 font-mono text-[11px]">
                      Avg: {item.avgPrice}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
