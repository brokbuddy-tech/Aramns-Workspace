// A viewing area only: never use this fallback to manufacture property pins.
export const AJMAN_VIEWPORT = Object.freeze({
  center:Object.freeze({lat:25.4052,lng:55.5136}), zoom:12, bounds:null,
});

export function validCoordinates(value) {
  return value != null && Number.isFinite(value.lat) && Math.abs(value.lat) <= 90
    && Number.isFinite(value.lng) && Math.abs(value.lng) <= 180;
}

const normalize = value => String(value || '').trim().toLocaleLowerCase();
const slug = value => normalize(value).normalize('NFKD').replace(/\p{M}/gu,'').replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-|-$/g,'');

export function listingCity(property) {
  if (property.city?.trim()) return property.city.trim();
  const cityState = (property.cityState || '').trim();
  return normalize(cityState) !== normalize(property.neighborhood) ? cityState.split(',').at(-1).trim() : '';
}

export function getMapViewport(properties, fallback = AJMAN_VIEWPORT) {
  const coordinates = properties.map(property => property.coordinates).filter(validCoordinates);
  if (!coordinates.length) return fallback;
  const bounds = {
    south:Math.min(...coordinates.map(point => point.lat)),
    north:Math.max(...coordinates.map(point => point.lat)),
    west:Math.min(...coordinates.map(point => point.lng)),
    east:Math.max(...coordinates.map(point => point.lng)),
  };
  const singlePoint = bounds.south === bounds.north && bounds.west === bounds.east;
  return {
    center:{lat:(bounds.south+bounds.north)/2,lng:(bounds.west+bounds.east)/2},
    zoom:singlePoint ? 16 : 12,
    bounds:singlePoint ? null : bounds,
  };
}

export function matchesMapArea(property, area) {
  if (!area || area.id === 'all') return true;
  if (area.kind === 'city') return normalize(listingCity(property)) === normalize(area.value);
  return normalize(property.neighborhood) === normalize(area.value)
    && normalize(listingCity(property)) === normalize(area.city);
}

export function buildMapAreas(properties) {
  const allViewport = getMapViewport(properties);
  const groups = new Map();
  const add = (kind,value,city,property) => {
    const key = `${kind}:${normalize(city)}:${normalize(value)}`;
    if (!groups.has(key)) groups.set(key,{kind,value,city,properties:[]});
    groups.get(key).properties.push(property);
  };
  properties.forEach(property => {
    const city = listingCity(property);
    const community = (property.neighborhood || '').trim();
    if (city) add('city',city,city,property);
    if (community && normalize(community) !== normalize(city)) add('community',community,city,property);
  });
  const entries = [...groups.values()].sort((a,b) => Number(b.kind === 'city')-Number(a.kind === 'city') || a.value.localeCompare(b.value) || a.city.localeCompare(b.city));
  const ids = new Set(['all']);
  const areas = entries.map(group => {
    const duplicateName = entries.some(other => other !== group && normalize(other.value) === normalize(group.value));
    const name = duplicateName && group.kind === 'community' && group.city ? `${group.value}, ${group.city}` : group.value;
    const baseId = slug(name) || group.kind;
    let id = baseId;
    for (let suffix=2;ids.has(id);suffix++) id = `${baseId}-${suffix}`;
    ids.add(id);
    return {
      id, name, kind:group.kind, value:group.value, city:group.city,
      count:group.properties.length,
      tagline:`${group.properties.length} ${group.properties.length === 1 ? 'property' : 'properties'} in ${name}`,
      viewport:getMapViewport(group.properties,normalize(group.city) === 'ajman' ? AJMAN_VIEWPORT : allViewport),
    };
  });
  return [{id:'all',name:'All Areas',kind:'all',count:properties.length,tagline:'Explore the broker’s available properties',viewport:allViewport},...areas];
}

export function defaultMapArea(areas) {
  const cities = areas.filter(area => area.kind === 'city');
  return cities.find(area => normalize(area.name) === 'ajman')?.id
    || [...cities].sort((a,b) => b.count-a.count || a.name.localeCompare(b.name))[0]?.id
    || 'all';
}

export function fitMapViewport(map, viewport, mobile = false) {
  if (viewport.bounds) {
    map.fitBounds(viewport.bounds,{top:mobile ? 220 : 40,right:40,bottom:mobile ? 150 : 40,left:40});
  } else {
    map.panTo(viewport.center);
    map.setZoom(viewport.zoom);
  }
}
