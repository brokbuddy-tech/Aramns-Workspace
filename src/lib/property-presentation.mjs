import {listingNeighborhood} from './property-popularity.mjs';
import {hasDisplayValue} from './display-data.mjs';
const clean=value=>typeof value==='string' && hasDisplayValue(value) ? value.trim().replace(/\s+/gu,' '):'';
const withoutCode=value=>clean(value).replace(/(?:^|\s)[23456789CFGHJMPQRVWX]{2,8}\+[23456789CFGHJMPQRVWX]{2,4}(?=\s|$)/giu,'').replace(/^[\s–—-]+|[\s–—-]+$/gu,'');
function readableLocationParts(values,country) {
  const parts=values.flatMap(value=>clean(value).split(/\s+[-–—]\s+|,/u)).map(withoutCode).filter(Boolean);
  const countries=new Set(['united arab emirates','uae','u.a.e.','ae','are',clean(country).toLocaleLowerCase()]);
  const withoutCountry=parts.filter(value=>!countries.has(value.toLocaleLowerCase()));
  const meaningful=withoutCountry.length ? withoutCountry:parts;
  return [...new Map(meaningful.map(value=>[value.toLocaleLowerCase(),value])).values()].join(', ');
}
export function displayPropertyLocation(property={}) {
  const city=clean(property.city);
  const area=withoutCode(listingNeighborhood(property));
  const parts=[area,city].filter(Boolean);
  const readable=readableLocationParts(parts.length ? parts:[property.location || property.cityState],property.country);
  return readable || clean(property.country);
}
export function propertyPageUrl(property,origin) {
  return new URL(`/property/${encodeURIComponent(property.id)}`,origin).href;
}
export function propertyShareLinks(property,origin) {
  const url=propertyPageUrl(property,origin),title=clean(property.title);
  return {
    url,
    whatsapp:`https://wa.me/?${new URLSearchParams({text:[title,url].filter(Boolean).join('\n')})}`,
    facebook:`https://www.facebook.com/sharer/sharer.php?${new URLSearchParams({u:url})}`,
    x:`https://x.com/intent/tweet?${new URLSearchParams({url,text:title})}`,
    linkedin:`https://www.linkedin.com/sharing/share-offsite/?${new URLSearchParams({url})}`,
  };
}
export function whatsappContactUrl(value,message) {
  let number=clean(value);
  if(!number) return null;
  if(/^https?:\/\//i.test(number)) {
    try {
      const url=new URL(number);
      if(!['wa.me','api.whatsapp.com','web.whatsapp.com'].includes(url.hostname) || url.username || url.password) return null;
      number=url.hostname==='wa.me' ? url.pathname.slice(1):url.searchParams.get('phone') || '';
    } catch {return null;}
  }
  number=number.replace(/[\s()+.-]/gu,'');
  return /^\d{7,15}$/.test(number) ? `https://wa.me/${number}?${new URLSearchParams({text:message})}`:null;
}
