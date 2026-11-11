import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

/**
 * BackToTop Component
 * Floats at the bottom-right of the screen and smoothly scrolls back to the top
 * when clicked. Appears automatically once the user has scrolled down > 300px.
 */
export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    // Run once on mount in case already scrolled
    toggleVisibility();

    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      title="Back to top"
      className={`fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-[990] w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black text-white shadow-2xl border border-white/20 flex items-center justify-center hover:bg-stone-900 hover:border-amber-400/60 hover:text-amber-300 transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-amber-400/50 ${
        isVisible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <ArrowUp
        size={20}
        strokeWidth={2.2}
        className="transition-transform duration-300 group-hover:-translate-y-0.5"
      />
    </button>
  );
}

