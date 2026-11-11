import {useInquiry} from '../lib/inquiry';
import InquiryError from './InquiryError';
import {AGENTS} from '../data/agents';
import React, { useState } from 'react';
import {
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ContactPage({ onNavigate, showToast }) {
  const inquiry = useInquiry();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (inquiry.pending) return;
    setIsSubmitting(true);
    const sent = await inquiry.submit({name:`${formData.firstName} ${formData.lastName}`.trim(), email:formData.email, phone:formData.phone, message:[formData.subject,formData.message].filter(Boolean).join('\n')});
    setIsSubmitting(false);
    if (!sent) return;
    setIsSuccess(true);
    try { confetti({particleCount:90,spread:70,origin:{y:0.6},colors:['#C5A059','#D4AF37','#FAFAFA','#111827']}); } catch {}
    showToast?.('Your enquiry has been received. The broker will contact you to discuss your request.', 'success');
  };

  return (
    <div className="w-full bg-white text-[#111827] min-h-screen">
      
      {/* 1. HERO SECTION WITH BACKGROUND IMAGE */}
      <section className="relative w-full min-h-[460px] sm:min-h-[520px] lg:min-h-[580px] flex items-center justify-center overflow-hidden bg-[#0A0A0C]">
        
        {/* Background Photo */}
        <img
          src="/hero-dusk-villa.jpg"
          alt="Novalux Private Client Advisory Lounge"
          className="absolute inset-0 w-full h-full object-cover object-center scale-105 transition-transform duration-1000 ease-out"
        />

        {/* Ambient Dark Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C] via-[#0A0A0C]/75 to-black/50" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(197,160,89,0.08)_0%,_transparent_70%)] pointer-events-none" />

        {/* Hero Content */}
        <div className="relative z-10 w-full px-6 sm:px-12 lg:px-16 2xl:px-20 mx-auto text-center pt-28 pb-16 max-w-4xl space-y-5">
          
          {/* Main Headline */}
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-medium text-white tracking-tight leading-[1.12]">
            Connect With Our <br className="hidden sm:inline" />
            Private Client Advisory
          </h1>

          {/* Subtitle */}
          <p className="text-white/85 text-sm sm:text-base md:text-lg font-light leading-relaxed max-w-2xl mx-auto">
            Whether seeking an off-market acquisition, discreetly listing a generational estate, or structuring an institutional property profile, our senior partners are at your service.
          </p>

          {/* Quick Contact Pills */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-white/90">
            <a
              href={AGENTS[0]?.phone ? `tel:${AGENTS[0].phone}` : undefined}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 transition-colors"
            >
              <Phone size={13} className="text-[#C5A059]" />
              <span>{AGENTS[0]?.phone || '—'}</span>
            </a>
            <a
              href={AGENTS[0]?.email ? `mailto:${AGENTS[0].email}` : undefined}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 transition-colors"
            >
              <Mail size={13} className="text-[#C5A059]" />
              <span>{AGENTS[0]?.email || '—'}</span>
            </a>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/15">
              <Clock size={13} className="text-[#C5A059]" />
              <span>Contact the broker directly</span>
            </div>
          </div>

        </div>
      </section>


      {/* 2. CONTACT US FORM */}
      <section className="w-full py-16 sm:py-20 lg:py-24 relative">
        <div className="w-full px-4 sm:px-6 lg:px-8 mx-auto max-w-3xl">
          <div className="bg-stone-50 rounded-3xl border border-stone-200 shadow-xl p-6 sm:p-10 lg:p-12 relative overflow-hidden">
                
                {isSuccess ? (
                  /* Success Confirmation Screen */
                  <div className="py-12 text-center space-y-6 animate-fade-in">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
                      <CheckCircle2 size={36} />
                    </div>

                    <div className="space-y-2 max-w-md mx-auto">
                      <h3 className="font-serif text-2xl sm:text-3xl font-medium text-[#111827]">
                        Inquiry Transmitted
                      </h3>
                      <p className="text-sm text-[#64748B] font-light leading-relaxed">
                        Thank you, <span className="font-semibold text-[#111827]">{formData.firstName ? `${formData.firstName} ${formData.lastName}` : 'Valued Patron'}</span>. Your inquiry regarding "{formData.subject || 'Agency Advisory'}" has been transmitted to our advisory desk. A specialist will contact you shortly.
                      </p>
                    </div>

                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setIsSuccess(false);
                          setFormData({
                            firstName: '',
                            lastName: '',
                            email: '',
                            phone: '',
                            subject: '',
                            message: ''
                          });
                        }}
                        className="px-6 py-2.5 rounded-full border border-black/15 text-xs font-semibold uppercase tracking-wider text-[#111827] hover:bg-black hover:text-white transition-colors cursor-pointer"
                      >
                        Submit Another Inquiry
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Interactive Inquiry Form */
                  <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            <InquiryError message={inquiry.error} />

                    {/* FIRST NAME & LAST NAME */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                          FIRST NAME
                        </label>
                        <input
                          type="text"
                          required
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          placeholder="Enter first name"
                          className="w-full px-5 py-3.5 rounded-2xl bg-white border border-stone-200 shadow-xs text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black focus:bg-white transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                          LAST NAME
                        </label>
                        <input
                          type="text"
                          required
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          placeholder="Enter last name"
                          className="w-full px-5 py-3.5 rounded-2xl bg-white border border-stone-200 shadow-xs text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    {/* EMAIL ADDRESS */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                        EMAIL ADDRESS
                      </label>
                      <input
                        type="email"
                        required
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="email@example.com"
                        className="w-full px-5 py-3.5 rounded-2xl bg-white border border-stone-200 shadow-xs text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black focus:bg-white transition-all"
                      />
                    </div>

                    {/* PHONE */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                        PHONE
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Your phone number"
                        className="w-full px-5 py-3.5 rounded-2xl bg-white border border-stone-200 shadow-xs text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black focus:bg-white transition-all"
                      />
                    </div>

                    {/* SUBJECT */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                        SUBJECT
                      </label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="How can Agency Website help?"
                        className="w-full px-5 py-3.5 rounded-2xl bg-white border border-stone-200 shadow-xs text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black focus:bg-white transition-all"
                      />
                    </div>

                    {/* YOUR MESSAGE */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                        YOUR MESSAGE
                      </label>
                      <textarea
                        rows={5}
                        required
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="How can we assist you?"
                        className="w-full px-5 py-4 rounded-2xl bg-white border border-stone-200 shadow-xs text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black focus:bg-white transition-all resize-none min-h-[160px]"
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting || inquiry.pending}
                        className="w-full py-4 rounded-2xl bg-[#111827] hover:bg-[#C5A059] active:scale-[0.99] text-white text-xs font-semibold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 shadow-lg disabled:opacity-60 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Transmitting Inquiry...</span>
                          </>
                        ) : (
                          <>
                            <span>Submit Inquiry</span>
                            <ArrowRight size={15} />
                          </>
                        )}
                      </button>
                    </div>

                  </form>
                )}

              </div>
        </div>
      </section>

    </div>
  );
}
