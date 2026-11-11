import React from 'react';
import PropertyCard from './PropertyCard';

export default function FeaturedProperties({ 
  properties, 
  favorites = [], 
  onToggleFavorite, 
  onSelectProperty,
  onViewAllClick
}) {
  // Use first 6 properties for the 3x2 grid layout
  const displayProperties = properties.slice(0, 6);

  const handleViewAll = () => {
    if (onViewAllClick) {
      onViewAllClick();
    } else {
      const el = document.getElementById('neighborhoods');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section 
      id="properties" 
      className="relative w-full bg-white border-t border-[#E5E7EB] pt-20 pb-20 lg:pt-24 lg:pb-24"
    >
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 space-y-12 lg:space-y-16">
        
        {/* 1. SECTION HEADER BLOCK */}
        <div className="space-y-4">
          
          {/* Category Eyebrow (Top-Left) */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-black inline-block" />
            <span className="text-[12px] font-medium uppercase tracking-[0.15em] text-[#111827]">
              FEATURED LISTINGS
            </span>
          </div>

          {/* Main Headline & Right CTA Flex Row */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            
            {/* Left Headline & Intro Paragraph */}
            <div className="max-w-[640px]">
              <h2 className="text-[34px] sm:text-[42px] lg:text-[48px] font-semibold text-[#0A0A0C] tracking-tight leading-[1.15] font-sans">
                Properties Worth Calling Home
              </h2>
              <p className="mt-3 text-[15px] sm:text-[16px] text-[#4B5563] leading-[1.5] max-w-[520px] font-normal">
                From waterfront estates to contemporary penthouses, browse homes we selected for their design, smart utilities, location, and lifestyle appeal.
              </p>
            </div>

            {/* Right CTA Button */}
            <div className="shrink-0 pt-2 md:pt-0">
              <button
                type="button"
                onClick={handleViewAll}
                className="w-full sm:w-auto px-6 py-3 bg-[#000000] text-[#FFFFFF] text-[14px] font-medium rounded-[8px] transition-all duration-200 hover:bg-[#262626] hover:scale-[1.02] active:scale-[0.98] shadow-sm select-none"
              >
                View All Properties
              </button>
            </div>

          </div>

        </div>

        {/* 2. PROPERTY GRID (3 Columns × 2 Rows) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              isFavorite={favorites.includes(property.id)}
              onToggleFavorite={onToggleFavorite}
              onSelectProperty={onSelectProperty}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
