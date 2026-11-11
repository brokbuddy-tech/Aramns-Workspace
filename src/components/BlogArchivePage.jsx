import React, { useState, useMemo } from 'react';
import { BLOGS, BLOG_CATEGORIES } from '../data/blogs';
import BlogCard from './BlogCard';
import { Search, ChevronRight, ChevronLeft, ArrowLeft, X } from 'lucide-react';

export default function BlogArchivePage({ onNavigate }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Filtered blogs
  const filteredBlogs = useMemo(() => {
    return BLOGS.filter((blog) => {
      const matchesCategory =
        selectedCategory === 'All' || blog.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        blog.title.toLowerCase().includes(q) ||
        blog.excerpt.toLowerCase().includes(q) ||
        blog.author.name.toLowerCase().includes(q) ||
        blog.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredBlogs.length / itemsPerPage) || 1;
  const paginatedBlogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBlogs.slice(start, start + itemsPerPage);
  }, [filteredBlogs, currentPage, itemsPerPage]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="w-full bg-[#FAF7F2] min-h-screen text-[#111827] pt-28 pb-24">
      <div className="w-full px-6 sm:px-12 lg:px-16 2xl:px-20 mx-auto">
        
        {/* Page Header */}
        <div className="max-w-3xl space-y-4 mb-12">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-luxury uppercase text-[#C5A059]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
            <span>Novalux Curated Journal</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium text-[#111827] tracking-tight">
            Articles, Guides & Market Perspectives
          </h1>
          <p className="text-[#6B7280] text-base sm:text-lg font-light leading-relaxed">
            In-depth architectural analysis, private wealth fiduciaries, off-market transaction profiles, and master-planned lifestyle curation.
          </p>
        </div>

        {/* Filter & Search Bar Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-black/[0.08] mb-12">
          
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {BLOG_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`text-[13px] px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-[#111827] text-white shadow-sm'
                      : 'bg-white text-[#6B7280] hover:text-[#111827] hover:bg-[#F2F2EF] border border-black/5'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Search Bar Input */}
          <div className="relative w-full lg:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search articles or authors..."
              className="w-full pl-10 pr-9 py-2.5 rounded-full bg-white border border-black/10 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C5A059] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111827]"
              >
                <X size={14} />
              </button>
            )}
          </div>

        </div>

        {/* Active Results Counter */}
        <div className="flex items-center justify-between text-xs text-[#6B7280] font-mono uppercase tracking-wider mb-8">
          <span>
            Showing {filteredBlogs.length} {filteredBlogs.length === 1 ? 'article' : 'articles'}
            {selectedCategory !== 'All' && ` in "${selectedCategory}"`}
          </span>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="text-[#C5A059] hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* 3-Column Articles Grid */}
        {paginatedBlogs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
            {paginatedBlogs.map((blog) => (
              <BlogCard
                key={blog.id}
                blog={blog}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center space-y-4 bg-white/60 rounded-2xl border border-black/5">
            <p className="text-lg text-[#111827] font-medium font-serif">No articles match your search criteria.</p>
            <p className="text-sm text-[#6B7280]">Try searching for different keywords or select a different category pill.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="px-6 py-2.5 rounded-full bg-[#111827] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#C5A059] transition-colors"
            >
              View All Articles
            </button>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-16 pt-8 border-t border-black/[0.08] flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-4 py-2 rounded-lg border border-black/10 text-xs font-medium text-[#111827] hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>

            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNum = i + 1;
              const isCurrent = pageNum === currentPage;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-9 h-9 rounded-lg text-xs font-medium transition-all ${
                    isCurrent
                      ? 'bg-[#111827] text-white'
                      : 'border border-black/10 hover:bg-white text-[#111827]'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-4 py-2 rounded-lg border border-black/10 text-xs font-medium text-[#111827] hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
