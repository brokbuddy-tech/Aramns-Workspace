import React from 'react';
import { TrendingUp, ShieldCheck, Award, Globe2 } from 'lucide-react';

const STATS = [
  {
    icon: TrendingUp,
    value: "$2.4B+",
    label: "Completed Transactions",
    caption: "Across ultra-luxury residences globally"
  },
  {
    icon: ShieldCheck,
    value: "150+",
    label: "Exclusive Off-Market Estates",
    caption: "Strictly confidential private collection"
  },
  {
    icon: Award,
    value: "98%",
    label: "Client Retention Rate",
    caption: "UHNW families & institutional trusts"
  },
  {
    icon: Globe2,
    value: "12",
    label: "Global Metropolitan Hubs",
    caption: "Direct brokerage & concierge advisory"
  }
];

export default function KeyStats() {
  return (
    <section className="relative z-10 border-y border-stone-200/80 bg-white py-12 lg:py-16 w-full shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 divide-y sm:divide-y-0 lg:divide-x divide-stone-200/80">
          
          {STATS.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div 
                key={stat.label} 
                className={`group flex flex-col justify-between pt-6 sm:pt-0 lg:px-6 transition-all duration-300 hover:translate-y-[-2px] ${
                  index === 0 ? 'lg:pl-0' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase tracking-luxury text-[#64748B] font-semibold font-mono">
                    0{index + 1} // METRIC
                  </span>
                  <div className="w-8 h-8 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center text-[#475569] group-hover:text-bronze group-hover:border-bronze/50 transition-colors">
                    <Icon size={16} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-semibold text-[#0A0A0C] tracking-tight leading-none group-hover:text-bronze transition-colors">
                    {stat.value}
                  </div>
                  <div className="text-sm font-medium text-[#1E293B] uppercase tracking-wider pt-1">
                    {stat.label}
                  </div>
                </div>

                <p className="text-xs text-[#64748B] pt-2 font-light">
                  {stat.caption}
                </p>
              </div>
            );
          })}

        </div>
      </div>
    </section>
  );
}
