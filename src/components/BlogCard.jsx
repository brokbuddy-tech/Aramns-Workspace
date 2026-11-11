import React from 'react';
import { Clock, Calendar, Compass } from 'lucide-react';

export default function BlogCard({ blog, onNavigate, className = '' }) {
  const handleClick = (e) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(`/blog/${blog.slug}`);
    } else {
      window.history.pushState({}, '', `/blog/${blog.slug}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <article
      onClick={handleClick}
      className={`group cursor-pointer flex flex-col items-start bg-transparent border-0 shadow-none text-left transition-all duration-300 ${className}`}
    >
      {/* 1. Featured Thumbnail Image (16:10 aspect ratio with smooth hover zoom) */}
      <div className="w-full aspect-[16/10] overflow-hidden rounded-[12px] bg-[#F2F2EF] relative">
        <img
          src={blog.thumbnail}
          alt={blog.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-[400ms] ease-out group-hover:scale-[1.04]"
        />
        {/* Subtle hover overlay sheen */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.03] transition-colors duration-300 pointer-events-none" />
      </div>

      {/* 2. Metadata Info Row (Clock, Calendar, Compass icons) */}
      <div className="mt-4 mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] sm:text-[14px] text-[#6B7280] font-normal">
        {/* Reading Time */}
        <span className="inline-flex items-center gap-1.5">
          <Clock size={14} className="text-[#9CA3AF] shrink-0" />
          <span>{blog.readTime}</span>
        </span>

        <span className="w-1 h-1 rounded-full bg-[#D1D5DB]" aria-hidden="true" />

        {/* Publication Date */}
        <span className="inline-flex items-center gap-1.5">
          <Calendar size={14} className="text-[#9CA3AF] shrink-0" />
          <span>{blog.date}</span>
        </span>

        <span className="w-1 h-1 rounded-full bg-[#D1D5DB]" aria-hidden="true" />

        {/* Category Tag */}
        <span className="inline-flex items-center gap-1.5 font-medium text-[#111827]">
          <Compass size={14} className="text-[#C5A059] shrink-0" />
          <span>{blog.category}</span>
        </span>
      </div>

      {/* 3. Article Headline (Title) */}
      <h3 className="text-[20px] sm:text-[21px] lg:text-[22px] font-bold text-[#111827] leading-[1.3] tracking-[-0.01em] transition-colors duration-300 group-hover:text-[#C5A059]">
        {blog.title}
      </h3>
    </article>
  );
}
