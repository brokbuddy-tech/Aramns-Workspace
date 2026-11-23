import {hasDisplayValue, displayValues, firstDisplayValue} from '../lib/display-data.mjs';
import {trackVisibleProperty} from '../lib/property-popularity.mjs';
import ErrorPage from './ErrorPage';
import React, { useEffect } from 'react';
import {ChevronRight, MapPin, Bed, Bath, Maximize2, Calendar, Car, Layers, Building2, CheckCircle2, Calculator} from 'lucide-react';
import { AGENTS } from '../data/agents';
import { PROPERTIES } from '../data/properties';
import PropertyCard from './PropertyCard';
import ExpandableAmenity from './ExpandableAmenity';
import MortgageCalculator from './MortgageCalculator';
import RichText from './RichText';
import ListingLocationMap from './ListingLocationMap';
import PropertyPhotoGallery from './PropertyPhotoGallery';
import ListingRepresentative from './ListingRepresentative';
import {displayPropertyLocation} from '../lib/property-presentation.mjs';

export default function PropertyDetailPage({
  property,
  properties = PROPERTIES,
  favorites = [],
  onToggleFavorite,
  onNavigate,
  onContactAdvisor,
  showToast
}) {
  useEffect(() => property?.status === 'ACTIVE' ? trackVisibleProperty(property.id) : undefined, [property?.id, property?.status]);
  useEffect(() => {window.scrollTo({top:0,behavior:'smooth'});},[property?.id]);

  if (!property) {
    return <ErrorPage variant="property" embedded onNavigate={onNavigate} />;
  }

  // Find assigned agent
  const agent = AGENTS.find(a => a.id === property.agentId || a.slug === property.agentId) || AGENTS[0];
  const isFavorite = favorites.includes(property.id);
  const location=displayPropertyLocation(property);
  const amenities=displayValues(property.amenities);
  const handover=firstDisplayValue(property.handover,property.yearBuilt);
  const essentialSpecs=[
    {label:'Bedrooms',value:property.beds,icon:Bed,format:value=>`${value} Suites`},
    {label:'Bathrooms',value:property.baths,icon:Bath,format:value=>`${value} Baths`},
    {label:'Total Area',value:property.sqft,icon:Maximize2,format:value=>`${value.toLocaleString()} sqft`},
    {label:hasDisplayValue(property.handover) ? 'Handover':'Built Year',value:handover,icon:Calendar},
    {label:'Parking',value:property.garage,icon:Car},
    {label:'Plot / Lot',value:property.lotSize,icon:Layers},
  ].filter(spec=>hasDisplayValue(spec.value));
  const specifications=[
    {label:'Property Type',value:firstDisplayValue(property.propertyType,property.category)},
    {label:'Climate & HVAC',value:property.heatingCooling},
    {label:'Vehicular Garaging',value:property.garage},
    {label:'Service Charges / HOA',value:property.hoaFees},
    {label:'Plot Dimension',value:property.lotSize},
    {label:'Listing Status',value:property.status},
  ].filter(spec=>hasDisplayValue(spec.value));


  // Badge configuration
  const getBadgeInfo = () => {
    if (property.listingType === 'FOR RENT' || property.marketCategory === 'rent') {
      return { label: 'FOR RENT', color: 'bg-[#0EA5E9]' };
    }
    return { label: 'FOR SALE', color: 'bg-[#F97316]' };
  };
  const badgeInfo = getBadgeInfo();

  // Related properties (same category, excluding current)
  const relatedProperties = properties
    .filter(p => p.id !== property.id && (p.marketCategory === property.marketCategory || p.category === property.category))
    .slice(0, 6);

  const categoryPath = `/properties/${property.marketCategory || 'buy'}`;
  const categoryLabel = property.marketCategory 
    ? property.marketCategory.charAt(0).toUpperCase() + property.marketCategory.slice(1) 
    : 'Properties';

  const priceContent = (<>
    {!(property.listingType === 'FOR RENT' || property.marketCategory === 'rent') && (
      <span className="text-[11px] uppercase tracking-wider text-[#6B7280] font-mono block mb-1">
        Asking Price
      </span>
    )}
    <div className="text-[24px] md:text-[42px] font-bold text-[#0A0A0C] tracking-tight font-sans">
      {property.priceFormatted || ''}
    </div>
    {hasDisplayValue(property.hoaFees) && (
      <span className="text-[12px] text-[#6B7280] block mt-1">
        Service / HOA: {property.hoaFees}
      </span>
    )}
  </>);

  return (
    <div className="property-detail-page w-full min-h-screen bg-[#FDFDFD] text-[#0A0A0C] pt-28 sm:pt-36 pb-24">
      
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 space-y-10 sm:space-y-12">
        
        {/* 2. PROPERTY HEADLINE & PRICE SECTION */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            
            {/* Top Badges */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex min-w-0 max-w-full items-center gap-2.5">
                <span className={`shrink-0 px-2.5 py-1 rounded-[4px] text-[11px] font-bold tracking-wider uppercase text-white shadow-sm ${badgeInfo.color}`}>
                  {badgeInfo.label}
                </span>
                {location && <span className="flex min-w-0 items-start gap-1 text-[11px] text-[#4B5563] md:hidden">
                  <MapPin size={13} className="mt-0.5 shrink-0 text-[#9CA3AF]" />
                  <span className="min-w-0 break-words">{location}</span>
                </span>}
              </div>
              {hasDisplayValue(property.handover) && (
                <span className="px-2.5 py-1 rounded-[4px] text-[11px] font-semibold text-purple-900 bg-purple-100 border border-purple-200">
                  Handover: {property.handover}
                </span>
              )}
              {hasDisplayValue(property.paymentPlan) && (
                <span className="px-2.5 py-1 rounded-[4px] text-[11px] font-medium text-stone-700 bg-stone-100">
                  {property.paymentPlan}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="hidden md:block text-[32px] sm:text-[40px] lg:text-[46px] font-bold text-[#0A0A0C] tracking-tight leading-[1.18] font-sans">
              {property.title}
            </h1>

            {/* Address / Location */}
            {location && <div className="hidden items-center gap-2 text-[14px] sm:text-[15px] text-[#4B5563] md:flex">
              <MapPin size={17} className="text-[#9CA3AF] shrink-0" />
              <span>{location}</span>
            </div>}

          </div>

          {/* Price Block */}
          {hasDisplayValue(property.priceFormatted) && <div className="hidden md:block lg:text-right shrink-0 p-4 sm:p-5 bg-stone-50 border border-[#E5E7EB] rounded-2xl">
            {priceContent}
          </div>}
        </div>

        <div className="space-y-4">
          <PropertyPhotoGallery key={property.id} images={property.images} title={property.title} />
          {hasDisplayValue(property.priceFormatted) && <div className="md:hidden p-4 bg-stone-50 border border-[#E5E7EB] rounded-2xl">
            {priceContent}
          </div>}
        </div>

        {/* Missing specifications do not leave empty labels or icons. */}
        {essentialSpecs.length > 0 && <div aria-label="Essential property specifications" className="grid gap-3 sm:gap-4 p-5 sm:p-6 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm" style={{gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 140px), 1fr))'}}>
          {essentialSpecs.map(({label,value,icon:Icon,format})=><div key={label} className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700 shrink-0"><Icon size={20}/></div>
            <div className="min-w-0">
              <span className="text-[11px] text-stone-500 uppercase tracking-wider block font-mono">{label}</span>
              <span className="text-[15px] font-bold text-black break-words">{format ? format(value):value}</span>
            </div>
          </div>)}
        </div>}

        {/* 5. MAIN CONTENT SPLIT (Left Column: Description & Amenities, Right Column: Assigned Representative) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          
          {/* LEFT COLUMN: Main In-Depth Details (7 Columns) */}
          <div className="lg:col-span-7 space-y-10">
            
            <div className={hasDisplayValue(property.description) ? '' : 'md:hidden'}>
              <h1 className="mb-4 text-[24px] font-bold text-[#0A0A0C] tracking-tight leading-[1.2] font-sans break-words md:hidden">{property.title}</h1>
              {/* Description */}
              {hasDisplayValue(property.description) && <div className="space-y-4 text-stone-700 leading-[1.75] text-[15px] sm:text-[16px]">
                <h3 className="text-[20px] font-bold text-black font-sans tracking-tight">
                  Description
                </h3>
                <div className="description-scroll-region" tabIndex={0} role="region" aria-label="Property description">
                  <RichText value={property.description} />
                </div>
              </div>}
            </div>

            {/* Amenities Grid (Responsive for Mobile & Desktop) */}
            {amenities.length > 0 && (
              <div className="space-y-3 sm:space-y-4 pt-3.5 sm:pt-4 border-t border-[#E5E7EB]">
                <h3 className="text-[17px] sm:text-[19px] md:text-[20px] font-bold text-black font-sans tracking-tight flex items-center gap-2">
                  <Building2 size={18} className="text-black shrink-0 sm:w-5 sm:h-5" />
                  <span>Amenities &amp; Highlights</span>
                </h3>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {amenities.map((item, idx) => (
                    <ExpandableAmenity
                      key={`${property.id}-${idx}`}
                      label={item}
                      className="flex items-start sm:items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl bg-stone-50 border border-[#E5E7EB] text-[12.5px] sm:text-[13.5px] md:text-[14px] text-stone-800 font-medium leading-snug hover:bg-stone-100/70 transition-colors"
                    >
                      <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5 sm:mt-0 sm:w-[17px] sm:h-[17px]" />
                    </ExpandableAmenity>
                  ))}
                </div>
              </div>
            )}

            {/* Render the technical table only when it has supplied values. */}
            {specifications.length > 0 && <div className="space-y-4 pt-4 border-t border-[#E5E7EB]">
              <h3 className="text-[20px] font-bold text-black font-sans tracking-tight">Property Specifications &amp; Dimensions</h3>
              <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden divide-y divide-[#E5E7EB] text-[14px]">
                {specifications.map(({label,value})=><div key={label} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <span className="text-stone-500">{label}</span>
                  <span className={label==='Listing Status' ? 'font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-xs':'font-semibold text-black'}>{value}</span>
                </div>)}
              </div>
            </div>}

            <ListingLocationMap key={property.id} property={property} />

            {/* Mortgage & Financing Calculator Section (Only for Buy, excluded for Rent) */}
            {property.marketCategory !== 'rent' && property.listingType !== 'FOR RENT' && (
              <div id="mortgage-calculator-section" className="pt-2">
                <MortgageCalculator
                  property={property}
                  onContactAdvisor={onContactAdvisor}
                  showToast={showToast}
                />
              </div>
            )}

          </div>

          <div className="listing-representative-column lg:col-span-5 lg:sticky lg:top-28 self-start w-full">
            <ListingRepresentative agent={agent} property={property} onNavigate={onNavigate}/>
          </div>

        </div>

        {/* 6. RELATED / SIMILAR LUXURY RESIDENCES */}
        {relatedProperties.length > 0 && (
          <div className="pt-16 border-t border-[#E5E7EB] space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#F97316] font-semibold block mb-1">
                  Curated Recommendations
                </span>
                <h3 className="text-[26px] sm:text-[32px] font-bold text-black tracking-tight font-sans">
                  Similar Residences in {categoryLabel}
                </h3>
                <span className="text-[11px] text-stone-500 font-mono sm:hidden block mt-1">
                  ← Swipe horizontally to see more →
                </span>
              </div>
            </div>

            {/* Mobile horizontal scroll row / Desktop responsive grid */}
            <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8 overflow-x-auto md:overflow-visible pb-4 md:pb-0 snap-x snap-mandatory scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
              {relatedProperties.map((relProp) => (
                <div 
                  key={relProp.id}
                  className="w-[84vw] xs:w-[320px] sm:w-[350px] md:w-auto shrink-0 snap-start"
                >
                  <PropertyCard
                    property={relProp}
                    isFavorite={favorites.includes(relProp.id)}
                    onToggleFavorite={onToggleFavorite}
                    onSelectProperty={(p) => onNavigate(`/property/${p.id}`)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-center pt-4">
          <button
            type="button"
            onClick={() => onNavigate(categoryPath)}
            className="min-h-11 px-6 py-3 rounded-lg bg-black text-white text-xs font-semibold uppercase tracking-wider hover:bg-stone-800 cursor-pointer flex items-center gap-2"
          >
            <span>View All {categoryLabel} Listings</span>
            <ChevronRight size={16} />
          </button>
        </div>

      </div>
    </div>
  );
}
