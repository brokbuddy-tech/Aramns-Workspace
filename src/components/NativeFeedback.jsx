import {readFeedbackJson as readJson} from '../lib/feedback-config.mjs';
import React, {useEffect, useRef, useState} from 'react';
import {Maximize2, RefreshCw, SkipBack, SkipForward, X} from 'lucide-react';
import './NativeFeedback.css';
const labels=['Very unhappy','Unhappy','Neutral','Happy','Very happy'];
const faces=['😞','🙁','😐','🙂','😄'];

function usePublishedFeed(kind,enabled,revision) {
  const [page,setPage]=useState(1);
  const [state,setState]=useState({data:null,loading:true,error:''});
  useEffect(()=>{
    if (!enabled) return;
    const abort=new AbortController();
    setState({data:null,loading:true,error:''});
    readJson(`/api/feedback?kind=${kind}&page=${page}&pageSize=12`,{signal:abort.signal})
      .then(({data})=>setState({data,loading:false,error:''}))
      .catch(error=>{if(!abort.signal.aborted) setState({data:null,loading:false,error:error.message});});
    return ()=>abort.abort();
  },[kind,enabled,page,revision]);
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
    {videoError && <p role="alert">This video is unavailable. Please close the viewer and refresh the testimonials.</p>}
    <div className="native-reel-navigation"><button type="button" aria-label="Previous video" disabled={index===0} onClick={()=>move(index-1)}><SkipBack size={20} aria-hidden="true"/></button><button type="button" aria-label="Next video" disabled={index===items.length-1} onClick={()=>move(index+1)}><SkipForward size={20} aria-hidden="true"/></button></div>
  </dialog>;
}
export default function NativeFeedback({config,onRefresh}) {
  const [revision,setRevision]=useState(0),[videoIndex,setVideoIndex]=useState(null);
  const reviews=usePublishedFeed('REVIEW',config?.enabled,revision),videos=usePublishedFeed('VIDEO',config?.enabled,revision);
  const refresh=()=>{setVideoIndex(null);setRevision(value=>value+1);onRefresh?.();};
  const summary=reviews.data?.ratingSummary;
  if(!config?.enabled) return null;
  return <section id="testimonials" className="native-feedback" aria-labelledby="native-feedback-title">
    <header className="native-feedback-heading"><h2 id="native-feedback-title">Selected client reviews</h2>
      <div className="native-form-actions"><button type="button" className="native-refresh" aria-label="Refresh reviews" onClick={refresh}><RefreshCw size={17} aria-hidden="true"/><span>Refresh reviews</span></button></div>
    </header>
      {reviews.data && <div className="native-summary"><div className="native-score">{summary?.average!=null ? <><strong>{summary.average.toFixed(1)} <span>/ 5</span></strong>{summary.count!=null && <span>{summary.count} {summary.count===1 ? 'review':'reviews'}</span>}</>:'No native rating available.'}</div>
        <div className="native-disclosure">{reviews.data.disclosure && <p>{reviews.data.disclosure}</p>}</div></div>}
      {reviews.loading && <p role="status">Loading client reviews…</p>}{reviews.error && <p className="native-error" role="alert">{reviews.error}</p>}
      {reviews.data && !reviews.data.items.length && <p>No published client reviews yet.</p>}
      <div className="native-review-grid">{reviews.data?.items.map(item=><article key={item.id} className="native-review-card">
        <div className="native-review-author"><img loading="lazy" src={item.avatarUrl} alt={`Photo of ${item.name}`} width="56" height="56"/><div><h3>{item.name}</h3><PublishedDate item={item}/></div></div>
        <p className="native-published-rating" aria-label={`${item.rating} out of 5, ${labels[item.rating-1]}`}><span aria-hidden="true">{faces[item.rating-1]}</span> {item.rating} / 5</p>
        <p className="native-review-text">{item.message}</p>{config.scope==='agency' && item.creditedBrokerName && <p>Broker mentioned: {item.creditedBrokerName}</p>}<BusinessReply response={item.response}/>
      </article>)}</div>
      {reviews.data && <Pagination feed={reviews} label="Client reviews"/>}
      <div className="native-video-heading"><h3>Video testimonials</h3>{videos.data?.disclosure && videos.data.disclosure!==reviews.data?.disclosure && <p>{videos.data.disclosure}</p>}</div>
      {videos.loading && <p role="status">Loading video testimonials…</p>}{videos.error && <p role="alert" className="native-error">{videos.error}</p>}
      {videos.data && !videos.data.items.length && <p>No published video testimonials yet.</p>}
      <div className="native-video-grid">{videos.data?.items.map((item,index)=><VideoCard key={item.id} item={item} onOpen={()=>setVideoIndex(index)}/>)}</div>
      {videos.data && <Pagination feed={videos} label="Video testimonials"/>}
      {videoIndex!==null && videos.data?.items[videoIndex] && <VideoViewer items={videos.data.items} index={videoIndex} onIndex={setVideoIndex} onClose={()=>setVideoIndex(null)}/>}
  </section>;
}
