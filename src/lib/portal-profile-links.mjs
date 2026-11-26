// Only the current broker's saved profiles. Blank or invalid links stay hidden.
export function portalProfileLinks(agent) {
  return [
    {brand:'propertyfinder', name:'Property Finder', domain:'propertyfinder.ae'},
    {brand:'bayut', name:'Bayut', domain:'bayut.com'},
    {brand:'dubizzle', name:'Dubizzle', domain:'dubizzle.com'},
  ].flatMap(({brand, name, domain}) => {
    try {
      const url = new URL(agent?.portalLinks?.[brand]);
      if (url.protocol !== 'https:' || url.username || url.password || url.port || url.pathname === '/' || !(url.hostname === domain || url.hostname.endsWith(`.${domain}`))) return [];
      return [{brand, name, href:url.href}];
    } catch { return []; }
  });
}
