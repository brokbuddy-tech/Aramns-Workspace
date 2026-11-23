import React, {useState} from 'react';

export default function ExpandableAmenity({label, className='', children}) {
  const [expanded,setExpanded] = useState(false);

  return <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}
    className={`min-w-0 w-full text-left cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze ${className}`}>
    {children}
    <span className={`min-w-0 flex-1 ${expanded ? 'whitespace-normal [overflow-wrap:anywhere]' : 'truncate'}`}>{label}</span>
  </button>;
}
