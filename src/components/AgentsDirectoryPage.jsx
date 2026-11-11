import React, { useState, useMemo, useEffect } from 'react';
import { AGENTS } from '../data/agents';
import {plainText} from './RichText';
import { ChevronRight, Search, SlidersHorizontal, MapPin, Award, Phone, Mail, ArrowLeft } from 'lucide-react';

export default function AgentsDirectoryPage({ onNavigate, onContactAgent }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('All');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [visibleCount, setVisibleCount] = useState(4);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const specializations = ['All', ...new Set(AGENTS.map(a=>a.specialization).filter(Boolean))];
  const regions = ['All', ...new Set(AGENTS.map(a=>a.region).filter(Boolean))];

  // Filter agents based on query and selections
  const filteredAgents = useMemo(() => {
    return AGENTS.filter((agent) => {
      const matchesSearch = 
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.specialization.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSpec = 
        selectedSpecialization === 'All' || 
        agent.specialization.toLowerCase().includes(selectedSpecialization.toLowerCase());

      const matchesRegion = 
        selectedRegion === 'All' || 
        agent.region.toLowerCase().includes(selectedRegion.toLowerCase());

      return matchesSearch && matchesSpec && matchesRegion;
    });
  }, [searchQuery, selectedSpecialization, selectedRegion]);

  // Reset pagination when search or filters change
  useEffect(() => {
    setVisibleCount(4);
  }, [searchQuery, selectedSpecialization, selectedRegion]);

  const handleAgentClick = (agent) => {
    if (onNavigate) {
      onNavigate(`/agents/${agent.slug}`, agent);
    } else {
      window.history.pushState({}, '', `/agents/${agent.slug}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handleHomeClick = () => {
    if (onNavigate) {
      onNavigate('/');
    } else {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#FAF8F5] text-[#111827] pt-28 sm:pt-36 pb-24">
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 space-y-10 sm:space-y-12">
        
        {/* PAGE HEADER BLOCK */}
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#111827] inline-block" />
            <span className="text-[12px] font-medium tracking-[0.12em] uppercase text-[#111827]">
              EXECUTIVE REAL ESTATE ADVISORY
            </span>
          </div>

          <h1 className="text-[36px] sm:text-[46px] lg:text-[54px] font-semibold text-[#111827] tracking-[-0.025em] leading-[1.1] font-sans">
            Our Luxury Real Estate Advisors
          </h1>

          <p className="text-[16px] sm:text-[18px] text-[#6B7280] leading-[1.6] font-normal">
            Every transaction requires exceptional stewardship. Meet our specialized principals delivering confidential off-market acquisitions and bespoke advisory across the UAE and global capital hubs.
          </p>
        </div>

        {/* SEARCH & FILTER CONTROLS BAR */}
        <div className="bg-white p-5 sm:p-6 rounded-[14px] border border-black/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search advisor by name, enclave, or title..."
                className="w-full pl-11 pr-4 py-3 bg-[#FAF8F5] border border-black/[0.08] rounded-[8px] text-[14px] text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-black focus:bg-white transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#6B7280] hover:text-black"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Specialization Filter Dropdown */}
            <div className="md:col-span-3">
              <select
                value={selectedSpecialization}
                onChange={(e) => setSelectedSpecialization(e.target.value)}
                className="w-full py-3 px-3.5 bg-[#FAF8F5] border border-black/[0.08] rounded-[8px] text-[13px] text-[#111827] focus:outline-none focus:border-black focus:bg-white cursor-pointer font-medium"
              >
                <option value="All">All Specializations</option>
                {specializations.filter(s => s !== 'All').map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>

            {/* Region Filter Dropdown */}
            <div className="md:col-span-3">
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full py-3 px-3.5 bg-[#FAF8F5] border border-black/[0.08] rounded-[8px] text-[13px] text-[#111827] focus:outline-none focus:border-black focus:bg-white cursor-pointer font-medium"
              >
                <option value="All">All UAE Regions</option>
                {regions.filter(r => r !== 'All').map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Active Filter Pills Indicator */}
          <div className="pt-2 border-t border-black/[0.04] flex flex-wrap items-center justify-between gap-3 text-xs text-[#6B7280]">
            <div>
              Showing <span className="font-semibold text-[#111827]">{filteredAgents.length}</span> of {AGENTS.length} Advisors
            </div>

            {(searchQuery || selectedSpecialization !== 'All' || selectedRegion !== 'All') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSpecialization('All');
                  setSelectedRegion('All');
                }}
                className="text-[12px] text-bronze hover:underline font-medium"
              >
                Reset All Filters
              </button>
            )}
          </div>
        </div>

        {/* 4-COLUMN AGENTS GRID */}
        {filteredAgents.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-white rounded-2xl border border-black/[0.06] p-8">
            <h3 className="font-serif text-2xl text-[#111827]">No Advisors Match Your Query</h3>
            <p className="text-sm text-[#6B7280] max-w-md mx-auto">
              Please adjust your search terms or filter criteria to discover our licensed partners.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSpecialization('All');
                setSelectedRegion('All');
              }}
              className="mt-2 px-5 py-2.5 rounded-lg bg-black text-white text-xs font-semibold uppercase tracking-wider"
            >
              Reset Search
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredAgents.slice(0, visibleCount).map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => handleAgentClick(agent)}
                  className="group cursor-pointer bg-white border border-black/[0.07] rounded-[14px] overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-black/20"
                >
                  <div>
                    {/* Portrait Image Container */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
                      <img
                        src={agent.avatar}
                        alt={agent.name}
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                      {/* Career Volume Badge */}
                      <div className="absolute top-3 right-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-white/95 text-black border border-stone-200 shadow-sm backdrop-blur-md">
                          {agent.careerVolume}
                        </span>
                      </div>

                      {/* Region Pill */}
                      <div className="absolute bottom-3 left-3">
                        <span className="px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider bg-black/75 text-white backdrop-blur-md">
                          {agent.region.split(',')[0]}
                        </span>
                      </div>
                    </div>

                    {/* Details Block */}
                    <div className="p-5 space-y-2">
                      <h3 className="text-[20px] font-bold text-[#111827] tracking-tight font-sans group-hover:text-black transition-colors">
                        {agent.name}
                      </h3>
                      <p className="text-[13px] text-[#6B7280] font-normal">
                        {agent.title}
                      </p>
                      <p className="text-[12px] text-[#475569] font-light line-clamp-2 pt-1 leading-relaxed">
                        {plainText(agent.bio)}
                      </p>
                    </div>
                  </div>

                  {/* Card Action Row */}
                  <div className="p-5 pt-0 border-t border-black/[0.04] flex items-center justify-between text-xs text-[#111827] mt-3">
                    <span className="font-semibold text-bronze uppercase tracking-wider text-[11px] font-mono">
                      {agent.experience}
                    </span>

                    <div className="flex items-center gap-1.5 font-medium group-hover:text-black transition-colors">
                      <span>View Profile</span>
                      <div className="w-6 h-6 rounded-[4px] bg-[#000000] text-white flex items-center justify-center transition-colors group-hover:bg-[#C5A059]">
                        <ChevronRight size={13} />
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>

            {/* Load More Advisors Button Block */}
            {visibleCount < filteredAgents.length ? (
              <div className="pt-4 flex flex-col items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={isLoadingMore}
                  onClick={() => {
                    setIsLoadingMore(true);
                    setTimeout(() => {
                      setVisibleCount((prev) => prev + 4);
                      setIsLoadingMore(false);
                    }, 350);
                  }}
                  className="px-8 py-3.5 rounded-full bg-[#111827] hover:bg-[#27272A] active:scale-[0.98] text-white text-xs font-semibold uppercase tracking-wider transition-all duration-200 flex items-center gap-2.5 shadow-md hover:shadow-lg disabled:opacity-60 cursor-pointer"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Loading Advisors...</span>
                    </>
                  ) : (
                    <>
                      <span>Load More Advisors</span>
                      <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-mono">
                        +{Math.min(4, filteredAgents.length - visibleCount)}
                      </span>
                    </>
                  )}
                </button>
                <p className="text-xs text-stone-500 font-mono">
                  Showing {Math.min(visibleCount, filteredAgents.length)} of {filteredAgents.length} Licensed Advisors
                </p>
              </div>
            ) : filteredAgents.length > 4 ? (
              <div className="pt-4 text-center">
                <p className="text-xs text-stone-400 font-mono uppercase tracking-wider">
                  All {filteredAgents.length} Licensed Advisors displayed
                </p>
              </div>
            ) : null}
          </div>
        )}

      </div>
    </div>
  );
}
