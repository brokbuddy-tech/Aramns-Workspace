import {useEffect,useState} from 'react';
import {setProperties} from '../data/properties';
import {setAgents} from '../data/agents';
export function useBrokerFeed(path) {
  const [state,setState]=useState({path:null,status:'loading',detail:null});
  const [revision,setRevision]=useState(0);
  useEffect(()=>{
    const refresh=()=>{if(!document.hidden) setRevision(v=>v+1);};
    window.addEventListener('focus',refresh);
    window.addEventListener('pageshow',refresh);
    const timer=setInterval(refresh,60000);
    return ()=>{window.removeEventListener('focus',refresh);window.removeEventListener('pageshow',refresh);clearInterval(timer);};
  },[]);
  useEffect(()=>{
    const controller=new AbortController();
    setState(previous => previous.path === path && previous.status === 'ready' ? previous : {path,status:'loading',detail:null});
    const match=path.match(/^\/(?:property|properties)\/([^/]+)\/?$/);
    const id=match && !['buy','rent','off-plan','commercial','map','all'].includes(match[1]) ? match[1] : null;
    const timer=setTimeout(()=>controller.abort(),45000);
    fetch('/api/site'+(id ? '?listingId='+encodeURIComponent(id):''),{cache:'no-store',signal:controller.signal})
      .then(async response=>{if(!response.ok) throw Error();return response.json();})
      .then(data=>{
        if (controller.signal.aborted) return;
        if(!data.agent?.id || !Array.isArray(data.properties)) throw Error();
        setAgents([data.agent]);setProperties(data.properties);
        setState({path,status:'ready',detail:data.selectedProperty,quickLinkClicks:data.quickLinkClicks || []});
      })
      .catch(()=>{if(!controller.signal.aborted || !controller.signal.reason?.superseded) {setAgents([]);setProperties([]);setState({path,status:'error',detail:null});}})
      .finally(()=>clearTimeout(timer));
    return ()=>{clearTimeout(timer);controller.abort({superseded:true});};
  },[path,revision]);
  return state.path===path ? state : {status:'loading',detail:null};
}
