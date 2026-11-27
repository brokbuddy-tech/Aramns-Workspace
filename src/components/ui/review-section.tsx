import * as React from "react";
import { ArrowLeft, ArrowRight, Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import "./review-section.css";

export interface ReviewItem {
  id: string;
  name: string;
  meta?: React.ReactNode;
  avatar?: string;
  quote: string;
  rating: number;
  ratingVisual: React.ReactNode;
  details?: React.ReactNode;
}

interface ReviewSectionProps {
  items: ReviewItem[];
  title?: string;
  headingId?: string;
  intro?: React.ReactNode;
  className?: string;
}

export function ReviewSection({items,title="Reviews",headingId,intro,className}:ReviewSectionProps) {
  const track=React.useRef<HTMLDivElement>(null);
  const [edges,setEdges]=React.useState({start:true,end:true});

  const syncEdges=React.useCallback(()=>{
    const el=track.current;
    if(el) setEdges({start:el.scrollLeft<2,end:el.scrollLeft+el.clientWidth>=el.scrollWidth-2});
  },[]);

  React.useEffect(()=>{
    const el=track.current;
    if(!el) return;
    const observer=new ResizeObserver(syncEdges);
    observer.observe(el);
    syncEdges();
    return ()=>observer.disconnect();
  },[syncEdges,items.length]);

  const scroll=(direction:number)=>{
    const el=track.current;
    if(!el) return;
    const card=el.firstElementChild as HTMLElement | null;
    const gap=parseFloat(getComputedStyle(el).columnGap) || 0;
    const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({left:direction*((card?.getBoundingClientRect().width || el.clientWidth)+gap),behavior:reducedMotion ? 'auto':'smooth'});
  };

  return <div className={cn('review-section',className)}>
    <header className="review-section-heading">
      <h2 id={headingId}>{title}</h2>
      {intro && <div className="review-overview">{intro}</div>}
    </header>
    <div ref={track} className="native-review-grid review-track" role="region" aria-label="Scrollable client reviews" tabIndex={0} onScroll={syncEdges}>
      {items.map(item=><ReviewCard key={item.id} item={item}/>)}
    </div>
    {!(edges.start && edges.end) && <div className="review-scroll-controls">
      <button type="button" aria-label="Previous reviews" disabled={edges.start} onClick={()=>scroll(-1)}><ArrowLeft size={18} aria-hidden="true"/></button>
      <button type="button" aria-label="Next reviews" disabled={edges.end} onClick={()=>scroll(1)}><ArrowRight size={18} aria-hidden="true"/></button>
    </div>}
  </div>;
}

function ReviewCard({item}:{item:ReviewItem}) {
  const [avatarFailed,setAvatarFailed]=React.useState(false);
  const initials=item.name.trim().split(/\s+/).slice(0,2).map(part=>Array.from(part)[0]).join('').toUpperCase();

  return <article className="native-review-card review-card">
    <header className="review-card-author">
      <div className="review-card-avatar">
        {item.avatar && !avatarFailed ? <img src={item.avatar} alt={`Photo of ${item.name}`} loading="lazy" width="44" height="44" onError={()=>setAvatarFailed(true)}/>:<span className="review-avatar-initials" aria-hidden="true">{initials || <Quote size={18}/>}</span>}
      </div>
      <div className="review-card-identity"><h3>{item.name}</h3>{item.meta && <div className="review-card-meta">{item.meta}</div>}</div>
      <Quote className="review-card-mark" size={22} strokeWidth={1.5} aria-hidden="true"/>
    </header>
    <div className="review-card-rating">
      {item.ratingVisual}
      <span className="review-card-score" aria-hidden="true">{item.rating}<span> / 5</span></span>
    </div>
    <blockquote className="review-card-quote">{item.quote}</blockquote>
    {item.details && <div className="review-card-details">{item.details}</div>}
  </article>;
}
