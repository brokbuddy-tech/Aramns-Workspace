import React, { useEffect } from 'react';
import { X, Trash2, ArrowRight, Heart, ExternalLink, Bed, Bath, Maximize2 } from 'lucide-react';

export default function FavoritesDrawer({ 
  isOpen, 
  onClose, 
  favoriteProperties, 
  onRemoveFavorite, 
  onSelectProperty,
  onScheduleAll 
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totals = favoriteProperties.reduce((sum,item)=>{sum[item.currency]=(sum[item.currency] || 0)+item.price;return sum;},{});
  const totalValue = Object.entries(totals).map(([currency,amount])=>new Intl.NumberFormat('en-US',{style:'currency',currency,maximumFractionDigits:0}).format(amount)).join(' · ') || '—';

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-black/60 backdrop-blur-md animate-fade-in" 
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-white border-l border-stone-200 h-full shadow-2xl flex flex-col justify-between z-10 animate-slide-up text-[#1E293B]">
        
        {/* Drawer Header */}
        <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-[#FDFDFD]">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Heart size={14} className="fill-bronze text-bronze" />
              <span className="text-[10px] uppercase tracking-luxury text-bronze font-semibold">
                CURATED PORTFOLIO ARCHIVE
              </span>
            </div>
            <h3 className="font-serif text-xl text-[#0A0A0C] font-medium">
              Saved Estates ({favoriteProperties.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-[#475569] hover:text-[#0A0A0C] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
          {favoriteProperties.length > 0 ? (
            favoriteProperties.map((prop) => (
              <div
                key={prop.id}
                onClick={() => {
                  onSelectProperty(prop);
                  onClose();
                }}
                className="group p-3.5 rounded-xl bg-[#F8F9FA] border border-stone-200 hover:border-bronze/60 hover:shadow-md transition-all cursor-pointer flex gap-3.5 items-center relative overflow-hidden"
              >
                <img
                  src={prop.images[0]}
                  alt={prop.title}
                  className="w-20 h-20 rounded-lg object-cover shrink-0 border border-stone-200"
                />

                <div className="flex-1 min-w-0 space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-bronze font-mono font-semibold">
                    {prop.category}
                  </span>
                  <h4 className="font-serif text-sm font-semibold text-[#0A0A0C] truncate group-hover:text-bronze transition-colors">
                    {prop.title}
                  </h4>
                  <p className="text-[11px] text-[#64748B] truncate">
                    {prop.location}
                  </p>
                  <p className="text-xs font-serif font-bold text-[#0A0A0C]">
                    {prop.priceFormatted}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFavorite(prop);
                  }}
                  className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                  title="Remove from saved portfolio"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          ) : (
            <div className="py-20 text-center space-y-3">
              <Heart size={36} className="text-stone-300 mx-auto stroke-[1.5]" />
              <h4 className="font-serif text-lg text-[#0A0A0C]">Your Saved Archive is Empty</h4>
              <p className="text-xs text-[#64748B] max-w-xs mx-auto font-light leading-relaxed">
                Browse our curated portfolio and click the heart icon to assemble your private selection of landmark residences.
              </p>
            </div>
          )}
        </div>

        {/* Drawer Bottom Bar */}
        {favoriteProperties.length > 0 && (
          <div className="p-6 border-t border-stone-200 bg-[#FDFDFD] space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-xs uppercase tracking-luxury text-[#64748B] font-semibold">
                Portfolio Valuation
              </span>
              <span className="font-serif text-2xl font-bold text-[#0A0A0C] tracking-tight">
                {totalValue}
              </span>
            </div>

            <button
              onClick={() => {
                onClose();
                onScheduleAll();
              }}
              className="w-full py-3.5 rounded-xl bg-[#0A0A0C] hover:bg-[#27272A] text-white font-semibold text-xs tracking-wider uppercase transition-colors shadow-lg flex items-center justify-center gap-2"
            >
              <span>Schedule Portfolio Showing</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
