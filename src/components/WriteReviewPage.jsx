import React,{useEffect,useState} from 'react';
import ReviewForm from './ReviewForm';
import './NativeFeedback.css';

export default function WriteReviewPage({feedback,onNavigate}) {
  const [lastConfig,setLastConfig]=useState(feedback.config);
  useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});},[]);
  useEffect(()=>{if(feedback.config) setLastConfig(feedback.config);},[feedback.config]);
  const config=feedback.config || lastConfig;

  return <main className="write-review-page">
    <div className="write-review-content">
      {!feedback.available && <section className="native-review-form review-availability" aria-label="Review availability">
        {!config && <h1>Write a review</h1>}
        <p role={feedback.loading ? 'status':'alert'}>{feedback.loading ? 'Checking review availability…':'Reviews are temporarily unavailable. Please try again in a moment.'}</p>
        <div className="native-form-actions">
          <button type="button" className="native-primary" disabled={feedback.loading} onClick={feedback.refresh}>Check again</button>
          {!config && <button type="button" onClick={()=>onNavigate('/')}>Back to profile</button>}
        </div>
      </section>}
      {config && <ReviewForm config={config} available={feedback.available} onUnavailable={feedback.markUnavailable} onClose={()=>onNavigate('/')}/>}
    </div>
  </main>;
}
