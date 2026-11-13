// This fake SDK exercises our UI contract without contacting or billing Google.
export async function installMapsMock(page) {
  await page.route('**/api/maps-config', route => route.fulfill({json: {
    enabled: true, apiKey: 'AIza' + 'T'.repeat(35), mapId: '8f9c7f3389f798b89cdc534a',
  }}));
  await page.route('https://maps.googleapis.com/maps/api/js?**', route => {
    const callback = new URL(route.request().url()).searchParams.get('callback');
    return route.fulfill({contentType: 'application/javascript', body: `
      window.__mapsCalls = {maps: [], markers: [], bounds: []};
      class Events {
        addListener(name, callback) {
          (this.listeners ??= {})[name] = callback;
          return {remove: () => delete this.listeners[name]};
        }
      }
      class GoogleMap extends Events {
        constructor(element, options) {
          super(); this.element = element; this.options = options;
          element.dataset.googleMap = 'ready';
          element.style.position = 'relative';
          window.__mapsCalls.maps.push(options);
        }
        panTo(center) { this.options.center = center; }
        setZoom(zoom) { this.options.zoom = zoom; }
        fitBounds(bounds, padding) {
          this.options.bounds = {...bounds};
          this.options.center = {lat:(bounds.south+bounds.north)/2,lng:(bounds.west+bounds.east)/2};
          window.__mapsCalls.bounds.push({bounds:{...bounds},padding});
        }
      }
      class AdvancedMarkerElement extends Events {
        constructor(options) {
          super(); this.content = options.content || document.createElement('span');
          this.content.dataset.locationPin = options.title;
          // Google positions these overlays geographically. Give the fake SDK
          // deterministic positions below the template's mobile toolbar.
          const i = window.__mapsCalls.markers.length;
          Object.assign(this.content.style, {position:'absolute', top: (180 + i % 9 * 45) + 'px', left: (20 + Math.floor(i / 9) * 110) + 'px'});
          this.position = options.position; this.map = options.map;
          window.__mapsCalls.markers.push({position: options.position, title: options.title});
        }
        set map(value) { this.currentMap = value; this.content.remove(); if (value) value.element.append(this.content); }
        get map() { return this.currentMap; }
      }
      class InfoWindow extends Events {
        constructor(options) { super(); this.options = options; }
        open({map}) {
          this.close(); this.element = document.createElement('div');
          Object.assign(this.element.style, {position:'absolute',top:'260px',left:'0',zIndex:'100'});
          this.element.innerHTML = this.options.content; map.element.append(this.element);
          this.listeners?.domready?.();
        }
        close() { this.element?.remove(); }
      }
      window.google = {maps: {
        importLibrary: async name => name === 'marker' ? {AdvancedMarkerElement} : {Map: GoogleMap, InfoWindow},
        ControlPosition: {LEFT_CENTER: 'LEFT_CENTER'},
        event: {clearInstanceListeners: object => {object.listeners = {};}, trigger: () => {}},
      }};
      window[${JSON.stringify(callback)}]();
    `});
  });
}
