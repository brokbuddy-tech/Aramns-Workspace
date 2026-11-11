import React, { useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  ArrowRight, DollarSign, Clock, Building, Award, 
  ShieldCheck, Heart, TrendingUp, Lock, Plus, Minus, ChevronRight
} from 'lucide-react';
import { AGENTS } from '../data/agents';
import VisionCTA from './VisionCTA';

function MissionWord({ word, progress, range }) {
  const opacity = useTransform(progress, range, [0.22, 1]);
  const color = useTransform(progress, range, ['#D6D3D1', '#0A0A0C']);
  const y = useTransform(progress, range, [4, 0]);

  return (
    <motion.span
      style={{ opacity, color, y }}
      className="inline-block mr-[0.28em] font-medium transition-all"
    >
      {word}
    </motion.span>
  );
}

function MissionScrollParagraph({ text }) {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.85', 'end 0.40'],
  });

  const words = text.split(' ');

  return (
    <div ref={containerRef} className="relative pl-6 sm:pl-8 border-l-2 border-stone-200">
      {/* Scroll-driven active vertical indicator line */}
      <motion.div
        style={{ scaleY: scrollYProgress, originY: 0 }}
        className="absolute -left-[2px] top-0 bottom-0 w-[2px] bg-[#0A0A0C]"
      />

      <h2 className="text-2xl sm:text-3xl lg:text-[38px] font-medium tracking-tight leading-[1.42] max-w-5xl select-none">
        {words.map((word, i) => {
          const start = i / words.length;
          const end = Math.min(start + (1.2 / words.length), 1);
          return (
            <MissionWord
              key={i}
              word={word}
              progress={scrollYProgress}
              range={[start, end]}
            />
          );
        })}
      </h2>
    </div>
  );
}

export default function AboutUsPage({ onNavigate, onContactClick }) {
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const scrollToTeam = (e) => {
    if (e) e.preventDefault();
    const teamSection = document.getElementById('team-section');
    if (teamSection) {
      teamSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const stats = [
    {
      icon: DollarSign,
      value: '—',
      label: 'Property Value Sold'
    },
    {
      icon: Clock,
      value: AGENTS[0]?.experience || '—',
      label: 'Years of Experience'
    },
    {
      icon: Building,
      value: '—',
      label: 'Luxury Properties Sold'
    },
    {
      icon: Award,
      value: '—',
      label: 'Client Satisfaction Rate'
    }
  ];

  const values = [
    {
      icon: ShieldCheck,
      title: 'Integrity First',
      desc: 'We believe in radical transparency, straight answers, and unwavering fiduciary commitment.'
    },
    {
      icon: Heart,
      title: 'White-Glove Service',
      desc: 'Every detail, from curated showings to private transport, is handled with effortless precision.'
    },
    {
      icon: TrendingUp,
      title: 'Market Expertise',
      desc: 'Deep localized market data and proprietary insights to maximize capital value for our clients.'
    },
    {
      icon: Lock,
      title: 'Discretion & Privacy',
      desc: 'Ultra-high-net-worth client confidentiality and rigorous NDA protocols at every stage.'
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

  // The 6 team members shown in the reference UI mockup
  const teamMembers = AGENTS.slice(0, 6);

  return (
    <div className="w-full min-h-screen bg-[#FFFFFF] text-[#0A0A0C]">
      
      {/* ====================================================
          SECTION 1: HERO (Pitch-Black Luxury Header)
          ==================================================== */}
      <section className="relative w-full bg-[#000000] text-white pt-36 sm:pt-40 lg:pt-48 pb-20 sm:pb-24 lg:pb-32 overflow-hidden">
        
        {/* Subtle radial ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[radial-gradient(circle,_rgba(255,255,255,0.08)_0%,_rgba(0,0,0,0)_70%)] pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center space-y-6">
          
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-[11px] font-semibold uppercase tracking-widest text-white/90">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>ABOUT US</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.14]">
            Luxury Real Estate, <br className="hidden sm:inline" />
            Redefined by Trust and Taste.
          </h1>

          {/* Subheading */}
          <p className="text-white/70 text-base sm:text-lg max-w-2xl mx-auto font-normal leading-relaxed">
            We're a team of dedicated modern real estate professionals who believe that exceptional properties require exceptional service and a relentless focus on our clients.
          </p>

          {/* Primary CTA Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={scrollToTeam}
              className="inline-flex items-center gap-2 bg-white text-[#000000] font-semibold text-sm sm:text-[15px] px-7 py-3.5 rounded-full hover:bg-neutral-100 transition-all duration-200 shadow-md hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
            >
              <span>Meet Our Team</span>
              <ArrowRight size={16} />
            </button>
          </div>

        </div>
      </section>

      {/* ====================================================
          SECTION 2: FULL-WIDTH EXECUTIVE TEAM SHOWCASE IMAGE
          ==================================================== */}
      <section className="w-full bg-[#FFFFFF] pt-12 sm:pt-16 pb-8">
        <div className="w-full max-w-[1360px] mx-auto px-6 sm:px-10 lg:px-14">
          <div className="relative w-full h-[360px] sm:h-[480px] lg:h-[620px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-stone-200/80 bg-stone-100">
            <img 
              src="/novalux-executive-team.jpg" 
              alt="The Novalux Executive Advisory Team" 
              className="w-full h-full object-cover object-center transform hover:scale-[1.02] transition-transform duration-700 ease-out"
            />
            {/* Subtle bottom vignette gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>
      </section>

      {/* ====================================================
          SECTION 3: OUR MISSION (Editorial Statement with Scroll Animation)
          ==================================================== */}
      <section className="w-full bg-[#FFFFFF] py-16 sm:py-20 lg:py-24 border-b border-stone-200/80">
        <div className="w-full max-w-[1360px] mx-auto px-6 sm:px-10 lg:px-14 space-y-6">
          
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-stone-500"
          >
            <span className="w-1.5 h-1.5 rounded-sm bg-black" />
            <span>OUR MISSION</span>
          </motion.div>

          <MissionScrollParagraph
            text="Novalux began with a simple frustration — too many luxury homes were being sold the same way as ordinary ones. We set out to change that, building a team that treats every property, and every client, as the singular thing it is. Today, we represent some of the most distinguished homes in the region, guided by the same principle we started with: real estate done right, every time."
          />

        </div>
      </section>

      {/* ====================================================
          SECTION 4: KEY STATS / METRICS ROW
          ==================================================== */}
      <section className="w-full bg-[#FFFFFF] py-16 sm:py-20 border-b border-stone-200/80">
        <div className="w-full max-w-[1360px] mx-auto px-6 sm:px-10 lg:px-14">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((stat, idx) => {
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
          SECTION 5: WHAT WE STAND FOR (Our Values)
          ==================================================== */}
      <section className="w-full bg-[#FFFFFF] py-20 sm:py-24 lg:py-28 border-b border-stone-200/80">
        <div className="w-full max-w-[1360px] mx-auto px-6 sm:px-10 lg:px-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* Left Column: Heading & Subtitle */}
            <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-32">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-stone-500">
                <span className="w-1.5 h-1.5 rounded-sm bg-black" />
                <span>OUR VALUES</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#0A0A0C] tracking-tight leading-tight">
                What We Stand For
              </h2>
              <p className="text-stone-500 text-sm sm:text-base leading-relaxed">
                The principles that guide every client interaction and every transaction.
              </p>
            </div>

            {/* Right Column: 4 Feature Cards Stacked */}
            <div className="lg:col-span-7 space-y-4">
              {values.map((item, idx) => {
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
          SECTION 6: THE PEOPLE BEHIND NOVALUX (Team Showcase)
          ==================================================== */}
      <section id="team-section" className="w-full bg-[#FFFFFF] py-20 sm:py-24 lg:py-28 border-b border-stone-200/80">
        <div className="w-full max-w-[1360px] mx-auto px-6 sm:px-10 lg:px-14 space-y-12">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-stone-500">
                <span className="w-1.5 h-1.5 rounded-sm bg-black" />
                <span>MEET OUR TEAM</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#0A0A0C] tracking-tight">
                The People Behind Novalux
              </h2>
              <p className="text-stone-500 text-sm sm:text-base max-w-lg">
                A team of specialists dedicated to making your real estate vision reality.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate && onNavigate('/agents')}
              className="inline-flex items-center gap-2 bg-[#000000] text-white text-xs sm:text-sm font-semibold px-5 py-3 rounded-lg hover:bg-stone-800 transition-all shadow-sm w-fit cursor-pointer"
            >
              <span>Explore All Agents</span>
              <ArrowRight size={15} />
            </button>
          </div>

          {/* 6 Agent Cards (3x2 Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {teamMembers.map((agent) => (
              <div
                key={agent.id}
                onClick={() => onNavigate && onNavigate(`/agents/${agent.slug}`)}
                className="group bg-white border border-stone-200/90 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer"
              >
                {/* Photo Container */}
                <div className="relative w-full h-[280px] sm:h-[320px] bg-stone-100 overflow-hidden">
                  <img
                    src={agent.avatar}
                    alt={agent.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Info Container */}
                <div className="p-5 sm:p-6 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-[#0A0A0C] group-hover:text-stone-700 transition-colors">
                      {agent.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-stone-500 font-normal">
                      {agent.title}
                    </p>
                  </div>

                  {/* Circular Detail Button */}
                  <div className="w-8 h-8 rounded-full bg-stone-100 text-stone-800 flex items-center justify-center shrink-0 group-hover:bg-black group-hover:text-white transition-colors">
                    <ChevronRight size={16} />
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ====================================================
          SECTION 7: FREQUENTLY ASKED QUESTIONS
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
                Everything you need to know about working with us.
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
          SECTION 8: VISION CTA ("Let's Find the Property...")
          ==================================================== */}
      <VisionCTA onContactClick={onContactClick} />

    </div>
  );
}
