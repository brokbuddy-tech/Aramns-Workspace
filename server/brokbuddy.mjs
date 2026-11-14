// This module is imported by the Node server only. Never import it from src/.
export class PublicError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const unavailable = () => new PublicError(503, 'This broker website is currently unavailable. Please try again later.');
const invalid = () => { throw unavailable(); };
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const string = value => typeof value === 'string' ? value : '';
const required = value => typeof value === 'string' && value.trim() ? value : invalid();
const optionalNumber = value => value == null ? null : typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : invalid();
const strings = value => value == null ? [] : Array.isArray(value) && value.every(x => typeof x === 'string') ? value : invalid();
export function getConfig(env = process.env) {
  const base = env.BROKBUDDY_API_BASE_URL;
  const slug = env.BROKBUDDY_BROKER_PROFILE_SLUG;
  const code = env.BROKBUDDY_BROKER_CODE;
  try {
    const url = new URL(base);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || !/^[a-z0-9-]{3,120}$/.test(slug || '') || !/^[a-f0-9]{32}$/.test(code || '')) throw unavailable();
    if (url.protocol !== 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw unavailable();
    return { base: url.origin, slug, code };
  } catch { throw unavailable(); }
}
export function publicAsset(value, base) {
  if (!value) return null;
  if (typeof value !== 'string') return invalid();
  try {
    const url = new URL(value, base);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return invalid();
    return url.href;
  } catch { return invalid(); }
}
const link = value => value ? publicAsset(value, 'https://invalid.example') : undefined;
export function mapAgent(agent, slug, base) {
  if (!record(agent) || agent.slug !== slug) return invalid();
  return {
    id: required(agent.id), slug, name: required(agent.name), title: string(agent.title),
    bio: string(agent.bio), avatar: publicAsset(agent.avatarUrl || agent.avatar, base),
    phone: string(agent.phone), email: string(agent.email), whatsapp: string(agent.whatsapp),
    licenseId: string(agent.brn || agent.licenseNumber) || '—',
    languages: strings(agent.languages), specialization: strings(agent.specializations).join(', '),
    experience: agent.yearsExperience == null ? '—' : `${optionalNumber(agent.yearsExperience)} years`,
    careerVolume: '—', region: '', agency: '—', testimonials: [], listingIds: [],
    socialLinks: {facebook:link(agent.facebook), instagram:link(agent.instagram), linkedin:link(agent.linkedin), twitter:link(agent.twitter)},
    website: link(agent.website),
  };
}
export function mapListing(value, agent, base) {
  if (!record(value) || !record(value.agent) || !record(value.broker) || value.agent.id !== agent.id || value.broker.id !== agent.id || value.agent.slug !== agent.slug || value.broker.brokerProfile?.slug !== agent.slug) return invalid();
  if (!['SALE','RENT'].includes(value.transactionType) || !['ACTIVE','SOLD','RENTED'].includes(value.status)) return invalid();
  const price = optionalNumber(value.price);
  if (price === null || !/^[A-Z]{3}$/.test(value.currency || '') || !Array.isArray(value.images)) return invalid();
  const seen = new Set();
  const images = value.images.filter(image => {
    if (!record(image)) return invalid();
    if (['TITLE_DEED','FLOORPLAN','THREESIXTY'].includes(image.category) || image.format === 'application/pdf') return false;
    const key = image.id || image.url;
    if (!key || seen.has(key)) return false;
    seen.add(key); return true;
  }).sort((a,b)=>Number(Boolean(b.isHero))-Number(Boolean(a.isHero)) || (a.order ?? 0)-(b.order ?? 0)).map(image=>publicAsset(image.url, base)).filter(Boolean);
  const uniqueImages = [...new Set(images)];
  const location = [value.community, value.city].filter(Boolean).join(', ');
  const type = string(value.propertyType || value.type);
  const handover = string(value.handoverDate) || string(value.handover);
  const handoverYear = Number.isInteger(value.handoverYear) ? value.handoverYear : Number(handover.match(/\b(20\d{2}|21\d{2})\b/)?.[1]);
  const rentFrequency = string(value.rentFrequency).toUpperCase();
  return {
    id: /^[A-Za-z0-9_-]{1,120}$/.test(value.id || '') ? value.id : invalid(), title: required(value.title), description: string(value.description), headline: '',
    price, currency: value.currency, priceFormatted: new Intl.NumberFormat('en-US', {style:'currency',currency:value.currency,maximumFractionDigits:2}).format(price),
    location: string(value.mapAddress) || location, cityState: location, neighborhood: string(value.community), city:string(value.city), areaId:string(value.areaId), country:string(value.country),
    marketCategory: value.transactionType === 'RENT' ? 'rent' : 'buy', transactionType:value.transactionType,
    listingType: value.transactionType === 'RENT' ? 'FOR RENT' : 'FOR SALE',
    status: value.status, readiness: string(value.readiness), category:type, propertyType:type, propertyClass:string(value.category),
    beds: optionalNumber(value.bedrooms) ?? '—', baths: optionalNumber(value.bathrooms) ?? '—', sqft: optionalNumber(value.builtUpArea) ?? '—',
    yearBuilt:null, heatingCooling:null, garage:null, hoaFees:null, lotSize:null,
    images:uniqueImages, image:uniqueImages[0], amenities:strings(value.amenities), agentId:agent.id,
    featured: value.isFeatured === true || value.featured === true, createdAt: string(value.createdAt),
    viewCount: Number.isSafeInteger(value.viewCount) && value.viewCount >= 0 ? value.viewCount : null,
    handover, handoverYear: handoverYear >= 2000 && handoverYear < 2200 ? handoverYear : null,
    paymentPlan:string(value.paymentPlan), rentFrequency:['YEARLY','MONTHLY','WEEKLY','DAILY'].includes(rentFrequency) ? rentFrequency : null,
    coordinates: typeof value.latitude === 'number' && Math.abs(value.latitude)<=90 && typeof value.longitude==='number' && Math.abs(value.longitude)<=180 ? {lat:value.latitude,lng:value.longitude} : null,
    permitNumber:string(value.trakheesiPermitNumber), floorPlanUrl:publicAsset(value.floorPlanUrl,base),
  };
}
const INVENTORY_PAGE_SIZE = 100; // BrokBuddy's supported maximum; independent of the UI's six-card pages.
function mapQuickLinkClicks(value) {
  // Optional analytics must never take the broker's inventory offline.
  if (!Array.isArray(value)) return [];
  const ids = new Set();
  const valid = value.every(area => {
    if (!record(area) || typeof area.id !== 'string' || !area.id.trim() || area.id.length > 512 || ids.has(area.id) || !Number.isSafeInteger(area.clickCount) || area.clickCount < 0) return false;
    ids.add(area.id); return true;
  });
  return valid ? value.map(({id,clickCount}) => ({id,clickCount})) : [];
}
export function createBrokerClient({env=process.env, fetchImpl=fetch, timeoutMs=10000}={}) {
  async function request(path, {method='GET',body,key,tracking=false,userAgent='',preview=false}={}) {
    const config = getConfig(env);
    const endpoint = method === 'POST' && !tracking ? `/api/public/broker/${encodeURIComponent(config.slug)}/inquiry` : `/api/public/broker-template/${encodeURIComponent(config.slug)}${path}`;
    try {
      const response=await fetchImpl(new URL(endpoint, config.base), {
        method, cache:'no-store', redirect:'error', signal:AbortSignal.timeout(timeoutMs),
        headers:{accept:'application/json', ...(method==='GET' || tracking ? {'X-BrokBuddy-Broker-Code':config.code,...(tracking ? {'content-type':'application/json','user-agent':userAgent,'x-brokbuddy-preview':String(preview)}:{})} : {'content-type':'application/json','idempotency-key':key})},
        ...(body ? {body:JSON.stringify(body)} : {}),
      });
      if (response.status===429) throw new PublicError(429,'Too many requests. Please wait a moment before trying again.');
      if (!response.ok) {
        if (method==='GET' && path.startsWith('/listings/') && response.status===404) throw new PublicError(404,'Property not found.');
        throw unavailable();
      }
      if (tracking && response.status===204) return {ok:true};
      const raw=await response.text();
      if (raw.length>8_000_000 || raw.includes(config.code)) throw unavailable();
      const result=JSON.parse(raw);
      if (!record(result)) throw unavailable();
      return result;
    } catch(error) { if (error instanceof PublicError) throw error; throw unavailable(); }
  }
  async function profile() {
    const config=getConfig(env), raw=await request('');
    const agent=mapAgent(raw.agent,config.slug,config.base);
    for (const key of ['activeListings','soldListings','rentedListings']) {
      if (!Array.isArray(raw[key])) throw unavailable();
      raw[key].forEach(listing=>mapListing(listing,agent,config.base));
    }
    if (!record(raw.stats) || ['activeListings','soldListings','rentedListings'].some(k=>!Number.isInteger(raw.stats[k]) || raw.stats[k]<0)) throw unavailable();
    return {agent,quickLinkClicks:mapQuickLinkClicks(raw.quickLinkClicks)};
  }
  async function detail(id, agent) {
    if (!/^[A-Za-z0-9_-]{1,120}$/.test(id)) throw new PublicError(404,'Property not found.');
    const listing=mapListing(await request(`/listings/${encodeURIComponent(id)}`),agent,getConfig(env).base);
    if(listing.id!==id) throw unavailable();
    return listing;
  }
  async function site(id) {
    const started=Date.now();
    // Both endpoints authenticate the same broker code. Do independent reads
    // together, then validate ownership before exposing any listing to the UI.
    const [{agent,quickLinkClicks},firstPage]=await Promise.all([
      profile(), request(`/listings?page=1&limit=${INVENTORY_PAGE_SIZE}`),
    ]);
    const properties=[]; const ids=new Set(); let total=null, totalPages=null;
    // Read all pages; UI filters/sorts operate on the complete active inventory.
    // A changing or truncated snapshot is an error, never a successful empty feed.
    for(let page=1; ; page++) {
      if(page>1000 || Date.now()-started>30000) throw unavailable();
      const raw=page===1 ? firstPage : await request(`/listings?page=${page}&limit=${INVENTORY_PAGE_SIZE}`);
      if(!Array.isArray(raw.listings) || raw.page!==page || !Number.isInteger(raw.total) || raw.total<0 || !Number.isInteger(raw.totalPages) || raw.totalPages!==Math.max(1,Math.ceil(raw.total/INVENTORY_PAGE_SIZE))) throw unavailable();
      if(total===null) {total=raw.total; totalPages=raw.totalPages;}
      if(raw.total!==total || raw.totalPages!==totalPages || raw.listings.length!==Math.min(INVENTORY_PAGE_SIZE,total-(page-1)*INVENTORY_PAGE_SIZE)) throw unavailable();
      for(const value of raw.listings) {
        const listing=mapListing(value,agent,getConfig(env).base);
        if(listing.status!=='ACTIVE' || ids.has(listing.id)) throw unavailable();
        ids.add(listing.id); properties.push(listing);
      }
      if(page===totalPages) break;
    }
    agent.listingIds=properties.map(x=>x.id);
    agent.region=[...new Set(properties.map(x=>x.neighborhood).filter(Boolean))].join(', ');
    let selectedProperty=null, detailNotFound=false;
    if(id) { try { selectedProperty=await detail(id,agent); } catch(error) { if(error.status!==404) throw error; await profile(); detailNotFound=true; } }
    return {agent,properties,selectedProperty,detailNotFound,quickLinkClicks};
  }
  async function inquire(body, key) {
    const {agent}=await profile(); // Verify code, publication and broker before every submission.
    if(body.listingId) {
      const listing=await detail(body.listingId,agent);
      if(listing.status!=='ACTIVE') throw new PublicError(400,'This property is unavailable for enquiries.');
    }
    const result=await request('',{method:'POST',body,key});
    if(!record(result.inquiry) || typeof result.inquiry.id!=='string' || !result.inquiry.id.trim()) throw new PublicError(502,'Delivery could not be confirmed. Please retry your enquiry.');
    return {ok:true};
  }
  async function recordView(id, body, {userAgent='',preview=false}={}) {
    if (!/^[A-Za-z0-9_-]{1,120}$/.test(id)) throw new PublicError(404,'Property not found.');
    return request(`/listings/${encodeURIComponent(id)}/views`, {method:'POST',body,tracking:true,userAgent,preview});
  }
  async function recordQuickLinkClick(body, {userAgent='',preview=false}={}) {
    return request('/quick-link-clicks', {method:'POST',body,tracking:true,userAgent,preview});
  }
  return {site,inquire,recordView,recordQuickLinkClick};
}
