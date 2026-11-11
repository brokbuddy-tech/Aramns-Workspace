import React from 'react';
import { BLOGS } from '../data/blogs';
import BlogCard from './BlogCard';
import { ChevronRight } from 'lucide-react';

export default function BlogSection({ onNavigate }) {
  // Present the first 3 featured home cards
  const homeCards = BLOGS.slice(0, 3);

  const handleReadAllPosts = () => {
    if (onNavigate) {
      onNavigate('/blog');
    } else {
      window.history.pushState({}, '', '/blog');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <section
      id="insights"
      className="w-full bg-[#FAF7F2] border-t border-black/[0.08] text-[#111827] pt-[100px] pb-[60px] relative overflow-hidden"
    >
      <div className="w-full px-6 sm:px-12 lg:px-16 2xl:px-20 mx-auto">
        
        {/* 1. SECTION HEADER BLOCK */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12 sm:mb-16">
          
          {/* Left Column: Category Badge + Title + Paragraph */}
          <div className="max-w-[620px] space-y-3">
            {/* Category Badge */}
            <div className="flex items-center gap-1.5 text-[12px] font-medium tracking-[0.12em] uppercase text-[#111827]">
              <span className="text-[10px] leading-none select-none">■</span>
              <span>BLOGS</span>
            </div>

            {/* Main Headline */}
            <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-semibold text-[#111827] tracking-[-0.02em] leading-[1.15]">
              Insights & Market Updates
            </h2>

            {/* Paragraph Description */}
            <p className="text-[16px] text-[#6B7280] leading-[1.5] mt-3 font-normal">
              Stay informed with thoughtful articles and expert perspectives on local market trends, luxury living and practical real estate advice.
            </p>
          </div>

          {/* Right Column: Primary Action Button */}
          <div className="shrink-0">
            <button
              onClick={handleReadAllPosts}
              className="group inline-flex items-center gap-2 bg-[#000000] text-[#FFFFFF] text-[15px] font-medium px-7 py-3.5 rounded-[8px] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md"
            >
              <span>Read All Posts</span>
              <ChevronRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </button>
          </div>

        </div>

        {/* 2. BLOG GRID ARCHITECTURE (3 Columns x 1 Row on Desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {homeCards.map((blog) => (
            <BlogCard
              key={blog.id}
              blog={blog}
              onNavigate={onNavigate}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
