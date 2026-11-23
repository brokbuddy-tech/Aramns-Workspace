import {firstDisplayValue,hasDisplayValue} from '../lib/display-data.mjs';
import React,{useEffect,useState} from 'react';
import {Copy,Check,Phone} from 'lucide-react';
import {BrandMark} from './OfficialProfileLinks';
import {propertyShareLinks,whatsappContactUrl} from '../lib/property-presentation.mjs';
import './ListingRepresentative.css';
export default function ListingRepresentative({agent,property,onNavigate}) {
  const [copied,setCopied]=useState(false),[copyError,setCopyError]=useState(false);
  useEffect(()=>{setCopied(false);setCopyError(false);},[property.id]);
  useEffect(()=>{if(!copied) return;const timer=setTimeout(()=>setCopied(false),3000);return ()=>clearTimeout(timer);},[copied]);
  if(!agent) return null;
  const shares=propertyShareLinks(property,window.location.origin);
  const whatsapp=whatsappContactUrl(agent.whatsapp,`Hello, I'm interested in ${property.title}.\n${shares.url}`);
  const licenseDetails=[
    {label:'BRN',value:agent.licenseId},
    {label:'ORN',value:firstDisplayValue(agent.officeLicenseId,agent.orn)},
  ].filter(detail=>hasDisplayValue(detail.value));
  const metrics=[
    {label:'Listings',value:Array.isArray(agent.listingIds) ? agent.listingIds.length:null},
    {label:'Experience',value:typeof agent.experience==='string' ? agent.experience.replace(/^(\d+(?:\.\d+)?)\s*\+?\s*(years?|yrs?)$/i,'$1+ $2'):agent.experience},
  ].filter(metric=>hasDisplayValue(metric.value));
  const copy=async()=>{
    try {await navigator.clipboard.writeText(shares.url);setCopied(true);setCopyError(false);}
    catch {setCopied(false);setCopyError(true);}
  };
  return <aside className="listing-representative" aria-labelledby="listing-representative-name">
    <div className="listing-representative-header">
      {agent.avatar || agent.image ? <img className="listing-representative-photo" src={agent.avatar || agent.image} alt={agent.name} loading="lazy"/>:<div className="listing-representative-placeholder" aria-label="Broker photo unavailable">{agent.name?.slice(0,1)}</div>}
      <div className="listing-representative-identity">
        <h2 id="listing-representative-name"><a href={`/agents/${encodeURIComponent(agent.slug || agent.id)}`} onClick={event=>{if(onNavigate && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {event.preventDefault();onNavigate(event.currentTarget.getAttribute('href'));}}}>{agent.name}</a></h2>
        {hasDisplayValue(agent.title) && <p>{agent.title}</p>}
        {(licenseDetails.length>0 || hasDisplayValue(agent.region)) && <ul className="listing-representative-credentials" aria-label="Broker details">
          {licenseDetails.map(detail=><li key={detail.label}>{detail.label}: <span>{detail.value}</span></li>)}
          {hasDisplayValue(agent.region) && <li>{agent.region}</li>}
        </ul>}
      </div>
    </div>
    {metrics.length>0 && <dl className="listing-representative-metrics">
      {metrics.map(metric=><div key={metric.label}><dt>{metric.label}</dt><dd>{metric.value}</dd></div>)}
    </dl>}
    {(hasDisplayValue(agent.phone) || whatsapp) && <div className="listing-representative-contact">
      {hasDisplayValue(agent.phone) && <a href={`tel:${agent.phone}`}><Phone size={18} aria-hidden="true"/>Call Advisor</a>}
      {whatsapp && <a className="listing-representative-whatsapp" href={whatsapp} target="_blank" rel="noopener noreferrer"><BrandMark brand="whatsapp"/>WhatsApp</a>}
    </div>}
    <div className="listing-representative-share">
      <h3>Share this property</h3>
      <div className="listing-share-icons">
        <button type="button" onClick={copy} aria-label={copied ? 'Property link copied':'Copy property link'} title="Copy property link">{copied ? <Check size={19} aria-hidden="true"/>:<Copy size={19} aria-hidden="true"/>}</button>
        {[['whatsapp','WhatsApp'],['facebook','Facebook'],['x','X'],['linkedin','LinkedIn']].map(([brand,name])=><a key={brand} className={`listing-share-${brand}`} href={shares[brand]} aria-label={`Share property on ${name}`} title={`Share on ${name}`} target="_blank" rel="noopener noreferrer"><BrandMark brand={brand}/></a>)}
      </div>
      {copied && <p role="status">Link copied</p>}
      {copyError && <div className="listing-copy-fallback"><label htmlFor="listing-copy-url">Copy this property link</label><input id="listing-copy-url" value={shares.url} readOnly onFocus={event=>event.target.select()}/></div>}
    </div>
  </aside>;
}
