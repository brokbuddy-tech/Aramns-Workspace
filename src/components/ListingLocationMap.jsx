import React, {useEffect, useRef, useState} from 'react';
import {useGoogleMaps, validCoordinates} from '../lib/google-maps';

export default function ListingLocationMap({property}) {
  const [visible, setVisible] = useState(false);
  const container = useRef(null);
  const coordinates = property.coordinates;
  const hasLocation = validCoordinates(coordinates);
  const {sdk, error} = useGoogleMaps(visible && hasLocation);
  const lat = coordinates?.lat;
  const lng = coordinates?.lng;

  useEffect(() => {
    if (!sdk || !visible || !hasLocation || !container.current) return;
    const map = new sdk.Map(container.current, {
      center: {lat, lng}, zoom: 16, mapId: sdk.mapId,
      mapTypeControl: false, streetViewControl: false, gestureHandling: 'cooperative',
    });
    const marker = new sdk.AdvancedMarkerElement({map, position: {lat, lng}, title: property.title});
    return () => {
      marker.map = null;
      sdk.event.clearInstanceListeners(marker);
      sdk.event.clearInstanceListeners(map);
    };
  }, [sdk, visible, hasLocation, lat, lng, property.title]);

  return (
    <section aria-label="Property location" className="space-y-4 pt-4 border-t border-[#E5E7EB]">
      <h3 className="text-[20px] font-bold text-black font-sans tracking-tight">Location</h3>
      <p className="text-[14px] text-stone-600">{property.location}</p>
      {!hasLocation ? <p className="text-sm text-stone-500">Location unavailable.</p> : (
        <>
          {!visible && <button type="button" onClick={() => setVisible(true)} className="px-5 py-2.5 rounded-lg bg-black text-white text-sm font-semibold cursor-pointer">Show map</button>}
          {visible && <div className="relative h-[320px] rounded-2xl overflow-hidden border border-[#E5E7EB] bg-stone-50">
            <div ref={container} role="region" aria-label="Property location map" className="google-property-map h-full w-full" />
            {(!sdk || error) && <p role="status" className="absolute inset-0 flex items-center justify-center p-6 text-sm text-stone-600 bg-stone-50">
              {error ? 'The map is temporarily unavailable.' : 'Loading map…'}
            </p>}
          </div>}
        </>
      )}
    </section>
  );
}
