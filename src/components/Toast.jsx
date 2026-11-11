import React from 'react';
import { CheckCircle2, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose }) {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up flex items-center gap-3 bg-[#1A1C20]/95 backdrop-blur-xl border border-bronze/40 text-white px-5 py-3.5 rounded-full shadow-2xl bronze-glow max-w-md">
      <div className="w-7 h-7 rounded-full bg-bronze/15 flex items-center justify-center text-bronze shrink-0">
        {type === 'success' ? <CheckCircle2 size={16} /> : <Info size={16} />}
      </div>
      <p className="text-sm font-light text-slate-200 pr-2">{message}</p>
      <button
        onClick={onClose}
        className="text-silver hover:text-white transition-colors p-1"
        aria-label="Dismiss message"
      >
        <X size={14} />
      </button>
    </div>
  );
}
