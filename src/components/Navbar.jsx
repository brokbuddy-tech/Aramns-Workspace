import {AGENTS} from '../data/agents';
import React, { useState, useEffect, useRef } from 'react';
import {
  Menu, X, ChevronDown, ChevronRight,
  Home, Key, MapPin
} from 'lucide-react';

export default function Navbar({
  onContactClick,
  onFavoritesClick,
  favoriteCount = 0,
  currentPath = '/',
  onNavigate
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [propertyDropdownOpen, setPropertyDropdownOpen] = useState(false);
  const [mobilePropertiesExpanded, setMobilePropertiesExpanded] = useState(true);

  const lastScrollYRef = useRef(0);
  const dropdownTimerRef = useRef(null);

  // Property Dropdown Categories (Buy, Rent)
  const propertyCategories = [
    {
      title: 'Buy',
      badge: 'For Sale',
      badgeColor: 'text-[#F97316] bg-[#F97316]/10 border-[#F97316]/30',
      description: 'Private estates, beachfront villas & penthouses',
      href: '/properties/buy',
      icon: Home
    },
    {
      title: 'Rent',
      badge: 'For Lease',
      badgeColor: 'text-[#0EA5E9] bg-[#0EA5E9]/10 border-[#0EA5E9]/30',
      description: 'Serviced sky palaces & luxury long-term leases',
      href: '/properties/rent',
      icon: Key
    }
  ];

  const handleMouseEnterDropdown = () => {
    if (dropdownTimerRef.current) clearTimeout(dropdownTimerRef.current);
    setPropertyDropdownOpen(true);
  };

  const handleMouseLeaveDropdown = () => {
    dropdownTimerRef.current = setTimeout(() => {
      setPropertyDropdownOpen(false);
    }, 180);
  };

  // Scroll direction detection logic
  useEffect(() => {
    lastScrollYRef.current = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollYRef.current;
      const threshold = 12; // Scroll tolerance threshold

      if (currentScrollY <= 50) {
        setIsVisible(true);
        setIsScrollingDown(false);
      } else if (Math.abs(delta) >= threshold) {
        if (delta > 0) {
          setIsVisible(false);
          setIsScrollingDown(true);
          setPropertyDropdownOpen(false);
        } else {
          setIsVisible(true);
          setIsScrollingDown(false);
        }
        lastScrollYRef.current = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent background scroll when mobile menu is active
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleNavClick = (e, link) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    setPropertyDropdownOpen(false);

    if (link.isRoute || link.href.startsWith('/')) {
      if (onNavigate) {
        onNavigate(link.href);
      } else {
        window.history.pushState({}, '', link.href);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
      return;
    }

    if (link.href.startsWith('#')) {
      if (currentPath !== '/') {
        if (onNavigate) {
          onNavigate('/', () => {
            setTimeout(() => {
              const target = document.querySelector(link.href);
              if (target) target.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          });
        }
      } else {
        const target = document.querySelector(link.href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  };

  const isAllListingsActive = currentPath === '/properties' || currentPath === '/properties/' || currentPath === '/properties/all';
  const isBuyActive = currentPath === '/properties/buy' || currentPath === '/buy' || currentPath === '/buy/';
  const isRentActive = currentPath.includes('/rent');
  const isMapActive = currentPath === '/map' || currentPath === '/map/' || currentPath.startsWith('/map');
  const isContactActive = currentPath === '/contact' || currentPath === '/contact/';

  return (
    <>
      {/* FLOATING TOP NAVIGATION BAR CONTAINER */}
      <header
        className="fixed top-4 sm:top-5 md:top-6 left-0 right-0 z-[9999] pointer-events-none"
        style={{
          transform: isVisible || mobileMenuOpen ? 'translateY(0%)' : 'translateY(-120%)',
          opacity: isVisible || mobileMenuOpen ? 1 : 0,
          transition: isVisible || mobileMenuOpen
            ? 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease-out',
          willChange: 'transform, opacity'
        }}
      >
        <div className="w-[calc(100%-24px)] sm:w-[calc(100%-48px)] lg:w-[calc(100%-64px)] xl:w-[calc(100%-80px)] 2xl:w-[calc(100%-96px)] mx-auto pointer-events-auto">
          <div className="bg-[#000000] border border-white/10 rounded-[14px] sm:rounded-[16px] shadow-[0_16px_40px_rgba(0,0,0,0.45)] px-6 sm:px-8 lg:px-10 py-[14px] sm:py-[16px] relative flex items-center justify-between transition-all duration-300">

            {/* Left Alignment: Brand Logo (Arman.png + Arman Alam) */}
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigate) onNavigate('/');
                else window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2.5 sm:gap-3 hover:opacity-90 transition-opacity select-none cursor-pointer z-10"
            >
              <img
                src="/arman.png"
                alt="Arman Property Advisor logo"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-white/20 shadow-xs"
              />
              <span className="text-[18px] sm:text-[21px] font-sans font-semibold text-[#FFFFFF] tracking-tight">
                {AGENTS[0]?.name}
              </span>
            </a>

            {/* Center Navigation Links (Desktop: All Listings > Buy > Rent > Map) */}
            <nav className="hidden lg:flex items-center gap-[26px] xl:gap-[34px] absolute left-1/2 -translate-x-1/2">

              {/* 1. All Listings */}
              <a
                href="/properties"
                onClick={(e) => handleNavClick(e, { label: 'All Listings', href: '/properties', isRoute: true })}
                className={`group relative text-[14px] xl:text-[15px] font-normal transition-opacity duration-200 py-1 ${isAllListingsActive ? 'text-white font-medium' : 'text-white/85 hover:text-white'
                  }`}
              >
                <span>All Listings</span>
                <span className={`absolute bottom-0 left-0 h-[2px] bg-white transition-all duration-200 ${isAllListingsActive ? 'w-full shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'w-0 group-hover:w-full group-hover:shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                  }`} />
              </a>

              {/* 2. Buy */}
              <a
                href="/properties/buy"
                onClick={(e) => handleNavClick(e, { label: 'Buy', href: '/properties/buy', isRoute: true })}
                className={`group relative text-[14px] xl:text-[15px] font-normal transition-opacity duration-200 py-1 ${isBuyActive ? 'text-white font-medium' : 'text-white/85 hover:text-white'
                  }`}
              >
                <span>Buy</span>
                <span className={`absolute bottom-0 left-0 h-[2px] bg-white transition-all duration-200 ${isBuyActive ? 'w-full shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'w-0 group-hover:w-full group-hover:shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                  }`} />
              </a>

              {/* 3. Rent */}
              <a
                href="/properties/rent"
                onClick={(e) => handleNavClick(e, { label: 'Rent', href: '/properties/rent', isRoute: true })}
                className={`group relative text-[14px] xl:text-[15px] font-normal transition-opacity duration-200 py-1 ${isRentActive ? 'text-white font-medium' : 'text-white/85 hover:text-white'
                  }`}
              >
                <span>Rent</span>
                <span className={`absolute bottom-0 left-0 h-[2px] bg-white transition-all duration-200 ${isRentActive ? 'w-full shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'w-0 group-hover:w-full group-hover:shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                  }`} />
              </a>

              {/* 4. Map */}
              <a
                href="/map"
                onClick={(e) => handleNavClick(e, { label: 'Map', href: '/map', isRoute: true })}
                className={`group relative text-[14px] xl:text-[15px] font-normal transition-opacity duration-200 py-1 flex items-center gap-1.5 ${isMapActive ? 'text-white font-medium' : 'text-white/85 hover:text-white'
                  }`}
              >
                <MapPin
                  size={14}
                  className={`transition-colors ${isMapActive ? 'text-amber-400' : 'text-white/70 group-hover:text-white'}`}
                />
                <span>Map</span>
                <span className={`absolute bottom-0 left-0 h-[2px] bg-white transition-all duration-200 ${isMapActive ? 'w-full shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'w-0 group-hover:w-full group-hover:shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                  }`} />
              </a>

            </nav>

            {/* Right Actions (Desktop) */}
            <div className="hidden lg:flex items-center gap-3 z-10">
              {/* Primary Call-to-Action (Rightmost Button) */}
              <button
                type="button"
                onClick={onContactClick}
                className="bg-[#FFFFFF] text-[#000000] text-[14px] font-semibold rounded-[8px] px-[22px] py-[10px] transition-all duration-200 hover:bg-[#F3F4F6] hover:scale-[1.03] active:scale-[0.98] select-none shadow-sm cursor-pointer"
              >
                Contact Us
              </button>
            </div>

            {/* Mobile / Tablet (< 1024px) Controls */}
            <div className="flex lg:hidden items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-white hover:text-white/80 focus:outline-none transition-colors cursor-pointer"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay with Solid Black Theme */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[9998] lg:hidden bg-black flex flex-col pt-28 px-6 sm:px-8 pb-10 justify-between animate-fade-in overflow-y-auto">
          <nav className="flex flex-col gap-4 pt-4">
            <span className="text-[11px] uppercase tracking-widest text-white/50 font-semibold font-mono">
              Directory
            </span>

            {/* 1. All Listings */}
            <a
              href="/properties"
              onClick={(e) => {
                handleNavClick(e, { label: 'All Listings', href: '/properties', isRoute: true });
                setMobileMenuOpen(false);
              }}
              className="text-[19px] font-normal text-white/90 hover:text-white transition-colors border-b border-white/10 pb-3 flex items-center justify-between"
            >
              <span>All Listings</span>
              <ChevronRight size={18} className="text-white/40" />
            </a>

            {/* 2. Buy */}
            <a
              href="/properties/buy"
              onClick={(e) => {
                handleNavClick(e, { label: 'Buy', href: '/properties/buy', isRoute: true });
                setMobileMenuOpen(false);
              }}
              className="text-[19px] font-normal text-white/90 hover:text-white transition-colors border-b border-white/10 pb-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <span>Buy</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  For Sale
                </span>
              </div>
              <ChevronRight size={18} className="text-white/40" />
            </a>

            {/* 3. Rent */}
            <a
              href="/properties/rent"
              onClick={(e) => {
                handleNavClick(e, { label: 'Rent', href: '/properties/rent', isRoute: true });
                setMobileMenuOpen(false);
              }}
              className="text-[19px] font-normal text-white/90 hover:text-white transition-colors border-b border-white/10 pb-3 flex items-center justify-between"
            >
              <span>Rent</span>
              <ChevronRight size={18} className="text-white/40" />
            </a>

            {/* 4. Map */}
            <a
              href="/map"
              onClick={(e) => {
                handleNavClick(e, { label: 'Map', href: '/map', isRoute: true });
                setMobileMenuOpen(false);
              }}
              className="text-[19px] font-normal text-white/90 hover:text-white transition-colors border-b border-white/10 pb-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <MapPin size={18} className="text-amber-400" />
                <span>Map</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Interactive
                </span>
              </div>
              <ChevronRight size={18} className="text-white/40" />
            </a>

          </nav>

          <div className="pt-6 border-t border-white/10 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                if (onContactClick) onContactClick();
              }}
              className="w-full bg-[#FFFFFF] text-[#000000] text-[15px] font-semibold rounded-[8px] py-[13px] text-center transition-all hover:bg-[#F3F4F6] active:scale-[0.98] cursor-pointer shadow-sm"
            >
              Contact Us
            </button>
          </div>
        </div>
      )}
    </>
  );
}
