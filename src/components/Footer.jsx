import {AGENTS} from '../data/agents';
import React from 'react';
import { Phone, Mail, MapPin, ExternalLink } from 'lucide-react';

/* Social Icon Components (White circle, black fill) */
const LinkedinIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.6 1.6 0 0 0 1.6-1.6 1.6 1.6 0 0 0-3.2 0 1.6 1.6 0 0 0 1.6 1.6m1.4 9.74v-8.37H5.06v8.37z" />
  </svg>
);

const FacebookIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const InstagramIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const TikTokIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.35a6.34 6.34 0 0 0-.86-.06A6.34 6.34 0 0 0 3 15.63a6.34 6.34 0 0 0 10.82 4.47 6.27 6.27 0 0 0 1.95-4.47V8.77a8.27 8.27 0 0 0 4.82 1.55v-3.45a4.83 4.83 0 0 1-1-.18z" />
  </svg>
);

const XIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export default function Footer({ onNavigate, onContactClick, onScheduleClick }) {
  const handleNav = (path) => {
    if (path.startsWith('#')) {
      const el = document.querySelector(path);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="w-full bg-[#000000] text-white pt-20 sm:pt-24 lg:pt-28 pb-10 overflow-hidden">
      <div className="w-full px-6 sm:px-12 lg:px-16 2xl:px-20 mx-auto">

        {/* Top Section: 3 Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16 pb-12 sm:pb-16 items-start">

          {/* Column 1: Tagline & Contact / Social Icons (Left) */}
          <div className="md:col-span-6 lg:col-span-5 space-y-7">
            <h2 className="text-2xl sm:text-3xl font-normal text-white leading-snug tracking-tight max-w-sm">
              Curating exceptional <br />
              homes and opportunities.
            </h2>

            {/* Circular Action Icons */}
            <div className="space-y-3 pt-1">
              {/* Row 1: Contact Icons (Phone, Mail, Location) */}
              <div className="flex items-center gap-3">
                <a
                  href={AGENTS[0]?.phone ? `tel:${AGENTS[0].phone}` : undefined}
                  title="Call Us"
                  className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-neutral-200 hover:scale-105 active:scale-95 transition-all shadow-sm"
                >
                  <Phone size={16} />
                </a>
                <a
                  href={AGENTS[0]?.email ? `mailto:${AGENTS[0].email}` : undefined}
                  title="Email Concierge"
                  className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-neutral-200 hover:scale-105 active:scale-95 transition-all shadow-sm"
                >
                  <Mail size={16} />
                </a>
                <button
                  type="button"
                  onClick={() => handleNav('#neighborhoods')}
                  title="Our Locations"
                  className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-neutral-200 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
                >
                  <MapPin size={16} />
                </button>
              </div>

              {/* Row 2: Social Media Icons (LinkedIn, Facebook, Instagram, TikTok, X) */}
              <div className="flex items-center gap-3">
                <a
                  href={AGENTS[0]?.socialLinks?.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  title="LinkedIn"
                  className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-neutral-200 hover:scale-105 active:scale-95 transition-all shadow-sm"
                >
                  <LinkedinIcon size={15} />
                </a>
                <a
                  href={AGENTS[0]?.socialLinks?.facebook}
                  target="_blank"
                  rel="noreferrer"
                  title="Facebook"
                  className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-neutral-200 hover:scale-105 active:scale-95 transition-all shadow-sm"
                >
                  <FacebookIcon size={16} />
                </a>
                <a
                  href={AGENTS[0]?.socialLinks?.instagram}
                  target="_blank"
                  rel="noreferrer"
                  title="Instagram"
                  className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-neutral-200 hover:scale-105 active:scale-95 transition-all shadow-sm"
                >
                  <InstagramIcon size={16} />
                </a>
                <a
                  aria-disabled="true"
                  target="_blank"
                  rel="noreferrer"
                  title="TikTok"
                  className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-neutral-200 hover:scale-105 active:scale-95 transition-all shadow-sm"
                >
                  <TikTokIcon size={15} />
                </a>
                <a
                  href={AGENTS[0]?.socialLinks?.twitter}
                  target="_blank"
                  rel="noreferrer"
                  title="X (Twitter)"
                  className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-neutral-200 hover:scale-105 active:scale-95 transition-all shadow-sm"
                >
                  <XIcon size={14} />
                </a>
              </div>
            </div>
          </div>

          {/* Right Section: Navigation, Portals, Discover in a Single Row */}
          <div className="md:col-span-6 lg:col-span-7 grid grid-cols-3 gap-2.5 sm:gap-8 lg:gap-16 w-full md:w-auto md:flex md:justify-end">

            {/* Column 1: Navigation */}
            <div className="space-y-3 sm:space-y-4 min-w-0">
              <h3 className="text-[13px] sm:text-base font-medium text-white tracking-tight">
                Navigation
              </h3>
              <ul className="space-y-2 sm:space-y-3 text-[11.5px] sm:text-sm text-[#A1A1AA] font-normal">
                <li>
                  <button
                    onClick={() => handleNav('/')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNav('/properties')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    All Listings
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNav('/properties/buy')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Buy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNav('/properties/rent')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Rent
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 2: Portals (Bayut, Property Finder, Dubizzle) */}
            <div className="space-y-3 sm:space-y-4 min-w-0">
              <h3 className="text-[13px] sm:text-base font-medium text-white tracking-tight">
                Portals
              </h3>
              <ul className="space-y-2 sm:space-y-3 text-[11.5px] sm:text-sm text-[#A1A1AA] font-normal">
                <li>
                  <a
                    href="https://www.bayut.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors flex items-center gap-1 group cursor-pointer"
                  >
                    <span>Bayut</span>
                    <ExternalLink size={10} className="text-[#71717A] group-hover:text-white transition-colors shrink-0" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.propertyfinder.ae"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors flex items-center gap-1 group cursor-pointer"
                  >
                    <span className="truncate">Property Finder</span>
                    <ExternalLink size={10} className="text-[#71717A] group-hover:text-white transition-colors shrink-0" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://dubizzle.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors flex items-center gap-1 group cursor-pointer"
                  >
                    <span>Dubizzle</span>
                    <ExternalLink size={10} className="text-[#71717A] group-hover:text-white transition-colors shrink-0" />
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Discover */}
            <div className="space-y-3 sm:space-y-4 min-w-0">
              <h3 className="text-[13px] sm:text-base font-medium text-white tracking-tight">
                Discover
              </h3>
              <ul className="space-y-2 sm:space-y-3 text-[11.5px] sm:text-sm text-[#A1A1AA] font-normal">
                <li>
                  <button
                    onClick={() => handleNav('/map')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Map Explorer
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNav('/contact')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Contact
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      if (onScheduleClick) onScheduleClick();
                      else if (onContactClick) onContactClick();
                      else handleNav('/contact');
                    }}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Private Viewing
                  </button>
                </li>
              </ul>
            </div>

          </div>

        </div>

        {/* Brand Watermark Typography ("Arman Alam") */}
        <div className="w-full select-none mt-6 sm:mt-10 mb-4 sm:mb-8 flex flex-col items-center justify-center text-center overflow-visible">
          <h1 className="sr-only">{AGENTS[0]?.name}</h1>
          <svg
            viewBox="0 0 620 95"
            className="w-[90%] mx-auto h-auto select-none block"
            preserveAspectRatio="xMidYMid meet"
          >
            <text
              x="310"
              y="76"
              textAnchor="middle"
              className="font-black fill-[#E5E5E5] font-sans"
              fontSize="92"
              letterSpacing="-0.02em"
            >
              {AGENTS[0]?.name}
            </text>
          </svg>

          {/* License ID on Mobile - Placed directly below the Arman Alam text */}
          <div className="sm:hidden text-center font-light text-xs text-[#71717A] mt-3 tracking-wider">
            Licensed ID - {AGENTS[0]?.licenseId}
          </div>
        </div>

        {/* Divider line below Arman Alam and Mobile License ID */}
        <div className="w-full border-b border-white/10 mb-6 sm:mb-8" />

        {/* Bottom Bar: Powered by Brokbuddy (Footer BB Tag) & License */}
        <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#71717A]">
          <a
            href="https://brokbuddy.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center sm:justify-start"
          >
            <img
              src="/footer-bb-tag.png"
              alt="Powered by Brokbuddy"
              className="h-7 sm:h-8 md:h-9 w-auto object-contain block"
            />
          </a>

          <div className="hidden sm:block text-right font-light">
            Licensed ID - {AGENTS[0]?.licenseId}
          </div>
        </div>

        {/* Centered Attribution / Credit Line */}
        <div className="pt-6 text-center text-xs text-[#71717A]/90 font-normal">
          © {new Date().getFullYear()} {AGENTS[0]?.name}
        </div>

      </div>
    </footer>
  );
}
