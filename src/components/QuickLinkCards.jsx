import {MapPin, ArrowUpRight} from 'lucide-react';
import {trackQuickLinkClick} from '../lib/property-popularity.mjs';

export default function QuickLinkCards({areas}) {
  return (
    <nav aria-label="Popular areas" className="rounded-xl border border-stone-200 bg-white/70 p-4 sm:p-5">
      <h2 className="text-base font-semibold text-stone-900">Explore UAE locations</h2>
      <p className="mt-1 mb-4 text-xs text-stone-500">Quick links to available properties by location.</p>
      {areas.length ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {areas.map(area => <a key={area.id} href={area.href}
          onClick={() => trackQuickLinkClick(area.id)}
          onAuxClick={event => {if (event.button === 1) trackQuickLinkClick(area.id);}}
          className="group flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-4 text-stone-700 hover:border-amber-400 hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500 transition-all">
          <MapPin size={19} className="shrink-0 text-bronze" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-sm text-stone-900">{area.name}</span>
            {area.city && normalizeCity(area.city) !== normalizeCity(area.name) && <span className="block text-xs text-stone-500 mt-0.5">{area.city}</span>}
            <span className="block text-xs text-stone-500 mt-1.5">{area.listingCount} {area.listingCount === 1 ? 'listing' : 'listings'}</span>
          </span>
          <ArrowUpRight size={17} className="shrink-0 group-hover:text-bronze" aria-hidden="true" />
        </a>)}
      </div> : <p className="text-xs text-stone-500">No areas match the current search.</p>}
    </nav>
  );
}
const normalizeCity = value => value.trim().toLowerCase();
