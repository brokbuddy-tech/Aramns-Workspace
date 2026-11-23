import React from 'react';
import CourtyardScene from './CourtyardScene';
import {ArrowLeft, ArrowUpRight, RefreshCw} from 'lucide-react';
import './ErrorPage.css';


const variants = {
  unavailable:{code:'503',eyebrow:'A brief pause',title:'Website unavailable',description:'The portfolio is temporarily unavailable. Please try again in a moment.'},
  missing:{code:'404',eyebrow:'A different path awaits',title:'Page not found',description:'This page may have moved, or the address may be incorrect. Let’s find your way back.'},
  property:{code:'404',eyebrow:'A different view awaits',title:'Property Not Found',description:'This property is no longer at this address. Explore the portfolio to find your next place.',href:'/properties',action:'Browse properties'},
  advisor:{code:'404',eyebrow:'A different path awaits',title:'Advisor Profile Not Found',description:'This advisor profile may have moved. Return to the directory to find an advisor.',href:'/agents',action:'Browse advisors'},
};

export default function ErrorPage({variant='missing',embedded=false,onNavigate}) {
  const page = variants[variant] || variants.missing;
  const unavailable = variant === 'unavailable';
  const navigate = (event,path) => {
    if (!onNavigate || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();onNavigate(path);
  };
  return <main className={`error-page ${embedded ? 'error-page--embedded' : ''}`}>
    <div className="error-page-frame" aria-hidden="true"/>
    <div className="error-page-inner">
      {!embedded && <div className="error-page-brand"><svg viewBox="0 0 28 32" width="25" height="29" fill="none" aria-hidden="true"><path d="M3 30V15C3 9 10 7 14 2C18 7 25 9 25 15V30H3Z" stroke="currentColor"/><path d="M8 30V16C8 12 12 11 14 8C16 11 20 12 20 16V30" stroke="currentColor"/></svg><span>Property portfolio</span></div>}
      <div className="error-page-layout">
        <section className="error-page-copy" aria-label={unavailable ? 'Website status' : 'Page not found'}>
          <p className="error-page-eyebrow"><span aria-hidden="true">✧</span>{page.eyebrow}</p>
          <h1>{page.title}</h1>
          <p className="error-page-description" role={unavailable ? 'status' : undefined}>{page.description}</p>
          <div className="error-page-actions">
            {unavailable ? <button type="button" className="error-page-primary" onClick={() => window.location.reload()}><RefreshCw size={15} aria-hidden="true"/>Try again</button>
              : <a className="error-page-primary" href={page.href || '/'} onClick={event => navigate(event,page.href || '/')}><ArrowLeft size={15} aria-hidden="true"/>{page.action || 'Back to home'}</a>}
            {!unavailable && <a className="error-page-secondary" href={page.href ? '/' : '/properties'} onClick={event => navigate(event,page.href ? '/' : '/properties')}>{page.href ? 'Back to home' : 'Explore properties'}<ArrowUpRight size={15} aria-hidden="true"/></a>}
          </div>
          <div className="error-page-ornament" aria-hidden="true"><span/>✧<span/></div>
        </section>
        <div className="error-page-art"><CourtyardScene code={page.code}/></div>
      </div>
    </div>
  </main>;
}
