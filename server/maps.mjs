// Only this explicit public configuration may be sent to the browser.
// Broker/agency feed credentials must never be added to this response.
export function getPublicMapsConfig(env = process.env) {
  const apiKey = String(env.GOOGLE_MAPS_BROWSER_API_KEY || '').trim();
  const mapId = String(env.GOOGLE_MAPS_MAP_ID || '8f9c7f3389f798b89cdc534a').trim();
  if (!/^AIza[A-Za-z0-9_-]{20,100}$/.test(apiKey) || !/^[a-fA-F0-9]{8,128}$/.test(mapId)) {
    return {enabled: false};
  }
  return {enabled: true, apiKey, mapId};
}
