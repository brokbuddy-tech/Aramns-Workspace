import React, { useState } from 'react';
import { Bed, Bath, Maximize2, MapPin, ArrowUpRight } from 'lucide-react';

export default function PropertyCard({ 
  property, 
  isFavorite, 
  onToggleFavorite, 
  onSelectProperty 
}) {
  // Dynamic Badge logic
  const getBadge = () => {
    if (property.listingType === 'FOR RENT' || property.marketCategory === 'rent') {
      return { label: 'FOR RENT', color: 'bg-[#0EA5E9]' };
    }
    return { label: 'FOR SALE', color: 'bg-[#F97316]' };
  };

  const badgeInfo = getBadge();

  return (
    <div
      onClick={() => onSelectProperty(property)}
      className="group relative bg-white border border-[#E5E7EB] rounded-[14px] overflow-hidden cursor-pointer transition-all duration-300 hover:border-black/25 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between"
    >
      {/* 1. TOP MEDIA CONTAINER (16:10 Aspect Ratio with Rounded Top) */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-100 rounded-t-[14px]">
        <img
          src={property.images ? property.images[0] : property.image}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          loading="lazy"
        />

        {/* Subtle vignette for contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

        {/* Top-Right Badge: Dynamic by listing category */}
        <div className="absolute top-3.5 right-3.5 z-10 flex items-center gap-1.5">
          {property.handover && (
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-[4px] text-[10px] font-semibold tracking-wider uppercase text-white bg-black/60 backdrop-blur-md border border-white/20">
              {property.handover}
            </span>
          )}
          <span 
            className={`px-2.5 py-1 rounded-[4px] text-[11px] font-bold tracking-wider uppercase text-white shadow-sm ${badgeInfo.color}`}
          >
            {badgeInfo.label}
          </span>
        </div>
      </div>

      {/* 2. CONTENT DETAILS (Below Image) */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
        
        {/* Title & Location */}
        <div className="space-y-1.5">
          <h3 className="text-[20px] font-bold text-[#0A0A0C] tracking-tight group-hover:text-black transition-colors line-clamp-1">
            {property.title}
          </h3>
          <div className="flex items-center gap-1.5 text-[13px] text-[#4B5563] truncate">
            <MapPin size={14} className="text-[#9CA3AF] shrink-0" />
            <span className="truncate">{property.location}</span>
          </div>
        </div>

        {/* Specs Row */}
        <div>
          {/* Thin Horizontal Divider */}
          <div className="border-t border-[#E5E7EB] mb-3" />
          
          <div className="flex items-center gap-4 sm:gap-5 text-[13px] sm:text-[14px] text-[#4B5563]">
            <div className="flex items-center gap-1.5">
              <Bed size={16} className="text-[#9CA3AF]" />
              <span>{property.beds} <span className="hidden sm:inline">Beds</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bath size={16} className="text-[#9CA3AF]" />
              <span>{property.baths} <span className="hidden sm:inline">Baths</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Maximize2 size={15} className="text-[#9CA3AF]" />
              <span>{property.sqft.toLocaleString()} sqft</span>
            </div>
          </div>
        </div>

        {/* Price & Action Row */}
        <div className="border-t border-[#E5E7EB] pt-3.5 flex items-center justify-between">
          <div className="text-[24px] font-bold text-[#0A0A0C] tracking-tight font-sans">
            {property.priceFormatted || ''}
          </div>

          <button
            type="button"
            className="w-10 h-10 rounded-[8px] bg-[#000000] text-white flex items-center justify-center transition-all duration-200 group-hover:bg-[#262626] group-hover:scale-105 active:scale-95 shadow-sm"
            aria-label="View property details"
          >
            <ArrowUpRight size={18} />
          </button>
        </div>

      </div>
    </div>
  );
}
