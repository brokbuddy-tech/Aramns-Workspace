import {useInquiry} from '../lib/inquiry';
import InquiryError from './InquiryError';
import React, { useState, useEffect } from 'react';
import { 
  X, Share2, MapPin, Bed, Bath, Maximize2, Calendar, 
  Shield, Check, Compass, Car, Sparkles, Phone, Mail, ArrowRight,
  FileText, Home, Thermometer, DollarSign, Layers
} from 'lucide-react';
import { AGENTS } from '../data/agents';
import MortgageCalculator from './MortgageCalculator';
import RichText from './RichText';

export default function PropertyDetailModal({ 
  property, 
  onClose, 
  isFavorite, 
  onToggleFavorite, 
  onScheduleShowing,
  showToast
}) {
  const inquiry = useInquiry();
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('14:00');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [isBooked, setIsBooked] = useState(false);
  const [brochureRequested, setBrochureRequested] = useState(false);
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
  const agent = AGENTS.find(a => a.id === property.agentId) || AGENTS[0];
  const getBadgeInfo = () => {
    if (property.listingType === 'FOR RENT' || property.marketCategory === 'rent') {
      return { label: 'FOR RENT', color: 'bg-[#0EA5E9]' };
    }
    return { label: 'FOR SALE', color: 'bg-[#F97316]' };
  };
  const badgeInfo = getBadgeInfo();

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    const sent=await inquiry.submit({name:clientName,email:clientEmail,listingId:property.id,message:`Viewing request for ${property.title}\nPreferred date: ${bookingDate || 'To be arranged'}\nTime: ${bookingTime}`});
    if (!sent) return;
    setIsBooked(true);
    onScheduleShowing?.({propertyTitle:property.title,date:bookingDate,time:bookingTime,clientName,clientEmail});
  };

  const handleRequestBrochure = () => {
    showToast?.('A downloadable brochure is currently unavailable. Contact the broker for property documents.', 'info');
  };

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
          <div className="flex items-center gap-3">
            <span 
              className={`px-2.5 py-0.5 rounded-[4px] text-[10px] font-bold tracking-wider uppercase text-white ${badgeInfo.color}`}
            >
              {badgeInfo.label}
            </span>
            <span className="text-xs uppercase tracking-luxury text-[#64748B] font-mono font-semibold">
              REF: {property.id.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2">
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
            <div className="space-y-1.5">
              <h2 className="text-3xl sm:text-4xl text-[#0A0A0C] font-bold tracking-tight font-sans">
                {property.title}
              </h2>
              <div className="flex items-center gap-1.5 text-sm text-[#4B5563]">
                <MapPin size={16} className="text-[#9CA3AF] shrink-0" />
                <span>{property.location}</span>
              </div>
            </div>

            <div className="md:text-right">
              {isSale && property.marketCategory !== 'rent' && property.listingType !== 'FOR RENT' && (
                <div className="text-xs uppercase tracking-wider text-[#64748B] font-mono">
                  Listing Price
                </div>
              )}
              <div className="text-3xl sm:text-4xl font-bold text-[#0A0A0C] tracking-tight font-sans">
                {property.priceFormatted || ''}
              </div>
            </div>
          </div>

          {/* Key Specifications Grid */}
          <div className="space-y-3">
            <h3 className="text-sm uppercase tracking-wider text-[#64748B] font-semibold font-mono">
              Key Specifications
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 p-4 rounded-xl bg-stone-50 border border-[#E5E7EB]">
              <div className="space-y-1">
                <span className="text-[11px] uppercase text-[#64748B] flex items-center gap-1 font-medium">
                  <Calendar size={13} className="text-black" /> Year Built
                </span>
                <p className="text-base font-bold text-[#0A0A0C]">{property.yearBuilt || '—'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] uppercase text-[#64748B] flex items-center gap-1 font-medium">
                  <Home size={13} className="text-black" /> Property Type
                </span>
                <p className="text-base font-bold text-[#0A0A0C] truncate">{property.propertyType || '—'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] uppercase text-[#64748B] flex items-center gap-1 font-medium">
                  <Thermometer size={13} className="text-black" /> Climate Control
                </span>
                <p className="text-base font-bold text-[#0A0A0C] truncate">{property.heatingCooling || '—'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] uppercase text-[#64748B] flex items-center gap-1 font-medium">
                  <Car size={13} className="text-black" /> Garage
                </span>
                <p className="text-base font-bold text-[#0A0A0C]">{property.garage || '—'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] uppercase text-[#64748B] flex items-center gap-1 font-medium">
                  <DollarSign size={13} className="text-black" /> HOA Fees
                </span>
                <p className="text-base font-bold text-[#0A0A0C]">{property.hoaFees || '—'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] uppercase text-[#64748B] flex items-center gap-1 font-medium">
                  <Layers size={13} className="text-black" /> Lot Size
                </span>
                <p className="text-base font-bold text-[#0A0A0C]">{property.lotSize || '—'}</p>
              </div>
            </div>
          </div>

          {/* Description & Agent Action Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left 2 Cols: Detailed Description & Amenities */}
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-[#0A0A0C]">Description</h3>
                <div className="text-[#4B5563] leading-relaxed text-sm sm:text-base">
                  <RichText value={property.description} />
                </div>
              </div>

              {property.amenities && (
                <div className="space-y-2.5 sm:space-y-3 pt-3.5 sm:pt-4 border-t border-[#E5E7EB]">
                  <h3 className="text-base sm:text-lg font-bold text-[#0A0A0C]">Amenities &amp; Highlights</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                    {property.amenities.map((item, idx) => (
                      <div key={idx} className="flex items-start sm:items-center gap-2 sm:gap-2.5 text-[12px] sm:text-sm text-[#334155] bg-stone-50 p-2 sm:p-2.5 rounded-lg border border-[#E5E7EB] leading-snug">
                        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-black text-white flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                          <Check size={9} />
                        </div>
                        <span className="break-words">{item}</span>
                      </div>
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

            {/* Right Col: Agent Contact & Direct CTA Buttons */}
            <div className="space-y-5">
              
              {/* Agent Profile Card */}
              <div className="p-5 rounded-xl bg-stone-50 border border-[#E5E7EB] space-y-4">
                <span className="text-[10px] uppercase tracking-wider text-[#64748B] font-semibold block font-mono">
                  Listing Representative
                </span>
                <div className="flex items-center gap-3">
                  <img
                    src={agent.avatar}
                    alt={agent.name}
                    className="w-12 h-12 rounded-full object-cover border border-stone-300"
                  />
                  <div>
                    <h5 className="text-base font-bold text-[#0A0A0C]">{agent.name}</h5>
                    <p className="text-xs text-[#64748B]">{agent.title}</p>
                    <p className="text-xs text-[#0A0A0C] font-mono mt-0.5">{agent.phone}</p>
                  </div>
                </div>

                {/* Direct Action Buttons: Schedule Private Tour & Request Brochure */}
                <div className="space-y-2.5 pt-2 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('booking-form');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full py-3 rounded-lg bg-[#000000] text-white font-medium text-xs tracking-wider uppercase transition-colors hover:bg-neutral-800 flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Calendar size={14} />
                    <span>Schedule Private Tour</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRequestBrochure}
                    className="w-full py-3 rounded-lg bg-white border border-[#E5E7EB] text-[#0A0A0C] font-medium text-xs tracking-wider uppercase transition-colors hover:bg-stone-50 flex items-center justify-center gap-2 shadow-sm"
                  >
                    {brochureRequested ? (
                      <>
                        <Check size={14} className="text-emerald-600" />
                        <span className="text-emerald-700">Brochure Sent to Email</span>
                      </>
                    ) : (
                      <>
                        <FileText size={14} />
                        <span>Request Brochure</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Private Showing Booking Form */}
              <div id="booking-form" className="p-5 rounded-xl bg-stone-50 border border-[#E5E7EB] shadow-sm space-y-3.5">
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-[#0A0A0C]">Direct Viewing Request</h4>
                  <p className="text-xs text-[#64748B]">Discreet appointments strictly for verified principals.</p>
                </div>

                {isBooked ? (
                  <div className="py-6 text-center space-y-2 bg-stone-100 rounded-lg border border-stone-300 p-4">
                    <Check size={28} className="text-black mx-auto" />
                    <p className="text-sm font-bold text-[#0A0A0C]">Private Tour Requested</p>
                    <p className="text-xs text-[#64748B]">The broker will contact you to arrange a viewing.</p>
                  </div>
                ) : (
                  <form onSubmit={handleBookingSubmit} className="space-y-3">
            <InquiryError message={inquiry.error} />
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-[#64748B] block mb-1 font-semibold">Full Legal Name</label>
                      <input
                        type="text"
                        required
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="e.g. Katherine Sterling"
                        className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs text-[#0A0A0C] placeholder-stone-400 focus:outline-none focus:border-black"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-[#64748B] block mb-1 font-semibold">Confidential Email</label>
                      <input
                        type="email"
                        required
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="principal@familyoffice.com"
                        className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs text-[#0A0A0C] placeholder-stone-400 focus:outline-none focus:border-black"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-[#64748B] block mb-1 font-semibold">Preferred Date</label>
                        <input
                          type="date"
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          className="w-full bg-white border border-stone-300 rounded-lg px-2 py-2 text-xs text-[#0A0A0C] focus:outline-none focus:border-black"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-[#64748B] block mb-1 font-semibold">Time Slot</label>
                        <select
                          value={bookingTime}
                          onChange={(e) => setBookingTime(e.target.value)}
                          className="w-full bg-white border border-stone-300 rounded-lg px-2 py-2 text-xs text-[#0A0A0C] focus:outline-none focus:border-black cursor-pointer"
                        >
                          <option value="10:00">10:00 AM</option>
                          <option value="14:00">02:00 PM</option>
                          <option value="17:00">05:00 PM</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit" disabled={inquiry.pending}
                      className="w-full mt-2 py-2.5 rounded-lg bg-[#000000] hover:bg-neutral-800 text-white font-medium text-xs tracking-wider uppercase transition-colors shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <span>Submit Tour Application</span>
                      <ArrowRight size={13} />
                    </button>
                  </form>
                )}
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
