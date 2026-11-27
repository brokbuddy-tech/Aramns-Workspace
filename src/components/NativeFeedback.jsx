import {readFeedbackJson as readJson} from '../lib/feedback-config.mjs';
import React, {useEffect, useRef, useState} from 'react';
import {Maximize2, SkipBack, SkipForward, X} from 'lucide-react';
import RatingEmoji, {RATING_LABELS as labels} from './RatingEmoji';
import {ReviewSection} from './ui/review-section';
import './NativeFeedback.css';

function usePublishedFeed(kind,enabled) {
  const [page,setPage]=useState(1);
  const [state,setState]=useState({data:null,loading:true,error:''});
  useEffect(()=>{
    if (!enabled) return;
    const abort=new AbortController();
    setState(previous=>({...previous,loading:true,error:''}));
    readJson(`/api/feedback?kind=${kind}&page=${page}&pageSize=12`,{signal:abort.signal})
      .then(({data})=>setState({data,loading:false,error:''}))
      .catch(error=>{if(!abort.signal.aborted) setState({data:null,loading:false,error:error.message});});
    return ()=>abort.abort();
  },[kind,enabled,page]);
  return {...state,page,setPage};
}
function PublishedDate({item}) {
  const date=new Date(item.publishedAt || item.createdAt);
  return Number.isNaN(date.getTime()) ? null:<time dateTime={date.toISOString()}>{date.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'})}</time>;
}
function BusinessReply({response}) {
  return response ? <aside className="native-reply"><strong>Business reply</strong><p>{response}</p></aside>:null;
}
function Pagination({feed,label}) {
  if(feed.page===1 && !feed.data?.hasMore) return null;
  return <nav className="native-pagination" aria-label={`${label} pages`}>
    <button type="button" disabled={feed.loading || feed.page<=1} onClick={()=>feed.setPage(feed.page-1)}>Previous</button>
    <span>Page {feed.page}</span>
    <button type="button" disabled={feed.loading || !feed.data?.hasMore} onClick={()=>feed.setPage(feed.page+1)}>Next</button>
  </nav>;
}

function pauseOtherVideos(current) {
  document.querySelectorAll('.native-video-card video, .native-video-dialog video').forEach(player=>{if(player!==current) player.pause();});
}
function VideoCard({item,onOpen}) {
  const video=useRef(null);
  const [failed,setFailed]=useState(false);
  useEffect(()=>{
    const player=video.current;
    const pause=()=>player?.pause();
    const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>!entry.isIntersecting)) pause();});
    if(player) observer.observe(player);
    const visibility=()=>{if(document.hidden) pause();};
    document.addEventListener('visibilitychange',visibility);
    return ()=>{pause();observer.disconnect();document.removeEventListener('visibilitychange',visibility);};
  },[]);
  return <article className="native-video-card">
    <video ref={video} controls playsInline preload="none" poster={item.avatarUrl} src={item.videoUrl} aria-label={`Video testimonial from ${item.name}`} onPlay={event=>pauseOtherVideos(event.currentTarget)} onError={()=>setFailed(true)}/>
    <button className="native-expand-video" type="button" onClick={()=>{pauseOtherVideos(null);onOpen();}} aria-label={`Watch testimonial from ${item.name}`} title="Expand video"><Maximize2 size={19} aria-hidden="true"/></button>
    {failed && <p role="alert">Video unavailable.</p>}
  </article>;
}
function VideoViewer({items,index,onIndex,onClose}) {
  const dialog=useRef(null),video=useRef(null);
  const item=items[index];
  const [videoError,setVideoError]=useState(false);
  useEffect(()=>setVideoError(false),[index]);
  useEffect(()=>{dialog.current?.showModal();return ()=>{video.current?.pause();};},[]);
  useEffect(()=>{
    const player=video.current;
    const pause=()=>player?.pause();
    const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>!entry.isIntersecting)) pause();});
    if(player) observer.observe(player);
    const visibility=()=>{if(document.hidden) pause();};
    document.addEventListener('visibilitychange',visibility);
    return ()=>{pause();observer.disconnect();document.removeEventListener('visibilitychange',visibility);};
  },[index]);
  const move=next=>{video.current?.pause();onIndex(next);};
  const close=()=>{video.current?.pause();onClose();};
  return <dialog ref={dialog} className="native-dialog native-video-dialog" aria-labelledby="native-video-title" onCancel={close} onClose={close} onKeyDown={e=>{
    // Leave native video controls' seeking/volume keyboard behavior intact.
    if(e.target.tagName==='VIDEO') return;
    if(e.key==='ArrowRight' && index<items.length-1) {e.preventDefault();move(index+1);}
    if(e.key==='ArrowLeft' && index>0) {e.preventDefault();move(index-1);}
  }}>
    <h2 id="native-video-title" className="sr-only">{item.name}</h2><button className="native-close-video" type="button" aria-label="Close video" onClick={close}><X size={22} aria-hidden="true"/></button>
    <video key={item.id} ref={video} controls playsInline preload="metadata" src={item.videoUrl} aria-label={`Video testimonial from ${item.name}`} onPlay={event=>pauseOtherVideos(event.currentTarget)} onError={()=>setVideoError(true)}/>
    {videoError && <p role="alert">This video is unavailable. Please close the viewer and reload the page.</p>}
    <div className="native-reel-navigation"><button type="button" aria-label="Previous video" disabled={index===0} onClick={()=>move(index-1)}><SkipBack size={20} aria-hidden="true"/></button><button type="button" aria-label="Next video" disabled={index===items.length-1} onClick={()=>move(index+1)}><SkipForward size={20} aria-hidden="true"/></button></div>
  </dialog>;
}
export default function NativeFeedback({config}) {
  const [videoIndex,setVideoIndex]=useState(null);
  const reviews=usePublishedFeed('REVIEW',config?.enabled),videos=usePublishedFeed('VIDEO',config?.enabled);
  const summary=reviews.data?.ratingSummary;
  const hasReviews=Boolean(reviews.data?.items.length),hasTestimonials=Boolean(videos.data?.items.length);
  if(!config?.enabled || !hasReviews && !hasTestimonials) return null;
  return <section id="testimonials" className={`native-feedback${hasReviews && !hasTestimonials ? ' native-feedback-reviews-only':''}`} aria-labelledby={hasReviews ? 'native-feedback-title':'native-testimonials-title'}>
    {hasReviews && <section className="native-reviews" aria-labelledby="native-feedback-title">
      <ReviewSection key={reviews.data.page} title="Reviews" headingId="native-feedback-title"
        intro={summary?.average!=null && <div className="native-summary"><div className="native-score"><strong>{summary.average.toFixed(1)} <span>/ 5</span></strong>{summary.count!=null && <span>{summary.count} {summary.count===1 ? 'review':'reviews'}</span>}</div></div>}
        items={reviews.data.items.map(item=>({
          id:item.id,name:item.name,meta:<PublishedDate item={item}/>,avatar:item.avatarUrl,quote:item.message,rating:item.rating,
          ratingVisual:<div className="review-rating" role="img" aria-label={`${item.rating} out of 5, ${labels[item.rating-1]}`}>
            {Array.from({length:item.rating},(_,index)=><span key={index} className="review-rating-slot" aria-hidden="true">
              <RatingEmoji rating={item.rating} className="native-review-emoji"/>
            </span>)}
          </div>,
          details:<>{config.scope==='agency' && item.creditedBrokerName && <p className="native-review-credit">Broker mentioned: {item.creditedBrokerName}</p>}<BusinessReply response={item.response}/></>,
        }))}/>
      <Pagination feed={reviews} label="Client reviews"/>
    </section>}
    {hasTestimonials && <section className="native-testimonials" aria-labelledby="native-testimonials-title">
      <header className="native-feedback-heading"><h2 id="native-testimonials-title">Testimonials</h2></header>
      <div className="native-video-grid" role="region" aria-label="Scrollable video testimonials" tabIndex={videos.data?.items.length ? 0 : undefined}>{videos.data?.items.map((item,index)=><VideoCard key={item.id} item={item} onOpen={()=>setVideoIndex(index)}/>)}</div>
      <Pagination feed={videos} label="Video testimonials"/>
      {videoIndex!==null && videos.data?.items[videoIndex] && <VideoViewer items={videos.data.items} index={videoIndex} onIndex={setVideoIndex} onClose={()=>setVideoIndex(null)}/>}
    </section>}
  </section>;
}
