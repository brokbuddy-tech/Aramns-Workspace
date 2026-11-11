import React, { useState } from 'react';
import { Plus } from 'lucide-react';

export const FAQ_QUESTIONS = [
  {
    id: 'faq-1',
    question: 'How do I schedule a property viewing?',
    answer:
      'You can schedule a private showing directly through our website by clicking the "Schedule Viewing" button on any curated property profile, or by contacting our private client desk. We coordinate confidential in-person viewings with bespoke chauffeured transport, as well as live spatial 3D walkthroughs for international patrons.'
  },
  {
    id: 'faq-2',
    question: 'Do you help with both buying and selling properties?',
    answer:
      'Yes. Novalux provides comprehensive advisory for both acquiring and divesting ultra-luxury estates. Whether securing an off-market beachfront sanctuary or orchestrating a confidential private salon exhibition to sell a trophy penthouse, our senior partners oversee all valuation, marketing, escrow, and closing fiduciary steps.'
  },
  {
    id: 'faq-3',
    question: 'How do you determine the value of my property?',
    answer:
      'We deploy a proprietary tripartite appraisal framework that goes far beyond generic public market comps. Our valuation combines replacement cost analysis for museum-grade architectural materials, an extensive archive of verified off-market private transactions, and an architectural pedigree coefficient reflecting architect provenance and site exclusivity.'
  },
  {
    id: 'faq-4',
    question: 'What types of properties do you specialize in?',
    answer:
      'We represent exclusively prime and ultra-prime residences valued from $5 million to over $100 million. Our portfolio spans waterfront signature villas, architectural masterworks, skyline penthouses, private vineyard compounds, and multi-acre equestrian and hillside sanctuaries.'
  },
  {
    id: 'faq-5',
    question: 'How long does it typically take to sell a property?',
    answer:
      'While timelines depend on the uniqueness and scale of the residence, our targeted global marketing exhibitions and direct relationships with sovereign wealth networks typically yield fully qualified cash offers within 30 to 60 days, significantly accelerating traditional ultra-prime listing cycles.'
  },
  {
    id: 'faq-6',
    question: 'Why should I work with Novalux?',
    answer:
      'Novalux merges institutional financial rigor with absolute discretion. Our patrons benefit from strict double-blind mutual NDA protocols, bespoke 3D spatial cinematography, zero public portal exposure when requested, and dedicated senior advisory partners who have stewarded more than $1.8B in private acquisitions.'
  }
];

export default function FAQ() {
  const [openId, setOpenId] = useState(null);

  const toggleQuestion = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section id="faq" className="w-full bg-white text-[#111827] py-20 sm:py-24 lg:py-28 relative border-t border-black/[0.08]">
      <div className="w-full px-6 sm:px-12 lg:px-16 2xl:px-20 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* LEFT COLUMN: Badge, Title & Description (Sticky on desktop, tracks while scrolling questions) */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 xl:top-32 self-start space-y-4">
            
            {/* Top Badge: ■ FAQ with horizontal rule */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-medium tracking-[0.12em] uppercase text-[#111827]">
                <span className="text-[10px] leading-none select-none">■</span>
                <span>FAQ</span>
              </div>
              <div className="h-[1px] bg-black/15 flex-1 max-w-[280px]" />
            </div>

            {/* Main Headline */}
            <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-normal sm:font-medium text-[#111827] tracking-tight leading-[1.15]">
              Frequently Asked Questions
            </h2>

            {/* Subtitle Description */}
            <p className="text-[#64748B] text-base font-light leading-relaxed pt-1">
              Answers to the questions we hear most from buyers and sellers.
            </p>
          </div>

          {/* RIGHT COLUMN: Minimalist Accordion List with Horizontal Dividers */}
          <div className="lg:col-span-7 divide-y divide-black/15 border-t border-b border-black/15">
            {FAQ_QUESTIONS.map((faq) => {
              const isOpen = openId === faq.id;

              return (
                <div key={faq.id} className="transition-colors">
                  <button
                    type="button"
                    onClick={() => toggleQuestion(faq.id)}
                    aria-expanded={isOpen}
                    className="w-full py-6 sm:py-7 flex items-center justify-between text-left group cursor-pointer focus:outline-none"
                  >
                    <span className="text-[17px] sm:text-[18px] lg:text-[19px] font-normal text-[#111827] group-hover:text-black transition-colors pr-6 leading-snug">
                      {faq.question}
                    </span>

                    <span className="shrink-0 text-[#9CA3AF] group-hover:text-[#111827] transition-all duration-300">
                      <Plus
                        size={20}
                        strokeWidth={1.2}
                        className={`transition-transform duration-300 ${
                          isOpen ? 'rotate-45 text-[#111827]' : ''
                        }`}
                      />
                    </span>
                  </button>

                  {/* Expandable Answer */}
                  {isOpen && (
                    <div className="pb-6 pr-8 text-[#64748B] text-[15px] sm:text-[16px] font-light leading-relaxed animate-fade-in">
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
  );
}
