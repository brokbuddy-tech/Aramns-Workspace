import {useEffect, useState} from 'react';

let mapsPromise;

export {validCoordinates} from './map-geography.mjs';

// One SDK/configuration request per page, shared by every map component.
export function loadGoogleMaps() {
  if (!mapsPromise) {
    mapsPromise = (async () => {
      const response = await fetch('/api/maps-config', {cache: 'no-store', signal: AbortSignal.timeout(10000)});
      if (!response.ok) throw new Error('Map unavailable.');
      const config = await response.json();
      if (config.enabled !== true || typeof config.apiKey !== 'string' || typeof config.mapId !== 'string') {
        throw new Error('Map unavailable.');
      }
      if (!window.google?.maps?.importLibrary) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          const callback = '__novaluxGoogleMapsReady';
          const finish = error => {
            clearTimeout(timer);
            delete window[callback];
            script.onerror = null;
            if (error) { script.remove(); reject(error); } else resolve();
          };
          const timer = setTimeout(() => finish(new Error('Map unavailable.')), 20000);
          window[callback] = () => finish();
          script.onerror = () => finish(new Error('Map unavailable.'));
          const params = new URLSearchParams({
            key: config.apiKey, v: 'weekly', loading: 'async', callback,
          });
          script.src = `https://maps.googleapis.com/maps/api/js?${params}`;
          window.gm_authFailure = () => window.dispatchEvent(new Event('novalux-maps-error'));
          script.async = true;
          script.referrerPolicy = 'strict-origin-when-cross-origin';
          document.head.append(script);
        });
      }
      const [maps, marker] = await Promise.all([
        window.google.maps.importLibrary('maps'),
        window.google.maps.importLibrary('marker'),
      ]);
      return {...maps, ...marker, mapId: config.mapId, event: window.google.maps.event};
    })().catch(error => { mapsPromise = undefined; throw error; });
  }
  return mapsPromise;
}

export function useGoogleMaps(enabled = true) {
  const [state, setState] = useState({sdk: null, error: false});
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let failed = false;
    const fail = () => {
      failed = true;
      if (active) setState({sdk: null, error: true});
    };
    window.addEventListener('novalux-maps-error', fail);
    loadGoogleMaps().then(
      sdk => { if (active && !failed) setState({sdk, error: false}); },
      fail,
    );
    return () => { active = false; window.removeEventListener('novalux-maps-error', fail); };
  }, [enabled]);
  return state;
}
