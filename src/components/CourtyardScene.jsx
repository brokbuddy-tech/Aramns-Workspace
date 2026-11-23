import React, {useId} from 'react';
import './CourtyardScene.css';

export default function CourtyardScene({code, drawing=false}) {
  const id = useId().replace(/:/gu,'');
  return <svg className={`courtyard-scene ${drawing ? 'courtyard-scene--drawing' : ''}`} viewBox="0 0 480 600" fill="none" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${id}-sky`} x1="240" y1="60" x2="240" y2="560" gradientUnits="userSpaceOnUse"><stop stopColor="#e5d7ba"/><stop offset="1" stopColor="#f6edda"/></linearGradient>
      <linearGradient id={`${id}-sand`} x1="100" y1="400" x2="380" y2="590" gradientUnits="userSpaceOnUse"><stop stopColor="#c5a17c"/><stop offset="1" stopColor="#ae795c"/></linearGradient>
      <clipPath id={`${id}-arch`}><path d="M66 555V268C66 172 185 135 240 66C295 135 414 172 414 268V555H66Z"/></clipPath>
      <pattern id={`${id}-tiles`} width="36" height="36" patternUnits="userSpaceOnUse"><path d="M18 2L23 13L34 18L23 23L18 34L13 23L2 18L13 13Z" stroke="#a5834c" strokeWidth=".65"/></pattern>
    </defs>
    <path d="M24 570V264C24 142 177 105 240 20C303 105 456 142 456 264V570H24Z" fill="#e9dfcc"/>
    <path className="courtyard-arch-trace" pathLength="1" d="M39 570V265C39 154 182 119 240 39C298 119 441 154 441 265V570" stroke="#b99b6c" strokeWidth=".8"/>
    <g clipPath={`url(#${id}-arch)`}>
      <path d="M66 555V268C66 172 185 135 240 66C295 135 414 172 414 268V555H66Z" fill={`url(#${id}-sky)`}/>
      <circle className="courtyard-sun" cx="316" cy="208" r="48" fill="#f6f0dd"/>
      <path className="courtyard-dune courtyard-dune--far" d="M30 443C122 365 212 386 304 415C370 437 401 415 453 383V570H30V443Z" fill="#d8c09d"/>
      <path className="courtyard-dune courtyard-dune--middle" d="M38 480C148 406 262 395 450 459V570H38V480Z" fill={`url(#${id}-sand)`}/>
      <path className="courtyard-dune courtyard-dune--near" d="M37 534C151 456 285 486 452 519V577H37V534Z" fill="#e7ceb0"/>
      <path d="M37 552C159 485 322 546 447 542" stroke="#f5e5ca" strokeWidth="1.5"/>
      <path d="M294 448V397H358V469L294 448Z" fill="#d6bb95"/>
      <path d="M315 453V425C315 417 322 413 326 408C330 413 337 417 337 425V460" fill="#927056"/>
      <path d="M286 397H365" stroke="#b4936a" strokeWidth="4"/>
      <g className="courtyard-palm" stroke="#5c6955" strokeLinecap="round">
        <path d="M129 489C142 447 146 400 139 369" strokeWidth="6"/>
        <path d="M140 372C122 343 98 341 82 352C105 351 122 361 140 372Z" fill="#6f7a60" strokeWidth="2"/>
        <path d="M140 372C145 340 164 326 185 332C166 341 151 355 140 372Z" fill="#6f7a60" strokeWidth="2"/>
        <path d="M140 372C115 365 94 373 87 393C104 380 120 375 140 372Z" fill="#6f7a60" strokeWidth="2"/>
        <path d="M140 372C165 351 190 355 202 373C179 365 161 368 140 372Z" fill="#6f7a60" strokeWidth="2"/>
        <path d="M140 372C162 374 177 389 179 409C166 389 154 379 140 372Z" fill="#6f7a60" strokeWidth="2"/>
      </g>
      <g className="courtyard-birds" stroke="#927b60" strokeWidth="1.4" strokeLinecap="round">
        <path d="M142 202Q149 195 156 202Q163 195 170 202"/>
        <path d="M177 184Q182 179 187 184Q192 179 197 184"/>
      </g>
      <g className="courtyard-dust" fill="#a38554">
        <circle cx="193" cy="277" r="1.1"/><circle cx="283" cy="350" r="1.3"/><circle cx="354" cy="290" r="1"/>
      </g>
      {code && <text x="240" y="323" textAnchor="middle" fill="#6c5339" fontFamily="Georgia, serif" fontSize="102" letterSpacing="8">{code}</text>}
    </g>
    <path d="M66 555V268C66 172 185 135 240 66C295 135 414 172 414 268V555H66Z" stroke="#b99b6c"/>
    <path d="M24 570H456L474 588H6L24 570Z" fill="#d7c5a7"/>
    <path d="M6 588H474" stroke="#b99b6c"/>
    <path d="M41 283V551M439 283V551" stroke="#f8f3e9" strokeWidth="5"/>
    <path className="courtyard-tiles" d="M0 0H107V132H0ZM373 0H480V132H373Z" fill={`url(#${id}-tiles)`} opacity=".25"/>
  </svg>;
}
