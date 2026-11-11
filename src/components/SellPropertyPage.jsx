import {AGENTS} from '../data/agents';
import {useInquiry} from '../lib/inquiry';
import InquiryError from './InquiryError';
import React, { useState } from 'react';
import { 
  ArrowRight, CheckCircle2, Clock, DollarSign, Building, Award, 
  Sliders, Sparkles, Globe, Headphones, Plus, Minus, ChevronRight, Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import VisionCTA from './VisionCTA';

export default function SellPropertyPage({ onNavigate, onContactClick, showToast }) {
  const inquiry = useInquiry();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    propertyAddress: '',
    propertyType: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const scrollToValuation = (e) => {
    if (e) e.preventDefault();
    const element = document.getElementById('valuation-form');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (inquiry.pending) return;
    setIsSubmitting(true);
    const sent = await inquiry.submit({name:formData.fullName,email:formData.email,phone:formData.phone,propertyType:formData.propertyType,message:`Property valuation request\nAddress: ${formData.propertyAddress}\n${formData.message}`});
    setIsSubmitting(false);
    if (!sent) return;
    setIsSuccess(true);
    try { confetti({particleCount:90,spread:75,origin:{y:0.6},colors:['#D4AF37','#C5A059','#1E293B','#FAFAFA','#0A0A0C']}); } catch {}
    showToast?.('Your valuation enquiry has been received.', 'success');
  };

  const sellingProcessSteps = [
    {
      num: '01',
      title: 'Free Home Valuation',
      desc: "We assess your property's value based on current market trends."
    },
    {
      num: '02',
      title: 'Strategy & Staging',
      desc: 'Bespoke plans and curated decor to maximize first impressions.'
    },
    {
      num: '03',
      title: 'Marketing & Listing',
      desc: 'Your property gets luxury high-end visual showcase across elite global channels.'
    },
    {
      num: '04',
      title: 'Showings & Offers',
      desc: 'We host exclusive private viewings and negotiate best offers.'
    },
    {
      num: '05',
      title: 'Closing',
      desc: 'We handle all the contracts and legal details for a frictionless close.'
    }
  ];

  const whyChooseReasons = [
    {
      icon: Sliders,
      title: 'Strategic Pricing',
      desc: 'Market intelligence to price for maximum return and speed.'
    },
    {
      icon: Sparkles,
      title: 'Premium Marketing',
      desc: 'High-end visual production, drone tours, and exclusive print features.'
    },
    {
      icon: Globe,
      title: 'Network Reach',
      desc: 'Access to vetted buyers, ultra-high-net-worth investors, and family offices.'
    },
    {
      icon: Headphones,
      title: 'Dedicated Support',
      desc: '24/7 client concierge with regular updates throughout the entire journey.'
    }
  ];

  const statsList = [
    {
      icon: Clock,
      value: '—',
      label: 'Avg. Time on Market'
    },
    {
      icon: DollarSign,
      value: '—',
      label: 'Property Value Sold'
    },
    {
      icon: Building,
      value: '—',
      label: 'Luxury Properties Sold'
    },
    {
      icon: Award,
      value: '—',
      label: 'List-to-Sale Price Ratio'
    }
  ];

  const faqs = [
    {
      question: 'How does the valuation process work?',
      answer: 'Our senior valuation team conducts a thorough comparative market analysis, assessing unique architectural features, recent comps in your enclave, and current ultra-prime buyer demand. We provide a detailed confidential appraisal profile within 24–48 hours.'
    },
    {
      question: 'Do you help with staging and selling preparation?',
      answer: 'Yes. We partner with world-renowned interior designers and architectural photographers. From minor aesthetic curation to comprehensive white-glove staging and cinematic drone tours, we ensure your residence is presented at its absolute finest.'
    },
    {
      question: 'How do you determine the value of the property?',
      answer: 'We combine proprietary MLS transactional data, private off-market registry figures, current supply and absorption rates, and irreplaceable architectural provenance to establish a pricing strategy optimized for both speed and capital realization.'
    },
    {
      question: 'What types of properties can you sell with us?',
      answer: 'We specialize in ultra-prime residential estates, waterfront signature villas, architectural sky penthouses, and branded hotel residences.'
    },
    {
      question: 'How long does it typically take to sell a property?',
      answer: 'The time needed to sell depends on the property and current market conditions. Contact the broker to discuss the likely timeline for your property.'
    },
    {
      question: 'Why should I work with Novalux?',
      answer: 'Novalux provides unparalleled global reach, strict discretion protocols (including non-disclosure agreements before showing), property marketing support, and dedicated advisory from valuation to closing.'
    }
  ];

  return (
    <div className="w-full min-h-screen bg-[#FFFFFF] text-[#0A0A0C]">
      
      {/* ====================================================
          SECTION 1: HERO (Dark luxury aesthetic)
          ==================================================== */}
      <section className="relative w-full bg-[#000000] text-white pt-36 sm:pt-40 lg:pt-48 pb-24 sm:pb-28 lg:pb-36 overflow-hidden">
        
        {/* Subtle radial ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[radial-gradient(circle,_rgba(255,255,255,0.08)_0%,_rgba(0,0,0,0)_70%)] pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center space-y-6">
          
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-[11px] font-semibold uppercase tracking-widest text-white/90">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>SELLING A PROPERTY</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.12]">
            Sell Your Property for <br className="hidden sm:inline" />
            What It's Truly Worth
          </h1>

          {/* Subheading */}
          <p className="text-white/70 text-base sm:text-lg max-w-xl mx-auto font-normal leading-relaxed">
            A tailored approach from start to finish. Let's make sure that you get the best value for your real estate property.
          </p>

          {/* Primary CTA Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={scrollToValuation}
              className="inline-flex items-center gap-2 bg-white text-[#000000] font-semibold text-sm sm:text-[15px] px-7 py-3.5 rounded-full hover:bg-neutral-100 transition-all duration-200 shadow-md hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
            >
              <span>Get a Free Valuation</span>
              <ArrowRight size={16} />
            </button>
          </div>

        </div>
      </section>

      {/* ====================================================
          SECTION 2: OUR SELLING PROCESS
          ==================================================== */}
      <section className="w-full bg-[#FFFFFF] py-20 sm:py-24 lg:py-28 border-b border-stone-200/80">
        <div className="w-full max-w-[1360px] mx-auto px-6 sm:px-10 lg:px-14 space-y-12 sm:space-y-16">
          
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-stone-500">
                <span className="w-1.5 h-1.5 rounded-sm bg-black" />
                <span>HOW WE WORK</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#0A0A0C] tracking-tight">
                Our Selling Process
              </h2>
              <p className="text-stone-500 text-sm sm:text-base max-w-lg">
                A clear, guided path from first contact to the final closing sale.
              </p>
            </div>

            <button
              type="button"
              onClick={scrollToValuation}
              className="inline-flex items-center gap-2 bg-[#000000] text-white text-xs sm:text-sm font-semibold px-5 py-3 rounded-lg hover:bg-stone-800 transition-all shadow-sm w-fit cursor-pointer"
            >
              <span>Sell Your Home With Us</span>
              <ArrowRight size={15} />
            </button>
          </div>

          {/* 5 Step Cards (3 on top row, 2 on bottom row) */}
          <div className="space-y-6">
            
            {/* Top row: Steps 01, 02, 03 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {sellingProcessSteps.slice(0, 3).map((step) => (
                <div 
                  key={step.num}
                  className="bg-[#F8F9FA] border border-stone-200/80 rounded-2xl p-7 sm:p-8 flex flex-col justify-between hover:shadow-md hover:border-stone-300 transition-all group"
                >
                  <div className="space-y-5">
                    <div className="w-10 h-10 rounded-lg bg-white border border-stone-200 flex items-center justify-center font-mono font-bold text-sm text-stone-900 group-hover:bg-black group-hover:text-white transition-colors">
                      {step.num}
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg sm:text-xl font-bold text-[#0A0A0C]">
                        {step.title}
                      </h3>
                      <p className="text-stone-600 text-sm leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom row: Steps 04, 05 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sellingProcessSteps.slice(3, 5).map((step) => (
                <div 
                  key={step.num}
                  className="bg-[#F8F9FA] border border-stone-200/80 rounded-2xl p-7 sm:p-8 flex flex-col justify-between hover:shadow-md hover:border-stone-300 transition-all group"
                >
                  <div className="space-y-5">
                    <div className="w-10 h-10 rounded-lg bg-white border border-stone-200 flex items-center justify-center font-mono font-bold text-sm text-stone-900 group-hover:bg-black group-hover:text-white transition-colors">
                      {step.num}
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg sm:text-xl font-bold text-[#0A0A0C]">
                        {step.title}
                      </h3>
                      <p className="text-stone-600 text-sm leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>
      </section>

      {/* ====================================================
          SECTION 3: WHY SELLERS CHOOSE NOVALUX
          ==================================================== */}
      <section className="w-full bg-[#FFFFFF] py-20 sm:py-24 lg:py-28 border-b border-stone-200/80">
        <div className="w-full max-w-[1360px] mx-auto px-6 sm:px-10 lg:px-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* Left Column: Heading & Subtitle */}
            <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-32">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-stone-500">
                <span className="w-1.5 h-1.5 rounded-sm bg-black" />
                <span>WHY WORK WITH US</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#0A0A0C] tracking-tight leading-tight">
                Why Sellers Choose Novalux
              </h2>
              <p className="text-stone-500 text-sm sm:text-base leading-relaxed">
                Our proven process and tailored marketing approach will fulfill your dreams.
              </p>
            </div>

            {/* Right Column: 4 Feature Cards Stacked */}
            <div className="lg:col-span-7 space-y-4">
              {whyChooseReasons.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <div 
                    key={idx}
                    className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-7 shadow-sm hover:shadow-md hover:border-stone-300 transition-all flex items-start gap-4 sm:gap-5"
                  >
                    <div className="w-11 h-11 rounded-xl bg-stone-100 border border-stone-200/70 flex items-center justify-center text-stone-900 shrink-0">
                      <IconComponent size={20} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base sm:text-lg font-bold text-[#0A0A0C]">
                        {item.title}
                      </h3>
                      <p className="text-stone-600 text-sm leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </section>

      {/* ====================================================
          SECTION 4: KEY STATS / METRICS
          ==================================================== */}
      <section className="w-full bg-[#FFFFFF] py-16 sm:py-20 border-b border-stone-200/80">
        <div className="w-full max-w-[1360px] mx-auto px-6 sm:px-10 lg:px-14">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {statsList.map((stat, idx) => {
              const IconComp = stat.icon;
              return (
                <div 
                  key={idx}
                  className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div className="w-9 h-9 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-700 mb-6">
                    <IconComp size={18} />
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0A0A0C] tracking-tight mb-1">
                      {stat.value}
                    </div>
                    <div className="text-xs sm:text-sm text-stone-500 font-medium">
                      {stat.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ====================================================
          SECTION 5: VALUATION FORM ("What's Your Property Worth?")
          ==================================================== */}
      <section id="valuation-form" className="w-full bg-[#FAFAFA] py-20 sm:py-28 border-b border-stone-200/80 relative">
        <div className="w-full max-w-4xl mx-auto px-6">
          
          {/* Header */}
          <div className="text-center space-y-3 max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-stone-500 justify-center">
              <span className="w-1.5 h-1.5 rounded-sm bg-black" />
              <span>GET YOUR ESTIMATE</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#0A0A0C] tracking-tight">
              What's Your Property Worth?
            </h2>
            <p className="text-stone-500 text-sm sm:text-base leading-relaxed">
              Get a comprehensive market price evaluation from one of our specialists. Fill out the form below to receive a detailed report.
            </p>
          </div>

          {/* Form Container */}
          <div className="max-w-2xl mx-auto bg-white border border-stone-200 rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-lg relative">
            
            {isSuccess ? (
              <div className="py-12 text-center space-y-5 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 size={34} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl sm:text-3xl font-bold text-[#0A0A0C]">
                    Valuation Profile Initiated
                  </h3>
                  <p className="text-stone-600 text-sm max-w-md mx-auto leading-relaxed">
                    Thank you, <span className="font-semibold text-black">{formData.fullName || 'esteemed patron'}</span>. Your valuation enquiry has been received. The broker will contact you to discuss your property.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-600 max-w-md mx-auto text-left space-y-1">
                  <div className="font-semibold text-stone-900">Submitted Property:</div>
                  <div>{formData.propertyAddress || 'Prime Residential Property'}</div>
                  <div className="text-[11px] text-stone-500">Contact: {formData.email || 'Email registered'} | {formData.phone || 'Phone registered'}</div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSuccess(false);
                      setFormData({
                        fullName: '',
                        email: '',
                        phone: '',
                        propertyAddress: '',
                        propertyType: '',
                        message: ''
                      });
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-full border border-stone-300 text-xs font-semibold uppercase tracking-wider text-stone-800 hover:border-black transition-colors cursor-pointer"
                  >
                    Submit Another Property
                  </button>
                  <a
                    href={AGENTS[0]?.phone ? `tel:${AGENTS[0].phone}` : undefined}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-black text-white text-xs font-semibold uppercase tracking-wider hover:bg-stone-800 transition-colors cursor-pointer"
                  >
                    Speak with Director
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
            <InquiryError message={inquiry.error} />
                
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                    Full Name*
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-sm text-[#0A0A0C] placeholder-stone-400 focus:outline-none focus:border-black focus:bg-white transition-colors"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                    Email Address*
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-sm text-[#0A0A0C] placeholder-stone-400 focus:outline-none focus:border-black focus:bg-white transition-colors"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                    Phone Number*
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-sm text-[#0A0A0C] placeholder-stone-400 focus:outline-none focus:border-black focus:bg-white transition-colors"
                  />
                </div>

                {/* Property Address */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                    Property Address*
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.propertyAddress}
                    onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })}
                    placeholder="123 Ocean Drive, Miami Beach, FL 33139"
                    className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-sm text-[#0A0A0C] placeholder-stone-400 focus:outline-none focus:border-black focus:bg-white transition-colors"
                  />
                </div>

                {/* Property Type */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                    Property Type
                  </label>
                  <select
                    value={formData.propertyType}
                    onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-sm text-[#0A0A0C] focus:outline-none focus:border-black focus:bg-white transition-colors cursor-pointer"
                  >
                    <option value="">Select...</option>
                    <option value="Modern Villa">Modern Villa</option>
                    <option value="Sky Penthouse">Sky Penthouse</option>
                    <option value="Waterfront Estate">Waterfront Estate</option>
                    <option value="Branded Residence">Branded Residence</option>
                    <option value="Architectural Compound">Architectural Compound</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Additional Message */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                    Additional Message
                  </label>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us more about your property..."
                    className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-sm text-[#0A0A0C] placeholder-stone-400 focus:outline-none focus:border-black focus:bg-white transition-colors resize-none"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || inquiry.pending}
                    className="w-full py-4 rounded-xl bg-[#000000] hover:bg-stone-800 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>Analyzing Property Parameters...</span>
                    ) : (
                      <>
                        <span>Get My Free Valuation</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>

                {/* Security Note */}
                <p className="text-[11px] text-stone-400 text-center flex items-center justify-center gap-1.5 pt-1">
                  <Lock size={12} />
                  <span>All submissions are confidential and protected by strict fiduciary NDA protocols.</span>
                </p>

              </form>
            )}

          </div>

        </div>
      </section>

      {/* ====================================================
          SECTION 6: FREQUENTLY ASKED QUESTIONS
          ==================================================== */}
      <section className="w-full bg-[#FFFFFF] py-20 sm:py-24 lg:py-28 border-b border-stone-200/80">
        <div className="w-full max-w-[1360px] mx-auto px-6 sm:px-10 lg:px-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* Left Column: Heading & Description (Sticky on desktop) */}
            <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-32">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-stone-500">
                <span className="w-1.5 h-1.5 rounded-sm bg-black" />
                <span>FAQ</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#0A0A0C] tracking-tight leading-tight">
                Frequently Asked <br className="hidden sm:inline" />
                Questions
              </h2>
              <p className="text-stone-500 text-sm sm:text-base leading-relaxed">
                Everything you need to know about selling your property with us.
              </p>
            </div>

            {/* Right Column: Accordion Questions */}
            <div className="lg:col-span-7 divide-y divide-stone-200/90">
              {faqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div key={index} className="py-5 sm:py-6 first:pt-0 last:pb-0">
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      className="w-full flex items-center justify-between text-left gap-4 group cursor-pointer"
                    >
                      <span className="text-base sm:text-lg font-medium text-[#0A0A0C] group-hover:text-stone-700 transition-colors">
                        {faq.question}
                      </span>
                      <div className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-600 shrink-0 group-hover:border-black group-hover:text-black transition-colors">
                        {isOpen ? <Minus size={15} /> : <Plus size={15} />}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="pt-4 pr-12 text-sm text-stone-600 leading-relaxed animate-fade-in">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </section>

      {/* ====================================================
          SECTION 7: VISION CTA ("Let's Find the Property...")
          ==================================================== */}
      <VisionCTA onContactClick={onContactClick} />

    </div>
  );
}
