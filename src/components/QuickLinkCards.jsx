import {MapPin} from 'lucide-react';
import {trackQuickLinkClick} from '../lib/property-popularity.mjs';

export default function QuickLinkCards({areas}) {
  if (!areas.length) return null;
  return (
    <nav aria-label="Popular areas" className="popular-area-links flex flex-wrap items-center gap-x-3 gap-y-2">
      <h2 className="flex items-center gap-1.5 text-xs font-medium text-silver-muted">
        <MapPin size={14} className="text-bronze" aria-hidden="true" />
        Explore areas
      </h2>
      <div className="popular-area-scroll flex min-w-0 flex-wrap gap-1.5">
        {areas.map(area => <a key={area.id} href={area.href}
          title={[area.name, area.city].filter(Boolean).join(', ')}
          onClick={() => {if (area.trackable !== false) trackQuickLinkClick(area.id);}}
          onAuxClick={event => {if (event.button === 1 && area.trackable !== false) trackQuickLinkClick(area.id);}}
          className="group inline-flex max-w-full items-center gap-2 rounded-md border border-surface-border bg-cream-warm/60 px-2.5 py-1.5 text-xs text-charcoal transition-colors hover:border-bronze/40 hover:bg-cream-warm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze">
          <span className="min-w-0 break-words font-medium">
            {area.name}
            {areas.some(other => other.id !== area.id && normalizeCity(other.name) === normalizeCity(area.name)) && area.city && <span className="font-normal text-silver-muted">, {area.city}</span>}
          </span>
          <span className="shrink-0 text-[10px] tabular-nums text-silver-muted">
            {area.listingCount}<span className="sr-only"> {area.listingCount === 1 ? 'listing' : 'listings'}</span>
          </span>
        </a>)}
      </div>
    </nav>
  );
}
const normalizeCity = value => value.trim().toLowerCase();
