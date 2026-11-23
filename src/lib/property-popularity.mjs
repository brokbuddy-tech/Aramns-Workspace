export const normalizeArea = value => String(value || '').trim().replace(/\s+/gu, ' ').toLowerCase();
export const listingAreaId = property => String(property.areaId || '').trim() || JSON.stringify([normalizeArea(property.city), normalizeArea(property.neighborhood)]);

export function listingNeighborhood(property) {
  const city = normalizeArea(property.city);
  const community = String(property.neighborhood || '').trim();
  if (normalizeArea(community) && normalizeArea(community) !== city) return community;
  // Legacy feeds sometimes repeat the city as the community. Use a named
  // district from a structured address, never a street or a plus code.
  const parts = String(property.location || '').split(/\s+[-–—]\s+|,/u)
    .map(part => part.trim().replace(/^[A-Z0-9]{2,8}\+[A-Z0-9]{2,4}\s*/u, ''));
  const cityIndex = parts.findIndex(part => normalizeArea(part) === city);
  if (!city || cityIndex < 1) return '';
  return parts.slice(0, cityIndex).reverse().find(part => part
    && !/\b(street|road|avenue|highway|st|rd)\b|\+/iu.test(part)
    && !/^\d+(?:\s|$)/u.test(part)) || '';
}

// Address-derived districts have no backend analytics identity yet. Keep their
// filter keys separate from the upstream city-level identity and click totals.
export const quickLinkAreaId = property => normalizeArea(listingNeighborhood(property)) === normalizeArea(property.neighborhood)
  ? listingAreaId(property)
  : `address:${JSON.stringify([normalizeArea(property.city), normalizeArea(listingNeighborhood(property))])}`;

// Called with the complete filtered inventory, before card pagination. Each link
// preserves the results route/category and every non-location search criterion.
export function popularAreaLinks(properties, {path='/properties', search='', limit=6, clicks=[]}={}) {
  const groups = new Map();
  const clickCounts = new Map(clicks.filter(area => typeof area.id === 'string' && Number.isSafeInteger(area.clickCount) && area.clickCount >= 0).map(area => [area.id,area.clickCount]));
  for (const property of properties) {
    const country = normalizeArea(property.country);
    // Existing UAE feeds may omit country. Honour explicit country data when supplied.
    if (property.status !== 'ACTIVE' || (country && !['ae','are','uae','united arab emirates'].includes(country))) continue;
    // Quick links drill into communities; city-only inventory stays in results.
    const label = listingNeighborhood(property);
    if (!normalizeArea(label) || normalizeArea(label) === normalizeArea(property.city)) continue;
    const id = quickLinkAreaId(property);
    const trackable = !id.startsWith('address:');
    const name = label.trim().replace(/\s+/gu, ' ');
    const area = groups.get(id) || {id, name, city:String(property.city || '').trim(), listingCount:0, clickCount:trackable ? clickCounts.get(id) || 0 : 0, trackable};
    if (name.localeCompare(area.name, 'en') < 0) area.name = name;
    area.listingCount++;
    groups.set(id,area);
  }
  return [...groups.values()].sort((a,b)=>b.clickCount-a.clickCount || b.listingCount-a.listingCount || a.name.localeCompare(b.name,'en') || a.id.localeCompare(b.id)).slice(0,Math.max(0,Math.floor(limit))).map(area=>{
    const params = new URLSearchParams(search);
    params.set('location',area.name); params.set('areaId',area.id); params.delete('page');
    return {...area,href:`${path}?${params}`};
  });
}

// Send the actual card activation, independently of property detail views.
// keepalive allows normal link navigation; analytics failure never blocks it.
export function trackQuickLinkClick(areaId, {doc=document, send=fetch, eventId=()=>globalThis.crypto.randomUUID()}={}) {
  if (!areaId || doc.visibilityState !== 'visible' || new URLSearchParams(doc.location?.search || '').has('preview')) return;
  try {
    return Promise.resolve(send('/api/quick-link-clicks', {
      method:'POST', headers:{'content-type':'application/json'}, credentials:'same-origin',
      body:JSON.stringify({areaId,eventId:eventId()}), keepalive:true, signal:AbortSignal.timeout(10000),
    })).catch(()=>{});
  } catch { /* Analytics never interrupts browsing. */ }
}

// Register only from a mounted detail page. Hidden time never qualifies, and
// unmounting cancels the timer. Tracking is deliberately independent of data/UI.
export function trackVisibleProperty(id, {doc=document, send=fetch, schedule=setTimeout, cancel=clearTimeout, locks=globalThis.navigator?.locks}={}) {
  if (!id || new URLSearchParams(doc.location?.search || '').has('preview')) return () => {};
  let timer, sent=false, disposed=false;
  const update = () => {
    if (timer !== undefined) cancel(timer);
    timer=undefined;
    if (disposed || sent || doc.visibilityState !== 'visible') return;
    timer=schedule(()=>{
      if (disposed || doc.visibilityState !== 'visible') return;
      sent=true;
      if (!locks) return; // Web Locks requires the HTTPS used by public sites.
      // A first-ever visitor may open several tabs at once. Serialize cookie
      // provisioning across those tabs, then send using that same cookie. Feed
      // responses never replace it, including delayed in-flight responses.
      try { Promise.resolve(locks.request('bb-public-visitor', async()=>{
        const initialized=await send('/api/visitor',{method:'POST',headers:{'content-type':'application/json'},credentials:'same-origin',body:'{}',signal:AbortSignal.timeout(10000)});
        if (!initialized.ok || disposed || doc.visibilityState !== 'visible') return;
        return send(`/api/property-views/${encodeURIComponent(id)}`,{
          method:'POST', headers:{'content-type':'application/json'}, credentials:'same-origin',
          body:JSON.stringify({visibleDurationMs:2000}), keepalive:true,signal:AbortSignal.timeout(10000),
        });
      })).catch(()=>{}); } catch { /* Analytics never interrupts browsing. */ }
    },2000);
  };
  doc.addEventListener('visibilitychange',update); update();
  return ()=>{disposed=true;if(timer!==undefined) cancel(timer);doc.removeEventListener('visibilitychange',update);};
}
