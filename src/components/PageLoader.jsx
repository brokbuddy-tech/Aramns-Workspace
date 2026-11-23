import React, {useEffect, useState} from 'react';
import CourtyardScene from './CourtyardScene';
import './PageLoader.css';

const messages = {
  home:'Opening the portfolio', listings:'Gathering available properties', property:'Opening the property',
  profile:'Opening the portfolio', agents:'Opening the advisor directory', article:'Opening the story',
  content:'Opening the page', map:'Preparing the map',
};

export default function PageLoader({variant='home', agent}) {
  const [branding, setBranding] = useState(null);
  useEffect(() => {
    if (agent?.name) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    fetch('/api/branding', {cache:'no-store', signal:controller.signal})
      .then(response => response.ok ? response.json() : null)
      .then(value => {
        if (!controller.signal.aborted && typeof value?.name === 'string' && value.name.trim()) {
          setBranding({name:value.name, tagline:typeof value.tagline === 'string' ? value.tagline : ''});
        }
      })
      .catch(() => {})
      .finally(() => clearTimeout(timeout));
    return () => {clearTimeout(timeout); controller.abort();};
  }, [agent?.name]);
  const name = agent?.name || branding?.name;
  const tagline = agent?.title || branding?.tagline;
  return <main className="page-loader" aria-busy="true" aria-label="Loading page">
    <div className="page-loader-frame" aria-hidden="true"/>
    <div className="page-loader-content">
      <div className="page-loader-scene"><CourtyardScene drawing/></div>
      <div className="page-loader-signature" key={name || 'pending'}>
        <h1 className={`page-loader-name${name ? '' : ' page-loader-name--pending'}`} dir="ltr">{name || 'Property Portfolio'}</h1>
        <svg className="page-loader-flourish" viewBox="0 0 280 28" fill="none" aria-hidden="true">
          <path d="M10 18C48 18 72 5 104 10C118 12 125 18 140 18C155 18 162 12 176 10C208 5 232 18 270 18"/>
          <path d="M115 21C124 24 133 24 140 18C147 24 156 24 165 21"/>
          <path d="M137 5L140 2L143 5L140 8Z" className="page-loader-flourish-diamond"/>
        </svg>
        {tagline && <p className="page-loader-tagline" dir="auto">{tagline}</p>}
      </div>
      <div className="page-loader-progress" aria-hidden="true"><span/></div>
      <p className="page-loader-status" role="status" aria-live="polite" aria-atomic="true">{messages[variant] || messages.home}<span aria-hidden="true">…</span></p>
    </div>
  </main>;
}
