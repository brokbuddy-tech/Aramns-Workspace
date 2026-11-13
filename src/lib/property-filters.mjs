export const emptyAdvancedFilters = () => ({
  sector: 'All', readiness: 'All', currency: '', minPrice: '', maxPrice: '',
  minArea: '', maxArea: '', baths: 'All', amenities: [], floorPlan: false,
  rentFrequency: 'All', handoverBy: '', paymentPlan: 'All',
});

const numericKeys = ['minPrice', 'maxPrice', 'minArea', 'maxArea'];
const basicKeys = ['q', 'location', 'areaId', 'type', 'price', 'beds', 'amenity', 'sort', 'description'];
const advancedKeys = Object.keys(emptyAdvancedFilters());
const finiteNumber = value => typeof value === 'number' && Number.isFinite(value);

export function propertySector(property) {
  const explicit = (property.propertyClass || '').trim().toLowerCase();
  if (['residential', 'commercial'].includes(explicit)) return explicit;
  const type = `${property.propertyType || ''} ${property.category || ''}`.toLowerCase();
  if (/commercial|office|shop|retail|warehouse|industrial|labou?r camp|showroom|factory/.test(type)) return 'commercial';
  if (/residential|apartment|villa|penthouse|townhouse|studio|duplex|bungalow/.test(type)) return 'residential';
  return '';
}

export function rangeError(filters) {
  for (const [min, max, label] of [['minPrice', 'maxPrice', 'price'], ['minArea', 'maxArea', 'area']]) {
    for (const key of [min, max]) {
      if (filters[key] !== '' && (!Number.isFinite(Number(filters[key])) || Number(filters[key]) < 0)) return `Enter a valid ${label} of zero or more.`;
    }
    if (filters[min] !== '' && filters[max] !== '' && Number(filters[min]) > Number(filters[max])) return `Maximum ${label} must be at least the minimum ${label}.`;
  }
  return '';
}

export function readListingSearch(search) {
  const params = new URLSearchParams(search);
  const basic = Object.fromEntries(basicKeys.map(key => [key, (params.get(key) || '').slice(0, 500)]));
  const advanced = emptyAdvancedFilters();
  for (const key of numericKeys) {
    const value = params.get(key);
    if (value !== null && value.trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0) advanced[key] = String(Number(value));
  }
  for (const key of ['sector', 'readiness', 'baths', 'currency', 'rentFrequency', 'handoverBy', 'paymentPlan']) advanced[key] = params.get(key) || advanced[key];
  if (!['All', 'residential', 'commercial'].includes(advanced.sector)) advanced.sector = 'All';
  if (!['All', 'READY', 'OFFPLAN'].includes(advanced.readiness)) advanced.readiness = 'All';
  if (!['All', '1', '2', '3', '4', '5', '6', '6+'].includes(advanced.baths)) advanced.baths = 'All';
  if (!['All', 'YEARLY', 'MONTHLY', 'WEEKLY', 'DAILY'].includes(advanced.rentFrequency)) advanced.rentFrequency = 'All';
  if (!/^20\d{2}$|^21\d{2}$/.test(advanced.handoverBy)) advanced.handoverBy = '';
  advanced.paymentPlan = advanced.paymentPlan.slice(0,200);
  if (!/^[A-Z]{3}$/.test(advanced.currency)) advanced.currency = '';
  advanced.amenities = [...new Set(params.getAll('amenities').filter(Boolean))].slice(0, 100);
  advanced.floorPlan = params.get('floorPlan') === '1';
  if (!['', 'All', 'studio', '1', '2', '3', '4', '5', '6', '7', '8+'].includes(basic.beds)) basic.beds = '';
  if (!['', 'All', 'under-20k', '20k-35k', 'above-35k', 'under-15m', '15m-25m', 'above-25m'].includes(basic.price)) basic.price = '';
  if (basic.sort === 'newest') basic.sort = 'latest';
  if (!['', 'featured', 'price-asc', 'price-desc', 'sqft-desc', 'beds-desc', 'latest', 'most-viewed'].includes(basic.sort)) basic.sort = '';
  return {basic, advanced};
}

export function writeListingSearch(search, basic, advanced) {
  const params = new URLSearchParams(search);
  params.delete('photos');
  for (const key of [...basicKeys, ...advancedKeys]) params.delete(key);
  for (const [key, value] of Object.entries(basic)) {
    if (basicKeys.includes(key) && value && value !== 'All' && !(key === 'sort' && value === 'featured')) params.set(key, value);
  }
  for (const [key, value] of Object.entries(advanced)) {
    if (!advancedKeys.includes(key)) continue;
    if (key === 'amenities') value.forEach(amenity => params.append(key, amenity));
    else if (value === true) params.set(key, '1');
    else if (value !== false && value !== '' && value !== 'All') params.set(key, value);
  }
  return params.toString();
}

export function matchesRoomCount(count, choice) {
  if (!choice || choice === 'All') return true;
  if (!finiteNumber(count)) return false;
  if (choice === 'studio') return count === 0;
  return choice.endsWith('+') ? count >= Number(choice.slice(0,-1)) : count === Number(choice);
}

export function matchesAdvancedFilters(property, filters, currencies = []) {
  if (filters.sector !== 'All' && propertySector(property) !== filters.sector) return false;
  if (filters.readiness !== 'All' && property.readiness !== filters.readiness) return false;
  if (filters.currency && property.currency !== filters.currency) return false;
  const canComparePrice = Boolean(filters.currency) || currencies.length === 1;
  for (const [field, min, max, enabled] of [
    ['price', 'minPrice', 'maxPrice', canComparePrice], ['sqft', 'minArea', 'maxArea', true],
  ]) {
    if (!enabled || (filters[min] === '' && filters[max] === '')) continue;
    if (!finiteNumber(property[field])) return false;
    if (filters[min] !== '' && property[field] < Number(filters[min])) return false;
    if (filters[max] !== '' && property[field] > Number(filters[max])) return false;
  }
  if (!matchesRoomCount(property.baths, filters.baths)) return false;
  if (filters.rentFrequency && filters.rentFrequency !== 'All' && property.rentFrequency !== filters.rentFrequency) return false;
  if (filters.handoverBy && (!finiteNumber(property.handoverYear) || property.handoverYear > Number(filters.handoverBy))) return false;
  if (filters.paymentPlan && filters.paymentPlan !== 'All' && property.paymentPlan !== filters.paymentPlan) return false;
  const amenities = new Set((property.amenities || []).map(value => value.trim().toLowerCase()));
  if (!filters.amenities.every(value => amenities.has(value.trim().toLowerCase()))) return false;
  if (filters.floorPlan && !property.floorPlanUrl) return false;
  return true;
}

export function hasListingViews(property) {
  return Number.isSafeInteger(property.viewCount) && property.viewCount >= 0;
}

export function compareListingActivity(a, b, sort) {
  if (sort === 'most-viewed') {
    const views = (hasListingViews(b) ? b.viewCount : -1) - (hasListingViews(a) ? a.viewCount : -1);
    if (views !== 0) return views;
  }
  return (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0) || String(a.id).localeCompare(String(b.id), 'en');
}

export function advancedFilterChips(filters, priceCurrency = '') {
  const chips = [];
  const add = (key, label, clear) => chips.push({key, label, clear});
  if (filters.sector !== 'All') add('sector', filters.sector === 'commercial' ? 'Commercial' : 'Residential', {sector:'All'});
  if (filters.readiness !== 'All') add('readiness', filters.readiness === 'READY' ? 'Ready' : 'Off-plan', {readiness:'All'});
  if (filters.currency) add('currency', filters.currency, {currency:'', minPrice:'', maxPrice:''});
  const number = value => Number(value).toLocaleString('en-US');
  for (const [min, max, suffix] of [['minPrice', 'maxPrice', filters.currency || priceCurrency], ['minArea', 'maxArea', 'sq ft']]) {
    if (filters[min] === '' && filters[max] === '') continue;
    const label = filters[min] === '' ? `Up to ${number(filters[max])}` : filters[max] === '' ? `${number(filters[min])}+` : `${number(filters[min])} – ${number(filters[max])}`;
    add(min, `${label} ${suffix}`.trim(), {[min]:'', [max]:''});
  }
  if (filters.baths !== 'All') add('baths', `${filters.baths} ${filters.baths === '1' ? 'bath' : 'baths'}`, {baths:'All'});
  if (filters.rentFrequency && filters.rentFrequency !== 'All') add('rentFrequency', `${filters.rentFrequency[0]}${filters.rentFrequency.slice(1).toLowerCase()} rent`, {rentFrequency:'All'});
  if (filters.handoverBy) add('handoverBy', `Handover by ${filters.handoverBy}`, {handoverBy:''});
  if (filters.paymentPlan && filters.paymentPlan !== 'All') add('paymentPlan', filters.paymentPlan, {paymentPlan:'All'});
  filters.amenities.forEach(amenity => add(`amenity-${amenity}`, amenity, {amenities:filters.amenities.filter(value => value !== amenity)}));
  if (filters.floorPlan) add('floorPlan', 'With floor plan', {floorPlan:false});
  return chips;
}
