import React, {useEffect, useRef, useState} from 'react';

export const RATING_LABELS=['Very unhappy','Neutral','Happy','Delighted','Love it'];

function RatingFace({rating}) {
  const ink='#30362A';
  return <svg className="native-emotion-art" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
    <circle cx="50" cy="50" r="48" fill={rating===1 ? '#CBDD35':'#FFD12D'}/>
    <path d="M50 2A48 48 0 0 1 50 98C74 84 83 67 83 50S74 16 50 2Z" fill="#000" opacity=".055"/>
    {rating===5 ? <g fill="#F04459">
      <path d="M31 55C24 49 12 41 12 32C12 20 26 19 31 28C36 19 50 20 50 32C50 41 38 49 31 55Z"/>
      <path d="M69 55C62 49 50 41 50 32C50 20 64 19 69 28C74 19 88 20 88 32C88 41 76 49 69 55Z"/>
    </g>:<g fill={ink}><circle cx="38" cy="38" r="5.5"/><circle cx="62" cy="38" r="5.5"/></g>}
    {rating===1 && <path d="M32 57L68 73M68 57L32 73" fill="none" stroke={ink} strokeWidth="6.5" strokeLinecap="round"/>}
    {rating===2 && <path d="M32 65H68" fill="none" stroke={ink} strokeWidth="6" strokeLinecap="round"/>}
    {rating===3 && <path d="M30 62Q50 79 70 62" fill="none" stroke={ink} strokeWidth="6" strokeLinecap="round"/>}
    {rating===4 && <>
      <path d="M28 57H72C72 87 28 87 28 57Z" fill={ink}/>
      <path d="M40 62H61V78A10.5 10.5 0 0 1 40 78Z" fill="#F47DA9"/>
      <path d="M50.5 64V78" stroke="#DF6493" strokeWidth="2" strokeLinecap="round"/>
    </>}
    {rating===5 && <ellipse cx="50" cy="74" rx="7" ry="9" fill={ink}/>}
  </svg>;
}

export default function RatingEmoji({rating,className=''}) {
  const element=useRef(null);
  const [animated,setAnimated]=useState(false);

  useEffect(()=>{
    let visible=false;
    const update=()=>setAnimated(visible && !document.hidden);
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;update();});
    observer.observe(element.current);
    document.addEventListener('visibilitychange',update);
    return ()=>{observer.disconnect();document.removeEventListener('visibilitychange',update);};
  },[]);

  return <span ref={element} className={`native-emotion ${className}`} data-rating={rating} data-animated={animated} aria-hidden="true">
    <span className="native-emotion-glyph"><RatingFace rating={rating}/></span>
  </span>;
}
