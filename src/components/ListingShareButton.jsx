import React,{useId,useRef,useState} from 'react';
import {Check,Copy,Share2,X} from 'lucide-react';
import {propertyShareLinks} from '../lib/property-presentation.mjs';
import {BrandMark} from './OfficialProfileLinks';
import './ListingShareButton.css';

export default function ListingShareButton({property}) {
  const dialog=useRef(null),titleId=useId(),urlId=useId();
  const [copied,setCopied]=useState(false),[copyError,setCopyError]=useState(false);
  const shares=propertyShareLinks(property,window.location.origin);
  const share=async()=>{
    setCopied(false);setCopyError(false);
    if(navigator.share) {
      try {await navigator.share({title:property.title,url:shares.url});return;}
      catch(error) {if(error.name==='AbortError') return;}
    }
    dialog.current?.showModal();
  };
  const copy=async()=>{
    try {await navigator.clipboard.writeText(shares.url);setCopied(true);setCopyError(false);}
    catch {setCopied(false);setCopyError(true);}
  };
  return <div className="listing-card-share" onClick={event=>event.stopPropagation()}>
    <button type="button" className="listing-card-share-trigger" aria-label={`Share listing: ${property.title}`} title="Share listing" onClick={share}><Share2 size={19} aria-hidden="true"/></button>
    <dialog ref={dialog} className="listing-share-dialog" aria-labelledby={titleId} onClick={event=>{if(event.target===event.currentTarget) dialog.current.close();}}>
      <div className="listing-share-dialog-content">
        <div className="listing-share-dialog-heading"><h2 id={titleId}>Share listing</h2><button type="button" aria-label="Close sharing options" className="listing-share-close" onClick={()=>dialog.current.close()}><X size={20} aria-hidden="true"/></button></div>
        <p className="listing-share-title">{property.title}</p>
        <div className="listing-share-platforms">
          {[['whatsapp','WhatsApp'],['facebook','Facebook'],['x','X'],['linkedin','LinkedIn']].map(([brand,name])=><a key={brand} className={`listing-card-share-${brand}`} href={shares[brand]} aria-label={`Share on ${name}`} title={name} target="_blank" rel="noopener noreferrer"><BrandMark brand={brand}/></a>)}
        </div>
        <button type="button" className="listing-share-copy" onClick={copy}>{copied ? <Check size={18} aria-hidden="true"/>:<Copy size={18} aria-hidden="true"/>}{copied ? 'Link copied':'Copy link'}</button>
        {copied && <p className="sr-only" role="status">Listing link copied</p>}
        {copyError && <label className="listing-share-manual" htmlFor={urlId}>Copy this listing link<input id={urlId} value={shares.url} readOnly onFocus={event=>event.target.select()}/></label>}
      </div>
    </dialog>
  </div>;
}
