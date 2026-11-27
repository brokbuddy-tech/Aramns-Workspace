import React, {useEffect,useRef,useState} from 'react';
import {ArrowLeft,Camera,Check} from 'lucide-react';
import {readFeedbackJson as readJson} from '../lib/feedback-config.mjs';
import RatingEmoji, {RATING_LABELS as labels} from './RatingEmoji';
import './NativeFeedback.css';
const successMessage='Thank you. Your review has been submitted for review.';
export default function ReviewForm({config,available=true,onClose,onUnavailable}) {
  const fileInput=useRef(null),pendingRef=useRef(false),key=useRef(null);
  const [name,setName]=useState(''),[rating,setRating]=useState(0),[message,setMessage]=useState('');
  const [photo,setPhoto]=useState(null),[preview,setPreview]=useState(''),[consent,setConsent]=useState(false);
  const [broker,setBroker]=useState(''),[search,setSearch]=useState(''),[error,setError]=useState('');
  const [pending,setPending]=useState(false),[success,setSuccess]=useState(false);
  useEffect(()=>{if(!key.current) key.current=crypto.randomUUID();},[]);
  useEffect(()=>{
    if (!photo) {setPreview('');return;}
    const url=URL.createObjectURL(photo);setPreview(url);
    return ()=>URL.revokeObjectURL(url);
  },[photo]);
  const reset=()=>{
    setName('');setRating(0);setMessage('');setPhoto(null);setConsent(false);setBroker('');setSearch('');setError('');setSuccess(false);
    if(fileInput.current) fileInput.current.value='';
    key.current=crypto.randomUUID();
  };
  const choosePhoto=event=>{
    const file=event.target.files?.[0];
    if(!file) return;
    setError('');setPhoto(null);
    if (!config.avatarMimeTypes.includes(file.type) || !['image/jpeg','image/png','image/webp'].includes(file.type)) {setError('Choose a JPEG, PNG or WebP photo. SVG and GIF are not supported.');event.target.value='';return;}
    if (file.size>config.avatarMaxBytes || !file.size) {setError('Choose a photo at most 2 MB.');event.target.value='';return;}
    // The server safely decodes the image. Client MIME and size checks are for feedback.
    setPhoto(file);
  };
  const submit=async event=>{
    event.preventDefault();if(pendingRef.current || !available) return;
    setError('');
    if(!photo) {setError('Choose a JPEG, PNG or WebP reviewer photo, at most 2 MB.');return;}
    if(name.trim().length<2 || name.trim().length>100) {setError('Please enter a name between 2 and 100 characters.');return;}
    if(!Number.isInteger(rating) || rating<1 || rating>5) {setError('Choose a rating from 1 to 5.');return;}
    if(message.trim().length<10 || message.trim().length>3000) {setError('Write a review between 10 and 3000 characters.');return;}
    if(!consent) {setError('Please consent to publication after moderation.');return;}
    pendingRef.current=true;setPending(true);
    try {
      const dataBase64=await new Promise((resolve,reject)=>{
        const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(new Error('Unable to read this photo. Please choose it again.'));reader.readAsDataURL(photo);
      });
      const body={submissionKey:key.current,name:name.trim(),rating,message:message.trim(),avatar:{mimeType:photo.type,dataBase64},consent:true,
        ...(config.scope==='agency' ? {creditedBrokerId:broker || null}:{})};
      const result=await readJson('/api/feedback',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
      if(result.status!==202) throw new Error('Receipt could not be confirmed. Please retry your review.');
      reset();setSuccess(true);
    } catch (error) {setError(error.message || 'Unable to send your review. Please try again.');if(error.status>=500 || error.disabled) onUnavailable?.();}
    finally {pendingRef.current=false;setPending(false);}
  };
  return <section className="native-review-form native-form-dialog" aria-labelledby="native-review-title">
    <div className="native-dialog-heading"><div><span className="native-eyebrow">YOUR EXPERIENCE</span><h1 id="native-review-title">Write a review</h1></div><button className="native-icon-button" type="button" aria-label="Back to profile" disabled={pending} onClick={onClose}><ArrowLeft size={20} aria-hidden="true"/></button></div>
    {success ? <div className="native-success"><p role="status">{successMessage}</p><button type="button" onClick={()=>{setSuccess(false);onClose();}}>Done</button></div>:
    <form aria-label="Write a review" onSubmit={submit}>
      <p className="native-form-intro">{config.moderationText || 'Your review will be reviewed before publication.'}</p>
      <fieldset disabled={pending || !available} className="native-form-fields">
        <div className="native-photo-field">
          <label htmlFor="native-photo">Reviewer photo (required)</label>
          <div className="native-upload-zone">
            {preview ? <img className="native-photo-preview" src={preview} alt="Your selected reviewer photo" onError={()=>{setError('This photo could not be opened. Please choose a different JPEG, PNG or WebP.');setPhoto(null);if(fileInput.current) fileInput.current.value='';}}/>:<span className="native-upload-icon"><Camera size={24} aria-hidden="true"/></span>}
            <div className="native-upload-copy"><strong>{photo ? 'Change your photo':'Add your photo'}</strong><span>{photo ? photo.name:'Browse photos'}</span></div>
            <input ref={fileInput} id="native-photo" type="file" accept="image/jpeg,image/png,image/webp" required onChange={choosePhoto} aria-describedby="native-photo-help"/>
          </div>
          <small id="native-photo-help">JPEG, PNG or WebP · Up to 2 MB · Cropped to a square</small>
        </div>
        <div className="native-field"><label htmlFor="native-name">Name (required)</label><input id="native-name" autoComplete="name" required minLength={2} maxLength={100} placeholder="Your full name" value={name} onChange={e=>setName(e.target.value)}/></div>
        <fieldset className="native-rating"><legend>Your rating (required)</legend><div className="native-faces">
          {labels.map((label,index)=><label key={label} className={rating===index+1 ? 'selected':''}>
            <input type="radio" name="native-rating" value={index+1} required checked={rating===index+1} onChange={()=>setRating(index+1)} aria-label={`${index+1} ${label}`}/>
            <RatingEmoji rating={index+1} className="native-face"/><span className="native-rating-label">{index+1} {label}</span><Check className="native-rating-check" size={18} aria-hidden="true"/>
          </label>)}
        </div></fieldset>
        <div className="native-field"><label htmlFor="native-message">Your review (required)</label><textarea id="native-message" required minLength={10} maxLength={config.messageMaxLength} rows={5} placeholder="Tell us about your experience…" value={message} onChange={e=>setMessage(e.target.value)} aria-describedby="native-message-help"/>
        <small id="native-message-help">{message.length} / {config.messageMaxLength} characters · At least 10</small></div>
        {config.scope==='agency' && config.brokerCreditEnabled && <div className="native-broker-picker">
          <label htmlFor="native-broker-search">Broker you'd like to mention (optional)</label>
          <input id="native-broker-search" type="search" placeholder="Search broker names" value={search} onChange={e=>setSearch(e.target.value)}/>
          <label htmlFor="native-broker">Choose a broker</label><select id="native-broker" value={broker} onChange={e=>setBroker(e.target.value)}>
            <option value="">No broker mentioned</option>{config.brokers.filter(b=>b.id===broker || b.name.toLocaleLowerCase().includes(search.toLocaleLowerCase())).map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
          </select>{broker && <button type="button" onClick={()=>{setBroker('');setSearch('');}}>Clear broker</button>}
        </div>}
        <label className="native-consent"><input type="checkbox" required checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>I consent to my name, photo and review being published on this website after moderation.</span></label>
      </fieldset>
      {error && <p role="alert" className="native-error">{error}</p>}
      <div className="native-form-actions native-submit-actions"><button type="button" disabled={pending} onClick={reset}>Reset form</button><button type="submit" className="native-primary" disabled={pending || !available}>{pending ? 'Submitting…':'Submit review'}</button></div>
    </form>}
  </section>;
}
