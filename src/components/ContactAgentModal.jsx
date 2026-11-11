import {useInquiry} from '../lib/inquiry';
import InquiryError from './InquiryError';
import React, { useState, useEffect } from 'react';
import { X, Phone, Mail, CheckCircle2, ArrowRight } from 'lucide-react';
import { AGENTS } from '../data/agents';

export default function ContactAgentModal({ isOpen, onClose, selectedAgent, onSubmitSuccess, listingId }) {
  const agent = selectedAgent || AGENTS[0];
  const inquiry = useInquiry();
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [inquiryType, setInquiryType] = useState('Acquisition Advisory');
  const [message, setMessage] = useState('');
  const [isSent, setIsSent] = useState(false);

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
    const sent=await inquiry.submit({name:clientName,email:clientEmail,...(listingId ? {listingId}:{}),message:[inquiryType,message].filter(Boolean).join('\n')});
    if (!sent) return;
    setIsSent(true);
    onSubmitSuccess?.({agentName:agent.name,clientName,inquiryType});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-md animate-fade-in" />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white border border-stone-200 rounded-2xl shadow-2xl p-6 sm:p-8 z-10 animate-slide-up space-y-6 text-[#1E293B]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div className="flex items-center gap-3">
            <img
              src={agent.avatar}
              alt={agent.name}
              className="w-12 h-12 rounded-full object-cover border border-bronze/60 shadow-sm"
            />
            <div>
              <h3 className="font-serif text-xl text-[#0A0A0C] font-medium">{agent.name}</h3>
              <p className="text-xs text-bronze font-medium">{agent.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-[#475569] hover:text-[#0A0A0C] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {isSent ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-bronze/10 text-bronze border border-bronze/30 flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} />
            </div>
            <h4 className="font-serif text-2xl text-[#0A0A0C]">Direct Message Dispatched</h4>
            <p className="text-xs text-[#475569] max-w-xs mx-auto">
              {agent.name} has received your enquiry and will contact you directly.
            </p>
            <button
              onClick={() => {
                setIsSent(false);
                onClose();
              }}
              className="mt-2 px-6 py-2.5 rounded-full bg-[#0A0A0C] hover:bg-[#27272A] text-white font-semibold text-xs uppercase tracking-wider transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <InquiryError message={inquiry.error} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#64748B] block mb-1 font-semibold">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Katherine Pierce"
                  className="w-full bg-[#F8F9FA] border border-stone-300 rounded-lg px-3.5 py-2.5 text-xs text-[#0A0A0C] placeholder-stone-400 focus:outline-none focus:border-bronze focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#64748B] block mb-1 font-semibold">Confidential Email</label>
                <input
                  type="email"
                  required
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="k.pierce@capital.com"
                  className="w-full bg-[#F8F9FA] border border-stone-300 rounded-lg px-3.5 py-2.5 text-xs text-[#0A0A0C] placeholder-stone-400 focus:outline-none focus:border-bronze focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#64748B] block mb-1 font-semibold">Inquiry Purpose</label>
              <select
                value={inquiryType}
                onChange={(e) => setInquiryType(e.target.value)}
                className="w-full bg-[#F8F9FA] border border-stone-300 rounded-lg px-3.5 py-2.5 text-xs text-[#0A0A0C] focus:outline-none focus:border-bronze focus:bg-white cursor-pointer transition-colors"
              >
                <option value="Acquisition Advisory">Estate Acquisition Advisory</option>
                <option value="Off-Market Private Listing">Confidential Off-Market Listing</option>
                <option value="Portfolio Valuation">Cross-Border Valuation & Syndication</option>
                <option value="Private Showing Coordination">Private Showing Request</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#64748B] block mb-1 font-semibold">Brief Briefing Notes</label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Mention specific regions, architectural preferences, or timeframes..."
                className="w-full bg-[#F8F9FA] border border-stone-300 rounded-lg p-3 text-xs text-[#0A0A0C] placeholder-stone-400 focus:outline-none focus:border-bronze focus:bg-white resize-none transition-colors"
              />
            </div>

            <button
              type="submit" disabled={inquiry.pending}
              className="w-full py-3.5 rounded-xl bg-[#0A0A0C] hover:bg-[#27272A] text-white font-semibold text-xs tracking-wider uppercase transition-colors shadow-md flex items-center justify-center gap-1.5"
            >
              <span>Transmit Inquiry</span>
              <ArrowRight size={14} />
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
