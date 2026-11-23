import {hasDisplayValue, displayValues, firstDisplayValue} from '../lib/display-data.mjs';
import {displayPropertyLocation} from '../lib/property-presentation.mjs';
import React, { useState, useEffect } from 'react';
import {X, Share2, MapPin, Calendar, Check, Car, Home, Thermometer, DollarSign, Layers} from 'lucide-react';
import { AGENTS } from '../data/agents';
import MortgageCalculator from './MortgageCalculator';
import RichText from './RichText';
import ListingRepresentative from './ListingRepresentative';
import ExpandableAmenity from './ExpandableAmenity';

export default function PropertyDetailModal({ 
  property, 
  onClose, 
  isFavorite, 
  onToggleFavorite
}) {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  if (!property) return null;

  const isSale = property.marketCategory === 'buy';
  const location=displayPropertyLocation(property);
  const amenities=displayValues(property.amenities);
  const specifications=[
    {label:'Year Built',value:property.yearBuilt,icon:Calendar},
    {label:'Property Type',value:firstDisplayValue(property.propertyType,property.category),icon:Home},
    {label:'Climate Control',value:property.heatingCooling,icon:Thermometer},
    {label:'Garage',value:property.garage,icon:Car},
    {label:'HOA Fees',value:property.hoaFees,icon:DollarSign},
    {label:'Lot Size',value:property.lotSize,icon:Layers},
  ].filter(spec=>hasDisplayValue(spec.value));

  const agent = AGENTS.find(a => a.id === property.agentId) || AGENTS[0];
  const getBadgeInfo = () => {
    if (property.listingType === 'FOR RENT' || property.marketCategory === 'rent') {
      return { label: 'FOR RENT', color: 'bg-[#0EA5E9]' };
    }
    return { label: 'FOR SALE', color: 'bg-[#F97316]' };
  };
  const badgeInfo = getBadgeInfo();

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-fade-in" 
      />

      {/* Modal Dialog Content */}
      <div className="relative w-full max-w-5xl bg-white border border-[#E5E7EB] rounded-2xl shadow-2xl overflow-hidden z-10 animate-slide-up my-auto max-h-[92vh] flex flex-col text-[#1E293B]">
        
        {/* Top Header Control Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] bg-stone-50/90 backdrop-blur-md shrink-0">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span 
              className={`shrink-0 px-2.5 py-0.5 rounded-[4px] text-[10px] font-bold tracking-wider uppercase text-white ${badgeInfo.color}`}
            >
              {badgeInfo.label}
            </span>
            {location && <span className="flex min-w-0 items-start gap-1 text-[10px] text-[#4B5563] md:hidden">
              <MapPin size={12} className="mt-0.5 shrink-0 text-[#9CA3AF]" />
              <span className="min-w-0 break-words">{location}</span>
            </span>}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-full bg-white border border-stone-200 text-[#475569] hover:text-[#0A0A0C] shadow-sm transition-colors"
              title="Copy property link"
            >
              {copied ? <Check size={16} className="text-emerald-600" /> : <Share2 size={16} />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-stone-200/70 hover:bg-stone-300 text-[#0A0A0C] transition-colors ml-2"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="overflow-y-auto flex-1 p-6 md:p-8 space-y-8">
          
          {/* Media Gallery Section */}
          <div className="space-y-3">
            <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shadow-sm">
              <img
                src={property.images ? property.images[activePhotoIdx] : property.image}
                alt={property.title}
                className="w-full h-full object-cover transition-all duration-300"
              />
              <div className="absolute top-4 left-4">
                <span 
                  className={`px-3 py-1 rounded-[4px] text-xs font-bold tracking-wider uppercase text-white shadow-md ${
                    isSale ? 'bg-[#F97316]' : 'bg-[#0EA5E9]'
                  }`}
                >
                  {isSale ? 'FOR SALE' : 'FOR RENT'}
                </span>
              </div>
            </div>

            {/* Thumbnail Row */}
            {property.images && property.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {property.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePhotoIdx(idx)}
                    className={`relative aspect-[16/10] rounded-lg overflow-hidden border-2 transition-all ${
                      idx === activePhotoIdx 
                        ? 'border-black shadow-md' 
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title, Address & Pricing Row */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E5E7EB]">
            <div className="hidden space-y-1.5 md:block">
              <h2 className="text-3xl sm:text-4xl text-[#0A0A0C] font-bold tracking-tight font-sans">
                {property.title}
              </h2>
              {location && <div className="hidden items-center gap-1.5 text-sm text-[#4B5563] md:flex">
                <MapPin size={16} className="text-[#9CA3AF] shrink-0" />
                <span>{location}</span>
              </div>}
            </div>

            {hasDisplayValue(property.priceFormatted) && <div className="md:text-right">
              {isSale && property.marketCategory !== 'rent' && property.listingType !== 'FOR RENT' && (
                <div className="text-xs uppercase tracking-wider text-[#64748B] font-mono">
                  Listing Price
                </div>
              )}
              <div className="text-[24px] md:text-4xl font-bold text-[#0A0A0C] tracking-tight font-sans">
                {property.priceFormatted || ''}
              </div>
            </div>}
          </div>

          {specifications.length > 0 && <div className="space-y-3">
            <h3 className="text-sm uppercase tracking-wider text-[#64748B] font-semibold font-mono">Key Specifications</h3>
            <div className="grid gap-3.5 p-4 rounded-xl bg-stone-50 border border-[#E5E7EB]" style={{gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 130px), 1fr))'}}>
              {specifications.map(({label,value,icon:Icon})=><div key={label} className="space-y-1 min-w-0">
                <span className="text-[11px] uppercase text-[#64748B] flex items-center gap-1 font-medium"><Icon size={13} className="text-black"/>{label}</span>
                <p className="text-base font-bold text-[#0A0A0C] break-words">{value}</p>
              </div>)}
            </div>
          </div>}

          {/* Description & Agent Action Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left 2 Cols: Detailed Description & Amenities */}
            <div className="lg:col-span-2 space-y-6">
              <div className={hasDisplayValue(property.description) ? '' : 'md:hidden'}>
                <h2 className="mb-3 text-[24px] font-bold text-[#0A0A0C] tracking-tight leading-[1.2] break-words md:hidden">{property.title}</h2>
                {hasDisplayValue(property.description) && <div className="space-y-3">
                  <h3 className="text-lg font-bold text-[#0A0A0C]">Description</h3>
                  <div className="description-scroll-region text-[#4B5563] leading-relaxed text-sm sm:text-base" tabIndex={0} role="region" aria-label="Property description">
                    <RichText value={property.description} />
                  </div>
                </div>}
              </div>

              {amenities.length > 0 && (
                <div className="space-y-2.5 sm:space-y-3 pt-3.5 sm:pt-4 border-t border-[#E5E7EB]">
                  <h3 className="text-base sm:text-lg font-bold text-[#0A0A0C]">Amenities &amp; Highlights</h3>
                  <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                    {amenities.map((item, idx) => (
                      <ExpandableAmenity key={`${property.id}-${idx}`} label={item} className="flex items-start sm:items-center gap-2 sm:gap-2.5 text-[12px] sm:text-sm text-[#334155] bg-stone-50 p-2 sm:p-2.5 rounded-lg border border-[#E5E7EB] leading-snug">
                        <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-black text-white flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                          <Check size={9} />
                        </span>
                      </ExpandableAmenity>
                    ))}
                  </div>
                </div>
              )}

              {/* Mortgage & Acquisition Calculator (Excluded for Rent) */}
              {property.marketCategory !== 'rent' && property.listingType !== 'FOR RENT' && (
                <div className="pt-4 border-t border-[#E5E7EB]">
                  {isSale && <MortgageCalculator property={property} />}
                </div>
              )}
            </div>

            <div className="space-y-5">
              <ListingRepresentative agent={agent} property={property}/>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
