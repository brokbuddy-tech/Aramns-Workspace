import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Building2, KeyRound, Briefcase, Award, ArrowUpRight } from 'lucide-react';

function WhoWeAreWord({ word, progress, range }) {
  const opacity = useTransform(progress, range, [0.22, 1]);
  const color = useTransform(progress, range, ['rgba(255, 255, 255, 0.28)', '#FFFFFF']);
  const y = useTransform(progress, range, [4, 0]);

  return (
    <motion.span
      style={{ opacity, color, y }}
      className="inline-block mr-[0.28em] font-normal transition-all"
    >
      {word}
    </motion.span>
  );
}

function WhoWeAreScrollParagraph({ text }) {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.88', 'end 0.45'],
  });

  const words = text.split(' ');

  return (
    <div ref={containerRef} className="relative pl-5 sm:pl-7 border-l-2 border-white/20">
      {/* Scroll-driven active vertical indicator line */}
      <motion.div
        style={{ scaleY: scrollYProgress, originY: 0 }}
        className="absolute -left-[2px] top-0 bottom-0 w-[2px] bg-white"
      />

      <p className="text-[17px] xs:text-[19px] sm:text-[24px] lg:text-[32px] font-normal text-white leading-[1.42] tracking-[-0.01em] select-none">
        {words.map((word, i) => {
          const start = i / words.length;
          const end = Math.min(start + (1.2 / words.length), 1);
          return (
            <WhoWeAreWord
              key={i}
              word={word}
              progress={scrollYProgress}
              range={[start, end]}
            />
          );
        })}
      </p>
    </div>
  );
}

export default function WhoWeAre() {
  const sectionRef = useRef(null);
  const [isInView, setIsInView] = useState(false);

  // Animated Numbers State
  const [counts, setCounts] = useState({
    val1: 0,
    val2: 0,
    val3: 0,
    val4: 0
  });

  // Intersection Observer to trigger scroll-based animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.25 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Numbers Count-Up Animation (1.5 seconds ease-out)
  useEffect(() => {
    if (!isInView) return;

    const duration = 1500;
    const startTime = performance.now();

    const animateCounters = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      setCounts({
        val1: Math.round(ease * 450),
        val2: Math.round(ease * 65),
        val3: Math.round(ease * 15),
        val4: Math.round(ease * 98)
      });

      if (progress < 1) {
        requestAnimationFrame(animateCounters);
      }
    };

    requestAnimationFrame(animateCounters);
  }, [isInView]);

  return (
    <section 
      ref={sectionRef}
      id="about"
      className="relative w-full bg-[#000000] text-white border-t border-white/[0.12] py-12 sm:py-16 md:py-20 lg:py-[100px] selection:bg-white selection:text-black"
    >
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 space-y-8 sm:space-y-12 lg:space-y-16">
        
        {/* 1. TOP HEADER BLOCK */}
        <div className="space-y-4 sm:space-y-6">
          {/* Category Badge */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-white inline-block" />
            <span className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.15em] text-[#E2E8F0]">
              WHO WE ARE
            </span>
          </div>

          {/* Main Statement & Right Text Link */}
          <div className="flex flex-col lg:flex-row items-start justify-between gap-6 lg:gap-12">
            
            {/* Left Column: Scroll-driven word illumination animation with vertical indicator line */}
            <div className="w-full max-w-4xl">
              <WhoWeAreScrollParagraph
                text="At Novalux, we believe luxury homes deserve exceptional representation. So we combine local expertise, refined marketing, and personalized guidance to help buyers and sellers navigate every move with confidence."
              />
            </div>

            {/* Right Column: "More About Us" Link */}
            <div className="shrink-0 pt-1 sm:pt-2">
              <a
                href="#agents"
                className="group inline-flex items-center gap-1.5 text-xs sm:text-[14px] font-medium text-white hover:text-white/80 transition-colors py-1 relative"
              >
                <span>Meet Our Advisors</span>
                <ArrowUpRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white transition-all duration-200 group-hover:w-full" />
              </a>
            </div>
          </div>
        </div>

        {/* 2. MAIN CONTENT GRID (SPLIT 50/50 LAYOUT) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-stretch">
          
          {/* Left Side: Featured Media Card */}
          <div className="relative rounded-[12px] overflow-hidden border border-white/10 shadow-2xl group min-h-[240px] xs:min-h-[280px] sm:min-h-[380px] lg:min-h-[440px] flex flex-col justify-end">
            <img
              src="/novalux-executive-team.jpg"
              alt="Novalux Executive Real Estate Leadership Team in front of architectural headquarters"
              className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            />
            {/* Subtle dark vignette overlay for high contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10 pointer-events-none" />

            {/* Card bottom caption */}
            <div className="relative z-10 p-4 sm:p-6 lg:p-8 flex items-end justify-between">
              <div>
                <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-white/70 font-mono font-semibold">
                  Executive Advisory
                </p>
                <h4 className="font-serif text-lg sm:text-xl lg:text-2xl text-white font-medium mt-0.5 sm:mt-1">
                  Novalux Partners &amp; Leadership
                </h4>
              </div>
              <span className="text-[10px] sm:text-[11px] text-white/60 border border-white/20 rounded-full px-2.5 sm:px-3 py-0.5 sm:py-1 font-mono backdrop-blur-sm shrink-0 ml-2">
                Dubai // Abu Dhabi
              </span>
            </div>
          </div>

          {/* Right Side: 2x2 Metrics Grid with Minimal 1px Dividers (Same 2x2 UI on Mobile with smaller scale) */}
          <div className="grid grid-cols-2 rounded-[12px] border border-white/10 bg-[#08080A] overflow-hidden">
            
            {/* Metric Box 1 (Top-Left) */}
            <div className="border-r border-b border-white/10 p-4 xs:p-5 sm:p-8 lg:p-10 flex flex-col justify-between space-y-3 sm:space-y-6 hover:bg-white/[0.02] transition-colors">
              <div className="text-white/80">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
              </div>
              <div className="space-y-1 sm:space-y-1.5">
                <div className="text-[26px] xs:text-[30px] sm:text-[42px] lg:text-[48px] font-bold text-white font-sans tracking-tight leading-none">
                  ${counts.val1}M+
                </div>
                <div className="text-[11px] xs:text-[12px] sm:text-[14px] text-[#9CA3AF] font-normal leading-snug sm:leading-normal">
                  Property Value Sold
                </div>
              </div>
            </div>

            {/* Metric Box 2 (Top-Right) */}
            <div className="border-b border-white/10 p-4 xs:p-5 sm:p-8 lg:p-10 flex flex-col justify-between space-y-3 sm:space-y-6 hover:bg-white/[0.02] transition-colors">
              <div className="text-white/80">
                <KeyRound className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
              </div>
              <div className="space-y-1.5">
                <div className="text-[26px] xs:text-[30px] sm:text-[42px] lg:text-[48px] font-bold text-white font-sans tracking-tight leading-none">
                  {counts.val2}+
                </div>
                <div className="text-[11px] xs:text-[12px] sm:text-[14px] text-[#9CA3AF] font-normal leading-snug sm:leading-normal">
                  Luxury Properties Sold
                </div>
              </div>
            </div>

            {/* Metric Box 3 (Bottom-Left) */}
            <div className="border-r border-white/10 p-4 xs:p-5 sm:p-8 lg:p-10 flex flex-col justify-between space-y-3 sm:space-y-6 hover:bg-white/[0.02] transition-colors">
              <div className="text-white/80">
                <Briefcase className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
              </div>
              <div className="space-y-1 sm:space-y-1.5">
                <div className="text-[26px] xs:text-[30px] sm:text-[42px] lg:text-[48px] font-bold text-white font-sans tracking-tight leading-none">
                  {counts.val3}+
                </div>
                <div className="text-[11px] xs:text-[12px] sm:text-[14px] text-[#9CA3AF] font-normal leading-snug sm:leading-normal">
                  Years of Experience
                </div>
              </div>
            </div>

            {/* Metric Box 4 (Bottom-Right) */}
            <div className="p-4 xs:p-5 sm:p-8 lg:p-10 flex flex-col justify-between space-y-3 sm:space-y-6 hover:bg-white/[0.02] transition-colors">
              <div className="text-white/80">
                <Award className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
              </div>
              <div className="space-y-1 sm:space-y-1.5">
                <div className="text-[26px] xs:text-[30px] sm:text-[42px] lg:text-[48px] font-bold text-white font-sans tracking-tight leading-none">
                  {counts.val4}%
                </div>
                <div className="text-[11px] xs:text-[12px] sm:text-[14px] text-[#9CA3AF] font-normal leading-snug sm:leading-normal">
                  Client Satisfaction Rate
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
