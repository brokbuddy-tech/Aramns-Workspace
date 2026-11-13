export const normalizeArea = value => String(value || '').trim().replace(/\s+/gu, ' ').toLowerCase();
export const listingAreaId = property => property.areaId || JSON.stringify([normalizeArea(property.city), normalizeArea(property.neighborhood)]);

// Called with the complete filtered inventory, before card pagination. Each link
// preserves the results route/category and every non-location search criterion.
export function popularAreaLinks(properties, {path='/properties', search='', limit=6}={}) {
  const groups = new Map();
  for (const property of properties) {
    if (property.status !== 'ACTIVE' || !normalizeArea(property.neighborhood)) continue;
    const id = listingAreaId(property);
    const name = property.neighborhood.trim().replace(/\s+/gu, ' ');
    const area = groups.get(id) || {id, name, listingCount:0, viewCount:0};
    if (name.localeCompare(area.name, 'en') < 0) area.name = name;
    area.listingCount++;
    if (Number.isSafeInteger(property.viewCount) && property.viewCount >= 0) area.viewCount += property.viewCount;
    groups.set(id,area);
  }
  return [...groups.values()].sort((a,b)=>b.viewCount-a.viewCount || b.listingCount-a.listingCount || a.name.localeCompare(b.name,'en') || a.id.localeCompare(b.id)).slice(0,Math.max(0,Math.floor(limit))).map(area=>{
    const params = new URLSearchParams(search);
    params.set('location',area.name); params.set('areaId',area.id); params.set('sort','most-viewed'); params.delete('page');
    return {...area,href:`${path}?${params}`};
  });
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
