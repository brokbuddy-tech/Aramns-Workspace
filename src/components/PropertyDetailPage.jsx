import {trackVisibleProperty} from '../lib/property-popularity.mjs';
import {useInquiry} from '../lib/inquiry';
import InquiryError from './InquiryError';
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, ChevronRight, MapPin, 
  Bed, Bath, Maximize2, Calendar, ShieldCheck, Check, 
  Phone, Mail, Compass, Car,
  Sparkles, Layers, Building2, CheckCircle2,
  MessageSquare, Award, Clock, Calculator
} from 'lucide-react';
import { AGENTS } from '../data/agents';
import { PROPERTIES } from '../data/properties';
import PropertyCard from './PropertyCard';
import MortgageCalculator from './MortgageCalculator';
import RichText from './RichText';
import ListingLocationMap from './ListingLocationMap';
import PropertyPhotoGallery from './PropertyPhotoGallery';

export default function PropertyDetailPage({
  property,
  properties = PROPERTIES,
  favorites = [],
  onToggleFavorite,
  onNavigate,
  onScheduleShowing,
  onContactAdvisor,
  showToast
}) {
  useEffect(() => property?.status === 'ACTIVE' ? trackVisibleProperty(property.id) : undefined, [property?.id, property?.status]);
  const inquiry = useInquiry();

  // Viewing booking form state
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('14:00');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [isBooked, setIsBooked] = useState(false);

  // Scroll to top when property changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsBooked(false);
  }, [property?.id]);

  if (!property) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] pt-36 pb-20 px-6 text-center space-y-4">
        <h2 className="text-3xl font-semibold text-[#0A0A0C]">Property Not Found</h2>
        <p className="text-sm text-[#6B7280]">
          The requested luxury estate or residence could not be located in our active directory.
        </p>
        <button
          onClick={() => onNavigate && onNavigate('/properties/buy')}
          className="px-6 py-2.5 rounded-lg bg-black text-white text-xs uppercase tracking-wider font-semibold cursor-pointer"
        >
          View All Properties
        </button>
      </div>
    );
  }

  // Find assigned agent
  const agent = AGENTS.find(a => a.id === property.agentId || a.slug === property.agentId) || AGENTS[0];
  const isFavorite = favorites.includes(property.id);

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

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    const sent=await inquiry.submit({name:clientName,email:clientEmail,phone:clientPhone,listingId:property.id,message:`Viewing request for ${property.title}\nPreferred date: ${bookingDate || 'To be arranged'}\nTime: ${bookingTime}`});
    if (!sent) return;
    setIsBooked(true);
    onScheduleShowing?.({propertyTitle:property.title,date:bookingDate,time:bookingTime,clientName,clientEmail});
  };

  const categoryPath = `/properties/${property.marketCategory || 'buy'}`;
  const categoryLabel = property.marketCategory 
    ? property.marketCategory.charAt(0).toUpperCase() + property.marketCategory.slice(1) 
    : 'Properties';

  return (
    <div className="w-full min-h-screen bg-[#FDFDFD] text-[#0A0A0C] pt-28 sm:pt-36 pb-24">
      
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 space-y-10 sm:space-y-12">
        
        {/* 2. PROPERTY HEADLINE & PRICE SECTION */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            
            {/* Top Badges */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`px-2.5 py-1 rounded-[4px] text-[11px] font-bold tracking-wider uppercase text-white shadow-sm ${badgeInfo.color}`}>
                {badgeInfo.label}
              </span>
              <span className="text-xs uppercase tracking-widest text-[#64748B] font-mono font-semibold">
                REF: {property.id.toUpperCase()}
              </span>
              {property.handover && (
                <span className="px-2.5 py-1 rounded-[4px] text-[11px] font-semibold text-purple-900 bg-purple-100 border border-purple-200">
                  Handover: {property.handover}
                </span>
              )}
              {property.paymentPlan && (
                <span className="px-2.5 py-1 rounded-[4px] text-[11px] font-medium text-stone-700 bg-stone-100">
                  {property.paymentPlan}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-[32px] sm:text-[40px] lg:text-[46px] font-bold text-[#0A0A0C] tracking-tight leading-[1.18] font-sans">
              {property.title}
            </h1>

            {/* Address / Location */}
            <div className="flex items-center gap-2 text-[14px] sm:text-[15px] text-[#4B5563]">
              <MapPin size={17} className="text-[#9CA3AF] shrink-0" />
              <span>{property.location}</span>
            </div>

          </div>

          {/* Price Block */}
          <div className="lg:text-right shrink-0 p-4 sm:p-5 bg-stone-50 border border-[#E5E7EB] rounded-2xl">
            {!(property.listingType === 'FOR RENT' || property.marketCategory === 'rent') && (
              <span className="text-[11px] uppercase tracking-wider text-[#6B7280] font-mono block mb-1">
                Asking Price
              </span>
            )}
            <div className="text-[34px] sm:text-[42px] font-bold text-[#0A0A0C] tracking-tight font-sans">
              {property.priceFormatted || ''}
            </div>
            {property.hoaFees && (
              <span className="text-[12px] text-[#6B7280] block mt-1">
                Service / HOA: {property.hoaFees}
              </span>
            )}
          </div>
        </div>

        <PropertyPhotoGallery key={property.id} images={property.images} title={property.title} />

        {/* 4. ESSENTIAL PROPERTY SPECS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 p-5 sm:p-6 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm">
          
          {/* Beds / Type */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700 shrink-0">
              <Bed size={20} />
            </div>
            <div>
              <span className="text-[11px] text-stone-500 uppercase tracking-wider block font-mono">
                Bedrooms
              </span>
              <span className="text-[15px] font-bold text-black">
                {property.beds} Suites
              </span>
            </div>
          </div>

          {/* Baths */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700 shrink-0">
              <Bath size={20} />
            </div>
            <div>
              <span className="text-[11px] text-stone-500 uppercase tracking-wider block font-mono">Bathrooms</span>
              <span className="text-[15px] font-bold text-black">{property.baths} Baths</span>
            </div>
          </div>

          {/* Sqft */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700 shrink-0">
              <Maximize2 size={20} />
            </div>
            <div>
              <span className="text-[11px] text-stone-500 uppercase tracking-wider block font-mono">Total Area</span>
              <span className="text-[15px] font-bold text-black">{property.sqft.toLocaleString()} sqft</span>
            </div>
          </div>

          {/* Year / Handover */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700 shrink-0">
              <Calendar size={20} />
            </div>
            <div>
              <span className="text-[11px] text-stone-500 uppercase tracking-wider block font-mono">
                {property.handover ? 'Handover' : 'Built Year'}
              </span>
              <span className="text-[15px] font-bold text-black">
                {property.handover || property.yearBuilt || '—'}
              </span>
            </div>
          </div>

          {/* Garage / Parking */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700 shrink-0">
              <Car size={20} />
            </div>
            <div>
              <span className="text-[11px] text-stone-500 uppercase tracking-wider block font-mono">Parking</span>
              <span className="text-[15px] font-bold text-black truncate max-w-[120px]">
                {property.garage ? property.garage.split('+')[0] : '—'}
              </span>
            </div>
          </div>

          {/* Plot Size */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700 shrink-0">
              <Layers size={20} />
            </div>
            <div>
              <span className="text-[11px] text-stone-500 uppercase tracking-wider block font-mono">Plot / Lot</span>
              <span className="text-[15px] font-bold text-black truncate max-w-[120px]">
                {property.lotSize ? property.lotSize.split('+')[0] : '—'}
              </span>
            </div>
          </div>

        </div>

        {/* 5. MAIN CONTENT SPLIT (Left Column: Description & Amenities, Right Column: Sticky Booking & Advisor) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          
          {/* LEFT COLUMN: Main In-Depth Details (7 Columns) */}
          <div className="lg:col-span-7 space-y-10">
            
            {/* Description */}
            <div className="space-y-4 text-stone-700 leading-[1.75] text-[15px] sm:text-[16px]">
              <h3 className="text-[20px] font-bold text-black font-sans tracking-tight">
                Description
              </h3>
              <RichText value={property.description} />
              <p>
                Each architectural component has been engineered to celebrate uninterrupted natural light, effortless privacy, and world-class luxury finishes. From bespoke European imported stone to state-of-the-art smart home integration, this estate stands as a paragon of contemporary Middle Eastern design.
              </p>
            </div>

            {/* Amenities Grid (Responsive for Mobile & Desktop) */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="space-y-3 sm:space-y-4 pt-3.5 sm:pt-4 border-t border-[#E5E7EB]">
                <h3 className="text-[17px] sm:text-[19px] md:text-[20px] font-bold text-black font-sans tracking-tight flex items-center gap-2">
                  <Building2 size={18} className="text-black shrink-0 sm:w-5 sm:h-5" />
                  <span>Amenities &amp; Highlights</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {property.amenities.map((item, idx) => (
                    <div 
                      key={idx}
                      className="flex items-start sm:items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl bg-stone-50 border border-[#E5E7EB] text-[12.5px] sm:text-[13.5px] md:text-[14px] text-stone-800 font-medium leading-snug hover:bg-stone-100/70 transition-colors"
                    >
                      <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5 sm:mt-0 sm:w-[17px] sm:h-[17px]" />
                      <span className="break-words">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Technical Specs Table */}
            <div className="space-y-4 pt-4 border-t border-[#E5E7EB]">
              <h3 className="text-[20px] font-bold text-black font-sans tracking-tight">
                Property Specifications &amp; Dimensions
              </h3>
              <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden divide-y divide-[#E5E7EB] text-[14px]">
                <div className="flex items-center justify-between px-5 py-3.5">
                  <span className="text-stone-500">Property Type</span>
                  <span className="font-semibold text-black">{property.propertyType || property.category}</span>
                </div>
                <div className="flex items-center justify-between px-5 py-3.5">
                  <span className="text-stone-500">Climate &amp; HVAC</span>
                  <span className="font-semibold text-black">{property.heatingCooling || '—'}</span>
                </div>
                <div className="flex items-center justify-between px-5 py-3.5">
                  <span className="text-stone-500">Vehicular Garaging</span>
                  <span className="font-semibold text-black">{property.garage || '—'}</span>
                </div>
                <div className="flex items-center justify-between px-5 py-3.5">
                  <span className="text-stone-500">Service Charges / HOA</span>
                  <span className="font-semibold text-black">{property.hoaFees || '—'}</span>
                </div>
                <div className="flex items-center justify-between px-5 py-3.5">
                  <span className="text-stone-500">Plot Dimension</span>
                  <span className="font-semibold text-black">{property.lotSize || '—'}</span>
                </div>
                <div className="flex items-center justify-between px-5 py-3.5">
                  <span className="text-stone-500">Listing Status</span>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-xs">
                    {property.status}
                  </span>
                </div>
              </div>
            </div>

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

          {/* RIGHT COLUMN: Sticky Private Viewing & Assigned Advisor Card (5 Columns) */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-6">
            
            {/* 1. Schedule Private Viewing Widget */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-7 shadow-lg space-y-5">
              
              <div className="border-b border-[#E5E7EB] pb-4">
                <span className="text-[11px] font-mono uppercase tracking-widest text-stone-500 block mb-1">
                  Private Inspection
                </span>
                <h3 className="text-[20px] font-bold text-black tracking-tight">
                  Schedule Private Viewing
                </h3>
                <p className="text-[13px] text-stone-500 mt-1">
                  Private escorted tour with our Senior Portfolio Advisor. Discretion guaranteed.
                </p>
              </div>

              {isBooked ? (
                <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 text-center">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-700">
                    <Check size={24} />
                  </div>
                  <h4 className="text-[16px] font-bold text-emerald-950">
                    Showing Request Confirmed
                  </h4>
                  <p className="text-[13px] text-emerald-800">
                    Thank you, {clientName}. {agent.name} has received your request and will contact you directly to confirm access credentials.
                  </p>
                  <button
                    onClick={() => setIsBooked(false)}
                    className="text-xs font-semibold text-emerald-700 underline cursor-pointer"
                  >
                    Modify Request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-4">
            <InquiryError message={inquiry.error} />
                  
                  {/* Date Input */}
                  <div>
                    <label className="block text-[11px] uppercase font-bold text-stone-600 mb-1 tracking-wider">
                      Preferred Date
                    </label>
                    <input
                      type="date"
                      required
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full bg-[#F9F9FB] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-[14px] text-black focus:outline-none focus:border-black font-medium"
                    />
                  </div>

                  {/* Time Slot Picker */}
                  <div>
                    <label className="block text-[11px] uppercase font-bold text-stone-600 mb-1 tracking-wider">
                      Preferred Time Slot
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Morning', time: '10:30' },
                        { label: 'Afternoon', time: '14:00' },
                        { label: 'Sunset VIP', time: '17:30' }
                      ].map(slot => (
                        <button
                          type="button"
                          key={slot.time}
                          onClick={() => setBookingTime(slot.time)}
                          className={`py-2 px-2 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                            bookingTime === slot.time
                              ? 'bg-black text-white border-black shadow-sm'
                              : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-black'
                          }`}
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Name Input */}
                  <div>
                    <label className="block text-[11px] uppercase font-bold text-stone-600 mb-1 tracking-wider">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Lord Alexander Sinclair"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full bg-[#F9F9FB] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-[14px] text-black focus:outline-none focus:border-black placeholder:text-stone-400"
                    />
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] uppercase font-bold text-stone-600 mb-1 tracking-wider">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="vip@domain.com"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        className="w-full bg-[#F9F9FB] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-[14px] text-black focus:outline-none focus:border-black placeholder:text-stone-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase font-bold text-stone-600 mb-1 tracking-wider">
                        Phone / WhatsApp
                      </label>
                      <input
                        type="tel"
                        placeholder="+971 50 000 0000"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="w-full bg-[#F9F9FB] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-[14px] text-black focus:outline-none focus:border-black placeholder:text-stone-400"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit" disabled={inquiry.pending || property.status !== 'ACTIVE'}
                    className="w-full py-3.5 px-6 rounded-lg bg-black text-white text-[14px] font-semibold hover:bg-stone-800 transition-all duration-200 shadow-md hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  >
                    Request Viewing
                  </button>

                </form>
              )}

            </div>

            {/* 2. Assigned Real Estate Advisor Card */}
            <div className="bg-stone-50 border border-[#E5E7EB] rounded-2xl p-5 sm:p-6 space-y-4">
              <span className="text-[10px] uppercase font-mono tracking-widest text-stone-500 block">
                Exclusive Listing Representative
              </span>

              <div className="flex items-center gap-4">
                <img
                  src={agent.avatar || agent.image}
                  alt={agent.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
                />
                <div className="space-y-0.5">
                  <h4 className="text-[17px] font-bold text-black leading-tight">
                    {agent.name}
                  </h4>
                  <p className="text-[13px] text-stone-600 font-medium">
                    {agent.title || 'Senior Portfolio Advisor'}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold pt-0.5">
                    <Award size={13} />
                    <span>Certified Private Client Desk</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] grid grid-cols-2 gap-2">
                <a
                  href={`tel:${agent.phone}`}
                  className="py-2.5 px-3 rounded-lg bg-white border border-[#E5E7EB] text-xs font-semibold text-black hover:border-black transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Phone size={13} />
                  <span>Call Advisor</span>
                </a>

                <button
                  type="button"
                  onClick={() => onNavigate(`/agents/${agent.slug || agent.id}`)}
                  className="py-2.5 px-3 rounded-lg bg-black text-white text-xs font-semibold hover:bg-stone-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span>View Profile</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

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
              <button
                onClick={() => onNavigate(categoryPath)}
                className="text-xs font-semibold uppercase tracking-wider text-black hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>View All {categoryLabel} Listings</span>
                <ChevronRight size={14} />
              </button>
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

      </div>
    </div>
  );
}
