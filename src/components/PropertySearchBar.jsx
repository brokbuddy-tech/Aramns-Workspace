import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {ArrowRight, MapPin, Sparkles, X} from 'lucide-react';
import {propertySector, rangeError} from '../lib/property-filters.mjs';
import './PropertySearchBar.css';

const residentialTypes = ['Apartment','Villa','Townhouse','Penthouse','Villa Compound','Hotel Apartment','Land','Floor','Building'];
const commercialTypes = ['Office','Shop','Warehouse','Labour Camp','Commercial Villa','Bulk Unit','Land','Floor','Building','Factory','Industrial Land','Mixed Use Land','Showroom'];
const normalizeType = value => value.replace(/[\s_-]/g,'').toLowerCase();
const compact = value => new Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:1}).format(Number(value));
const rangeLabel = (min,max,fallback) => min === '' && max === '' ? fallback : min === '' ? `Up to ${compact(max)}` : max === '' ? `${compact(min)}+` : `${compact(min)} – ${compact(max)}`;
const frequencyOptions = [['YEARLY','Yearly'],['MONTHLY','Monthly'],['WEEKLY','Weekly'],['DAILY','Daily'],['All','Any']];

function RoomChoices({legend, label, value, options, onChange}) {
  return (
    <fieldset className="property-search-room-group" aria-label={legend}>
      <legend>{label}</legend>
      <div className="property-search-pills">
        {options.map(option => (
          <button key={option.value} type="button" aria-pressed={value === option.value}
            className={`property-search-pill ${value === option.value ? 'is-selected' : ''}`}
            onClick={() => onChange(value === option.value ? 'All' : option.value)}>{option.label}</button>
        ))}
      </div>
    </fieldset>
  );
}

function Range({label, minKey, maxKey, value, onChange, disabled=false}) {
  return (
    <fieldset disabled={disabled} className="property-search-range">
      <legend className="sr-only">{label}</legend>
      {[[minKey,'Minimum'],[maxKey,'Maximum']].map(([key,text]) => (
        <label key={key}>
          <span>{text}</span>
          <input type="number" min="0" step="any" inputMode="decimal" aria-label={`${text} ${label.toLowerCase()}`}
            value={value[key]} placeholder={key === minKey ? '0' : 'Any'} onChange={event => onChange(key,event.target.value)} />
        </label>
      ))}
    </fieldset>
  );
}

export default function PropertySearchBar({
  value, onChange, category, locations, properties,
  priceOptions, currency, commercialOnly, hasViewCounts, previewCount,
  resultCount, activeChips, onReset, onDescriptionSearch,
}) {
  const root = useRef(null);
  const popup = useRef(null);
  const triggers = useRef({});
  const [open,setOpen] = useState(null);
  const [draft,setDraft] = useState(null);
  const [position,setPosition] = useState({left:12,top:0,width:360,arrow:24,maxHeight:580,placement:'bottom'});
  const [amenitySearch,setAmenitySearch] = useState('');
  const advanced = value.advanced;
  const selected = draft?.advanced || advanced;
  const isRent = category === 'rent';
  const isOffPlan = !isRent && advanced.readiness === 'OFFPLAN';
  const currencies = [...new Set(properties.map(property => property.currency))].sort();
  const selectedCurrency = selected.currency || (currencies.length === 1 ? currencies[0] : '');
  const canComparePrice = Boolean(selected.currency) || currencies.length === 1;
  const amenities = [...new Set([...properties.flatMap(property => property.amenities || []),...advanced.amenities])].sort((a,b) => a.localeCompare(b));
  const typeSector = selected.sector === 'commercial' ? 'commercial' : 'residential';
  const sourceTypes = [...new Set(properties.filter(property => propertySector(property) === typeSector).map(property => property.category))];
  const standardTypes = typeSector === 'commercial' ? commercialTypes : residentialTypes;
  const typeOptions = standardTypes.map(label => ({label,value:sourceTypes.find(type => normalizeType(type) === normalizeType(label)) || label}));
  sourceTypes.filter(type => !standardTypes.some(label => normalizeType(type) === normalizeType(label))).forEach(type => typeOptions.push({label:type.replace(/_/g,' '),value:type}));
  const handoverYears = [...new Set(properties.filter(property => property.readiness === 'OFFPLAN').map(property => property.handoverYear).filter(Number.isFinite))].sort((a,b) => a-b);
  const paymentPlans = [...new Set(properties.filter(property => property.readiness === 'OFFPLAN').map(property => property.paymentPlan).filter(Boolean))].sort();
  const error = draft ? rangeError(selected) : '';
  const preview = draft && !error ? previewCount(draft) : resultCount;

  const close = (restore=false) => {
    if (restore) triggers.current[open]?.focus({preventScroll:true});
    setOpen(null);
  };
  const toggle = key => {
    if (open === key) {close(); return;}
    setDraft({type:value.type,beds:value.beds,amenity:value.amenity,priceRange:value.priceRange,advanced:{...advanced,amenities:[...advanced.amenities]}});
    setAmenitySearch('');
    setOpen(key);
  };
  const update = (key,next) => setDraft(previous => ({...previous,advanced:{...previous.advanced,[key]:next}}));
  const apply = () => {
    if (!draft || error) return;
    onChange({...draft,
      ...(selected.minPrice !== '' || selected.maxPrice !== '' ? {priceRange:'All'} : {}),
      ...(selected.sector === 'commercial' ? {beds:'All'} : {}),
    });
    close(true);
  };
  const resetField = key => {
    const changes = {
      type:{type:'All',advanced:{...selected,sector:'All'}},
      beds:{beds:'All',advanced:{...selected,baths:'All'}},
      price:{priceRange:'All',advanced:{...selected,minPrice:'',maxPrice:''}},
      area:{advanced:{...selected,minArea:'',maxArea:''}},
      amenities:{amenity:'All',advanced:{...selected,amenities:[]}},
      handover:{advanced:{...selected,handoverBy:''}},
      payment:{advanced:{...selected,paymentPlan:'All'}},
    };
    setDraft(previous => ({...previous,...changes[key]}));
  };

  useLayoutEffect(() => {
    if (!open) return;
    const element = popup.current;
    if (!element.matches(':popover-open')) element.showPopover();
    const place = () => {
      const box = root.current.getBoundingClientRect();
      const trigger = triggers.current[open]?.getBoundingClientRect();
      if (!trigger) return;
      if (trigger.bottom < 0 || trigger.top > window.innerHeight) {setOpen(null); return;}
      const preferred = open === 'type' ? 520 : open === 'beds' ? 390 : open === 'period' ? trigger.width : 400;
      const width = Math.min(preferred,box.width-24,window.innerWidth-24);
      const left = Math.max(12,box.left+12,Math.min(trigger.right-width,box.right-width-12,window.innerWidth-width-12));
      const below = window.innerHeight-trigger.bottom-24;
      const above = trigger.top-24;
      const placement = below >= 300 || below >= above ? 'bottom' : 'top';
      const maxHeight = Math.max(100,Math.min(580,window.innerHeight*.7,placement === 'bottom' ? below : above));
      element.style.width = `${width}px`;
      element.style.maxHeight = `${maxHeight}px`;
      const height = element.getBoundingClientRect().height;
      const top = placement === 'bottom' ? trigger.bottom+12 : Math.max(12,trigger.top-height-12);
      setPosition({left,top,width,maxHeight,placement,arrow:Math.max(18,Math.min(width-18,trigger.right-left-24))});
    };
    let frame;
    const schedule = () => {cancelAnimationFrame(frame);frame=requestAnimationFrame(place);};
    place();
    const observer = new ResizeObserver(schedule);
    observer.observe(element);
    window.addEventListener('resize',schedule);
    window.addEventListener('scroll',schedule,true);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize',schedule);
      window.removeEventListener('scroll',schedule,true);
    };
  },[open]);

  useEffect(() => {
    if (!open) return;
    const outside = event => {
      if (!popup.current?.contains(event.target) && !triggers.current[open]?.contains(event.target)) setOpen(null);
    };
    const escape = event => {
      if (event.key === 'Escape') {event.preventDefault(); triggers.current[open]?.focus({preventScroll:true}); setOpen(null);}
    };
    document.addEventListener('pointerdown',outside);
    document.addEventListener('focusin',outside);
    document.addEventListener('keydown',escape);
    popup.current?.focus({preventScroll:true});
    return () => {
      document.removeEventListener('pointerdown',outside);
      document.removeEventListener('focusin',outside);
      document.removeEventListener('keydown',escape);
    };
  },[open]);

  const control = (key,label,text,children,{disabled=false,footer=true}={}) => (
    <div className="property-search-control-wrap">
      <button ref={element => {triggers.current[key]=element;}} type="button" className={`property-search-control ${open === key ? 'is-open' : ''}`}
        disabled={disabled} aria-label={`${label}: ${text}`} aria-haspopup="dialog" aria-expanded={open === key} aria-controls={`property-search-${key}`}
        onClick={() => toggle(key)}>
        <span>{text}</span><i className="property-search-caret" aria-hidden="true" />
      </button>
      {open === key && (
        <div id={`property-search-${key}`} ref={popup} popover="manual" role="dialog" aria-label={`${label} filters`} tabIndex={-1} data-placement={position.placement}
          className={`property-search-dropdown property-search-dropdown--${key}`}
          style={{left:position.left,top:position.top,width:position.width,maxHeight:position.maxHeight,'--arrow-position':`${position.arrow}px`}}>
          <h3 className="sr-only">{label}</h3>
          <div className="property-search-dropdown-body">{children}</div>
          {footer && <div className="property-search-dropdown-footer">
            {error && <p role="alert">{error}</p>}
            <p role="status" aria-live="polite" className="sr-only">{error ? 'Adjust your range' : `${preview} ${preview === 1 ? 'property matches' : 'properties match'} your search`}</p>
            <div><button type="button" className="property-search-reset" onClick={() => resetField(key)}>Reset</button><button type="button" className="property-search-done" disabled={Boolean(error)} onClick={apply}>Done</button></div>
          </div>}
        </div>
      )}
    </div>
  );

  const typeControl = control('type','Property type',value.type !== 'All' ? value.type : advanced.sector === 'residential' ? 'Residential' : advanced.sector === 'commercial' ? 'Commercial' : 'All property types',<>
    <div role="tablist" aria-label="Property category" className="property-search-type-tabs">
      {['residential','commercial'].map(sector => <button key={sector} type="button" role="tab" aria-selected={typeSector === sector}
        onClick={() => setDraft(previous => ({...previous,type:'All',...(sector === 'commercial' ? {beds:'All'} : {}),advanced:{...previous.advanced,sector,...(sector === 'commercial' ? {baths:'All'} : {})}}))}>{sector === 'residential' ? 'Residential' : 'Commercial'}</button>)}
    </div>
    <fieldset className="property-search-type-options" aria-label="Property type"><legend className="sr-only">Property type</legend>
      {typeOptions.map(option => <button key={option.value} type="button" aria-pressed={draft?.type === option.value}
        className={`property-search-type-option ${draft?.type === option.value ? 'is-selected' : ''}`}
        onClick={() => setDraft(previous => ({...previous,type:previous.type === option.value ? 'All' : option.value,...(typeSector === 'commercial' ? {beds:'All'} : {}),advanced:{...previous.advanced,sector:typeSector,...(typeSector === 'commercial' ? {baths:'All'} : {})}}))}>
        <span className="property-search-radio" aria-hidden="true"/><span>{option.label}</span>
      </button>)}
    </fieldset>
  </>);

  const bedsText = [value.beds === 'All' ? '' : value.beds === 'studio' ? 'Studio' : `${value.beds} beds`,advanced.baths === 'All' ? '' : `${advanced.baths} baths`].filter(Boolean).join(' · ') || 'Beds & Baths';
  const bedsControl = control('beds','Beds & Baths',bedsText,<>
    <RoomChoices legend="Bedrooms" label="Beds" value={draft?.beds || value.beds} options={[{value:'studio',label:'Studio'},...[1,2,3,4,5,6,7].map(number => ({value:String(number),label:String(number)})),{value:'8+',label:'8+'}]}
      onChange={next => setDraft(previous => ({...previous,beds:next}))}/>
    <RoomChoices legend="Bathrooms" label="Baths" value={selected.baths} options={[...[1,2,3,4,5].map(number => ({value:String(number),label:String(number)})),{value:'6+',label:'6+'}]} onChange={next => update('baths',next)}/>
  </>);

  const priceText = rangeLabel(advanced.minPrice,advanced.maxPrice,`Price${currency ? ` (${currency})` : ''}`);
  const priceControl = control('price',`Price${currency ? ` (${currency})` : ''}`,priceText,<>
    {(currencies.length > 1 || selected.currency) && <div className="property-search-currency"><label htmlFor="property-search-currency">Currency</label><select id="property-search-currency" value={selected.currency}
      onChange={event => {const next=event.target.value;setDraft(previous => ({...previous,priceRange:'All',advanced:{...previous.advanced,currency:next,...(!next && currencies.length > 1 ? {minPrice:'',maxPrice:''} : {})}}));}}>
      <option value="">All currencies</option>{currencies.map(code => <option key={code} value={code}>{code}</option>)}{selected.currency && !currencies.includes(selected.currency) && <option value={selected.currency}>{selected.currency}</option>}
    </select></div>}
    <Range label={`Price${selectedCurrency ? ` (${selectedCurrency})` : ''}`} minKey="minPrice" maxKey="maxPrice" value={selected} disabled={!canComparePrice}
      onChange={(key,next) => {update(key,next);setDraft(previous => ({...previous,priceRange:'All'}));}}/>
    {!canComparePrice && <p className="property-search-note">Choose a currency to set a price range.</p>}
    {value.priceRange !== 'All' && <p className="property-search-note">{priceOptions.find(option => option.value === value.priceRange)?.label}. Reset to clear this range.</p>}
  </>);
  const areaControl = control('area','Area (sq ft)',rangeLabel(advanced.minArea,advanced.maxArea,'Area (sq ft)'),<Range label="Area (sq ft)" minKey="minArea" maxKey="maxArea" value={selected} onChange={update}/>);
  const amenityControl = control('amenities','Amenities',advanced.amenities.length ? `Amenities (${advanced.amenities.length})` : 'Amenities',<>
    <p className="property-search-note">Match every selected amenity.</p>
    {amenities.length > 8 && <input className="property-search-amenity-input" type="search" aria-label="Find an amenity" placeholder="Find an amenity" value={amenitySearch} onChange={event => setAmenitySearch(event.target.value)}/>}
    <div className="property-search-amenities">{amenities.filter(amenity => amenity.toLowerCase().includes(amenitySearch.toLowerCase())).map(amenity => <label key={amenity}>
      <input type="checkbox" checked={selected.amenities.includes(amenity)} onChange={event => update('amenities',event.target.checked ? [...selected.amenities,amenity] : selected.amenities.filter(item => item !== amenity))}/><span>{amenity}</span>
    </label>)}</div>
    {!amenities.some(amenity => amenity.toLowerCase().includes(amenitySearch.toLowerCase())) && <p className="property-search-note">No matching amenities.</p>}
  </>);
  const sortControl = <label className="property-search-sort" title={!hasViewCounts ? 'Most-viewed ranking is not available yet.' : undefined}><span className="sr-only">Sort by</span>
    <select aria-label="Sort By" value={value.sort} onChange={event => onChange({sort:event.target.value})}>
      <option value="featured">Sort: Featured</option><option value="latest">Latest</option><option value="most-viewed" disabled={!hasViewCounts}>Hottest deals (most viewed)</option>
      <option value="price-asc" disabled={currencies.length > 1 && !advanced.currency}>Price: Low to High</option><option value="price-desc" disabled={currencies.length > 1 && !advanced.currency}>Price: High to Low</option><option value="sqft-desc">Largest area</option><option value="beds-desc">Most bedrooms</option>
    </select><i className="property-search-caret" aria-hidden="true"/>
  </label>;
  const mediaControls = (properties.some(property => property.floorPlanUrl) || advanced.floorPlan) ? <div className="property-search-media">
    <label><input type="checkbox" checked={advanced.floorPlan} onChange={event => onChange({advanced:{...advanced,floorPlan:event.target.checked}})}/>With floor plan</label>
  </div> : null;
  const resultSummary = <div className="property-search-count">
    <p role="status" aria-live="polite" aria-atomic="true"><strong>{resultCount}</strong> {resultCount === 1 ? 'property' : 'properties'} found</p>
    {activeChips.length > 0 && <button type="button" className="property-search-clear" onClick={onReset}>Reset Filters</button>}
  </div>;

  const periodControl = control('period','Rental period',frequencyOptions.find(([key]) => key === advanced.rentFrequency)?.[1] || 'Any period',<div className="property-search-frequency">
    {frequencyOptions.map(([key,text]) => <button key={key} type="button" aria-pressed={advanced.rentFrequency === key} disabled={key !== 'All' && !properties.some(property => property.rentFrequency === key)}
      onClick={() => {onChange({advanced:{...advanced,rentFrequency:key}});close(true);}}>{text}</button>)}
    {!properties.some(property => property.rentFrequency) && <p className="property-search-note">Rental periods are not specified for these listings.</p>}
  </div>,{footer:false});
  const handoverControl = control('handover','Handover by',advanced.handoverBy ? `Handover by ${advanced.handoverBy}` : 'Handover by',<div className="property-search-option-list">
    {handoverYears.map(year => <button key={year} type="button" aria-pressed={selected.handoverBy === String(year)} onClick={() => update('handoverBy',String(year))}>{year}</button>)}
  </div>,{disabled:handoverYears.length === 0});
  const paymentControl = control('payment','Payment plan',advanced.paymentPlan !== 'All' ? advanced.paymentPlan : 'Payment plan',<div className="property-search-option-list">
    {paymentPlans.map(plan => <button key={plan} type="button" aria-pressed={selected.paymentPlan === plan} onClick={() => update('paymentPlan',plan)}>{plan}</button>)}
  </div>,{disabled:paymentPlans.length === 0});

  return (
    <form ref={root} role="search" aria-label="Property search" className="property-search"
      onSubmit={event => {event.preventDefault();if (open) apply();document.getElementById('property-results')?.scrollIntoView({block:'start',behavior:'smooth'});}}>
      <div className="property-search-body">
        <div className="property-search-grid property-search-top">
          <div className="property-search-location">
            <MapPin size={23}/>
            <input type="search" aria-label="Search properties" list="property-search-locations" value={value.query || (value.location !== 'All' ? value.location : '')}
              onChange={event => {const text=event.target.value;onChange(locations.includes(text) && text !== 'All' ? {location:text,query:''} : {location:'All',query:text});}}
              placeholder="Enter location, property or keyword"/>
            <datalist id="property-search-locations">{locations.filter(location => location !== 'All').map(location => <option key={location} value={location}/>)}</datalist>
          </div>
          <button type="submit" className="property-search-submit" disabled={Boolean(open && error)}>Search</button>
        </div>
        <div className="property-search-grid property-search-main">
          {isRent ? periodControl : <fieldset className="property-search-segment" aria-label="Completion status"><legend className="sr-only">Completion status</legend>
            {[['All','All'],['READY','Ready'],['OFFPLAN','Off-plan']].map(([key,text]) => <button key={key} type="button" aria-pressed={advanced.readiness === key}
              onClick={() => onChange({advanced:{...advanced,readiness:key,...(key !== 'OFFPLAN' ? {handoverBy:'',paymentPlan:'All'} : {})}})}>{text}</button>)}
          </fieldset>}
          {typeControl}
          {isOffPlan ? handoverControl : commercialOnly ? areaControl : bedsControl}
          {isOffPlan ? paymentControl : priceControl}
        </div>
        <div className="property-search-grid property-search-refinements">
          {isOffPlan ? <>{priceControl}{areaControl}{amenityControl}<div className="property-search-sort-summary">{sortControl}{resultSummary}</div></> : commercialOnly ? <>{amenityControl}{sortControl}{resultSummary}{mediaControls}</> : <>{areaControl}{amenityControl}{sortControl}{resultSummary}{mediaControls}</>}
        </div>
        {isOffPlan && <div className="property-search-context-row">{mediaControls}{(handoverYears.length === 0 || paymentPlans.length === 0) && <p className="property-search-note">Some listings do not include handover dates or payment plans.</p>}</div>}
        {activeChips.length > 0 && <div className="property-search-active">{activeChips.map(chip => <button key={chip.key} type="button" onClick={chip.remove} aria-label={`Remove ${chip.label}`}><span>{chip.label}</span><X size={12}/></button>)}</div>}
      </div>
      <div className="property-search-assist"><div><Sparkles size={21}/><span>Find a home that fits what you have in mind.</span></div><button type="button" aria-label="AI Search" onClick={onDescriptionSearch}>Search by description<ArrowRight size={18}/></button></div>
    </form>
  );
}
