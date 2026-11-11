import React, { useState } from 'react';
import { BLOGS } from '../data/blogs';
import BlogCard from './BlogCard';
import {
  Clock,
  Calendar,
  Compass,
  ArrowLeft,
  Share2,
  Check,
  Link2,
  Mail,
  Sparkles,
  Bookmark
} from 'lucide-react';

const XTwitterIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const LinkedinIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect width="4" height="12" x="2" y="9"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

export default function BlogDetailPage({
  slug,
  onNavigate,
  onContactAuthor,
  showToast
}) {
  const [copied, setCopied] = useState(false);

  // Find article by slug or fallback
  const blog = BLOGS.find((b) => b.slug === slug) || BLOGS[0];

  // Related recommended articles (exclude current)
  const relatedArticles = BLOGS.filter((b) => b.id !== blog.id).slice(0, 3);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      if (showToast) {
        showToast('Article link copied to clipboard.', 'success');
      }
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareTwitter = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(blog.title);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const handleShareLinkedIn = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  return (
    <article className="w-full bg-[#FAF7F2] min-h-screen text-[#111827] pt-28 pb-28">
      <div className="w-full px-6 sm:px-12 lg:px-16 2xl:px-20 mx-auto max-w-6xl">
        
        {/* Article Header */}
        <header className="max-w-4xl mx-auto space-y-6 text-left mb-12">
          
          {/* Category Badge & Metadata Row */}
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-[#6B7280]">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#111827] text-white font-medium text-xs">
              <Compass size={13} className="text-[#C5A059]" />
              <span>{blog.category}</span>
            </span>

            <span className="w-1 h-1 rounded-full bg-[#D1D5DB]" />

            <span className="inline-flex items-center gap-1.5">
              <Calendar size={14} className="text-[#9CA3AF]" />
              <span>{blog.date}</span>
            </span>

            <span className="w-1 h-1 rounded-full bg-[#D1D5DB]" />

            <span className="inline-flex items-center gap-1.5">
              <Clock size={14} className="text-[#9CA3AF]" />
              <span>{blog.readTime}</span>
            </span>
          </div>

          {/* Large Display Headline */}
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-[46px] font-medium text-[#111827] leading-[1.2] tracking-tight">
            {blog.title}
          </h1>

          {/* Subtitle / Excerpt */}
          <p className="text-lg sm:text-xl text-[#4B5563] font-light leading-relaxed">
            {blog.excerpt}
          </p>

          {/* Author Byline Row */}
          <div className="pt-6 border-t border-black/[0.08] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <img
                src={blog.author.avatar}
                alt={blog.author.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-[#C5A059] shadow-sm"
              />
              <div>
                <div className="text-sm font-semibold text-[#111827]">{blog.author.name}</div>
                <div className="text-xs text-[#6B7280]">{blog.author.title}</div>
              </div>
            </div>

            {/* Quick Share Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                title="Copy Article Link"
                className="p-2.5 rounded-full bg-white border border-black/10 text-[#111827] hover:bg-[#111827] hover:text-white transition-all shadow-sm"
              >
                {copied ? <Check size={16} className="text-emerald-500" /> : <Link2 size={16} />}
              </button>
              <button
                onClick={handleShareTwitter}
                title="Share on X / Twitter"
                className="p-2.5 rounded-full bg-white border border-black/10 text-[#111827] hover:bg-[#111827] hover:text-white transition-all shadow-sm"
              >
                <XTwitterIcon size={15} />
              </button>
              <button
                onClick={handleShareLinkedIn}
                title="Share on LinkedIn"
                className="p-2.5 rounded-full bg-white border border-black/10 text-[#111827] hover:bg-[#111827] hover:text-white transition-all shadow-sm"
              >
                <LinkedinIcon size={15} />
              </button>
            </div>
          </div>

        </header>

        {/* Featured Cover Image */}
        <div className="w-full aspect-[16/9] lg:aspect-[21/9] overflow-hidden rounded-2xl shadow-xl mb-16 relative">
          <img
            src={blog.coverImage || blog.thumbnail}
            alt={blog.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded text-[11px] text-white/90 font-mono">
            Archival Photography • Private Reserve Portfolio
          </div>
        </div>

        {/* Main Article Body (Centered, max-width ~780px) */}
        <div className="max-w-[780px] mx-auto space-y-10 text-left">
          
          {/* Key Takeaways Callout Box */}
          {blog.takeaways && blog.takeaways.length > 0 && (
            <div className="p-8 rounded-2xl bg-white border border-black/10 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-luxury uppercase text-[#C5A059]">
                <Sparkles size={16} />
                <span>Executive Profile Key Takeaways</span>
              </div>
              <ul className="space-y-3">
                {blog.takeaways.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm sm:text-base text-[#374151] leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] mt-2.5 shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Dynamic Editorial Content Paragraphs & Subheadings */}
          {blog.content.map((block, idx) => {
            if (block.type === 'paragraph') {
              return (
                <p key={idx} className="text-base sm:text-lg text-[#374151] font-light leading-[1.8]">
                  {block.text}
                </p>
              );
            }
            if (block.type === 'heading2') {
              return (
                <h2 key={idx} className="font-serif text-2xl sm:text-3xl font-medium text-[#111827] pt-6 pb-2 border-b border-black/10">
                  {block.text}
                </h2>
              );
            }
            if (block.type === 'heading3') {
              return (
                <h3 key={idx} className="font-sans text-xl sm:text-2xl font-semibold text-[#111827] pt-4">
                  {block.text}
                </h3>
              );
            }
            if (block.type === 'quote') {
              return (
                <blockquote
                  key={idx}
                  className="p-6 sm:p-8 rounded-xl bg-white border-l-4 border-[#C5A059] shadow-sm my-8 space-y-3"
                >
                  <p className="font-serif text-xl sm:text-2xl text-[#111827] italic leading-snug">
                    "{block.text}"
                  </p>
                  {block.author && (
                    <footer className="text-xs uppercase tracking-wider text-[#6B7280] font-mono font-semibold">
                      — {block.author}
                    </footer>
                  )}
                </blockquote>
              );
            }
            if (block.type === 'image') {
              return (
                <figure key={idx} className="my-8 space-y-2">
                  <div className="overflow-hidden rounded-xl shadow-md">
                    <img
                      src={block.url}
                      alt={block.caption || 'Editorial Architectural Illustration'}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                  {block.caption && (
                    <figcaption className="text-xs text-[#6B7280] text-center font-mono italic">
                      {block.caption}
                    </figcaption>
                  )}
                </figure>
              );
            }
            return null;
          })}

          {/* Social Sharing Bar (Mid/End of Article) */}
          <div className="py-8 my-8 border-y border-black/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[#111827]">
              <Share2 size={18} className="text-[#C5A059]" />
              <span>Share this private perspective:</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShareTwitter}
                className="px-4 py-2 rounded-lg bg-white border border-black/10 text-xs font-medium text-[#111827] hover:bg-[#111827] hover:text-white transition-all flex items-center gap-1.5"
              >
                <XTwitterIcon size={14} />
                <span>Twitter / X</span>
              </button>
              <button
                onClick={handleShareLinkedIn}
                className="px-4 py-2 rounded-lg bg-white border border-black/10 text-xs font-medium text-[#111827] hover:bg-[#111827] hover:text-white transition-all flex items-center gap-1.5"
              >
                <LinkedinIcon size={14} />
                <span>LinkedIn</span>
              </button>
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 rounded-lg bg-white border border-black/10 text-xs font-medium text-[#111827] hover:bg-[#111827] hover:text-white transition-all flex items-center gap-1.5"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Link2 size={14} />}
                <span>{copied ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Author Bio Box */}
          <div className="p-8 rounded-2xl bg-white border border-black/10 shadow-md flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <img
              src={blog.author.avatar}
              alt={blog.author.name}
              className="w-20 h-20 rounded-full object-cover border-2 border-[#C5A059] shrink-0"
            />
            <div className="space-y-3 text-center sm:text-left flex-1">
              <div>
                <h3 className="font-serif text-xl font-semibold text-[#111827]">{blog.author.name}</h3>
                <p className="text-xs text-[#C5A059] uppercase tracking-wider font-mono font-medium">{blog.author.title}</p>
              </div>
              <p className="text-sm text-[#6B7280] font-light leading-relaxed">
                {blog.author.bio}
              </p>
              <button
                onClick={() => {
                  if (onContactAuthor) {
                    onContactAuthor(blog.author);
                  } else if (showToast) {
                    showToast(`Inquiry initiated for ${blog.author.name}.`, 'info');
                  }
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#111827] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#C5A059] transition-all shadow-sm"
              >
                <Mail size={14} />
                <span>Contact Author</span>
              </button>
            </div>
          </div>

        </div>

        {/* Related Articles Grid (Bottom: 3 Columns) */}
        <div className="mt-24 pt-16 border-t border-black/[0.08] space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold tracking-luxury uppercase text-[#C5A059] mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
                <span>FURTHER PERSPECTIVES</span>
              </div>
              <h2 className="font-serif text-3xl font-medium text-[#111827]">
                Recommended Articles
              </h2>
            </div>
            <button
              onClick={() => onNavigate('/blog')}
              className="text-xs uppercase font-semibold tracking-wider text-[#111827] hover:text-[#C5A059] transition-colors flex items-center gap-1 font-mono"
            >
              <span>View All Journal Entries</span>
              <span>›</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {relatedArticles.map((relBlog) => (
              <BlogCard
                key={relBlog.id}
                blog={relBlog}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>

      </div>
    </article>
  );
}
