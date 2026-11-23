import {useCallback,useEffect,useState} from 'react';
import {FEEDBACK_UNAVAILABLE,isFeedbackConfigAvailable,readFeedbackJson} from './feedback-config.mjs';

export function useFeedbackAvailability(enabled) {
  const [state,setState]=useState({config:null,loading:false,error:''});
  const [revision,setRevision]=useState(0);
  const refresh=useCallback(()=>setRevision(value=>value+1),[]);
  const markUnavailable=useCallback(()=>setState({config:null,loading:false,error:FEEDBACK_UNAVAILABLE}),[]);

  useEffect(()=>{
    if (!enabled) {setState({config:null,loading:false,error:''});return;}
    let disposed=false,controller,inFlight=false;
    const check=async()=>{
      if(inFlight) return;
      inFlight=true;controller=new AbortController();
      const timeout=setTimeout(()=>controller.abort(),8000);
      setState(previous=>({...previous,loading:true}));
      try {
        const {data}=await readFeedbackJson('/api/feedback/config',{signal:controller.signal});
        if(!isFeedbackConfigAvailable(data)) throw new Error(FEEDBACK_UNAVAILABLE);
        if(!disposed) setState({config:data,loading:false,error:''});
      } catch {
        if(!disposed) setState({config:null,loading:false,error:FEEDBACK_UNAVAILABLE});
      } finally {clearTimeout(timeout);inFlight=false;}
    };
    const checkVisible=()=>{if(!document.hidden) void check();};
    void check();
    const timer=setInterval(checkVisible,30000);
    window.addEventListener('focus',checkVisible);
    window.addEventListener('online',checkVisible);
    document.addEventListener('visibilitychange',checkVisible);
    return ()=>{
      disposed=true;controller?.abort();clearInterval(timer);
      window.removeEventListener('focus',checkVisible);
      window.removeEventListener('online',checkVisible);
      document.removeEventListener('visibilitychange',checkVisible);
    };
  },[enabled,revision]);

  return {...state,available:Boolean(state.config),refresh,markUnavailable};
}
