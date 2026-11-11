import {useInquiry} from '../lib/inquiry';
import InquiryError from './InquiryError';
import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';
import { PROPERTIES } from '../data/properties';
import confetti from 'canvas-confetti';

export default function ScheduleViewingModal({ isOpen, onClose, preselectedProperty, onSubmitSuccess }) {
  const inquiry = useInquiry();
  const [selectedEstate, setSelectedEstate] = useState(preselectedProperty ? preselectedProperty.id : PROPERTIES[0]?.id || '');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('14:00');
  const [transportation, setTransportation] = useState('Chauffeured Rolls-Royce / Maybach');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (preselectedProperty) {
      setSelectedEstate(preselectedProperty.id);
    }
  }, [preselectedProperty]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const estateObj=PROPERTIES.find(p=>p.id===selectedEstate);
    const sent=await inquiry.submit({name:clientName,email:clientEmail,phone:clientPhone,...(estateObj ? {listingId:estateObj.id}:{}),message:`Viewing request: ${estateObj?.title || 'Broker portfolio'}\nPreferred date: ${preferredDate || 'To be arranged'}\nTime: ${preferredTime}\nRequested transport: ${transportation}`});
    if (!sent) return;
    setIsSuccess(true);
    try {confetti({particleCount:60,spread:60,origin:{y:0.6},colors:['#C5A059','#D4AF37','#FFFFFF']});} catch {}
    onSubmitSuccess?.({estate:estateObj?.title || 'Broker portfolio',clientName,preferredDate,preferredTime});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-black/60 backdrop-blur-md animate-fade-in" 
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-white border border-stone-200 rounded-2xl shadow-2xl p-6 sm:p-8 z-10 animate-slide-up space-y-6 text-[#1E293B]">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-luxury text-bronze font-semibold flex items-center gap-1.5">
              <Calendar size={12} />
              PRIVATE ACCESS
            </span>
            <h3 className="font-serif text-2xl text-[#0A0A0C] font-medium">Schedule A Confidential Viewing</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-[#0A0A0C] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-10 text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-stone-100 text-bronze border border-stone-200 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 size={32} />
            </div>
            <h4 className="font-serif text-2xl text-[#0A0A0C]">Viewing Request Received</h4>
            <p className="text-xs text-[#64748B] font-light max-w-sm mx-auto">
              Our Senior Managing Advisor will finalize logistical arrangements and coordinate your private access protocol.
            </p>
            <button
              onClick={() => {
                setIsSuccess(false);
                onClose();
              }}
              className="mt-3 px-6 py-2 rounded-full bg-[#0A0A0C] text-white font-medium text-xs uppercase tracking-wider hover:bg-neutral-800"
            >
              Close Window
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <InquiryError message={inquiry.error} />
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#64748B] block mb-1">Select Estate</label>
              <select
                value={selectedEstate}
                onChange={(e) => setSelectedEstate(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2.5 text-xs text-[#0A0A0C] focus:outline-none focus:border-bronze focus:bg-white cursor-pointer"
              >
                {PROPERTIES.map(p => (
                  <option key={p.id} value={p.id} className="bg-white text-[#0A0A0C]">
                    {p.title} — {p.priceFormatted} ({p.location})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#64748B] block mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Sterling Croft"
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2.5 text-xs text-[#0A0A0C] placeholder-stone-400 focus:outline-none focus:border-bronze focus:bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#64748B] block mb-1">Confidential Email</label>
                <input
                  type="email"
                  required
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="principal@familyoffice.com"
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2.5 text-xs text-[#0A0A0C] placeholder-stone-400 focus:outline-none focus:border-bronze focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#64748B] block mb-1">Direct Phone</label>
                <input
                  type="tel"
                  required
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-xs text-[#0A0A0C] placeholder-stone-400 focus:outline-none focus:border-bronze focus:bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#64748B] block mb-1">Preferred Date</label>
                <input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-2 text-xs text-[#0A0A0C] focus:outline-none focus:border-bronze focus:bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#64748B] block mb-1">Time Slot</label>
                <select
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2 py-2 text-xs text-[#0A0A0C] focus:outline-none focus:border-bronze focus:bg-white cursor-pointer"
                >
                  <option value="10:00">10:00 AM (Morning Sun)</option>
                  <option value="14:00">02:00 PM (Midday)</option>
                  <option value="17:00">05:00 PM (Golden Hour)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#64748B] block mb-1">Concierge Transfer Assistance</label>
              <select
                value={transportation}
                onChange={(e) => setTransportation(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-xs text-[#0A0A0C] focus:outline-none focus:border-bronze focus:bg-white cursor-pointer"
              >
                <option value="Chauffeured Rolls-Royce / Maybach">Chauffeured Rolls-Royce / Maybach Transfer</option>
                <option value="Helicopter Transfer to Private Pad">Helicopter Transfer to Private Landing Pad</option>
                <option value="Independent Private Arrival">Independent Private Arrival (Gate clearance)</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit" disabled={inquiry.pending}
                className="w-full py-3.5 rounded-xl bg-[#0A0A0C] hover:bg-[#27272A] text-white font-medium text-xs tracking-wider uppercase transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <span>Confirm Showing Request</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <p className="text-[10px] text-[#64748B] text-center font-mono">
              Proof of funds or advisor verification may be requested prior to confirmation.
            </p>
          </form>
        )}

      </div>
    </div>
  );
}
