import {useRef,useState} from 'react';
export function useInquiry() {
  const [pending,setPending]=useState(false);
  const [error,setError]=useState('');
  const attempt=useRef(null), busy=useRef(false);
  async function submit(body) {
    if(busy.current) return false;
    const payload=JSON.stringify(body);
    if(attempt.current?.payload!==payload) attempt.current={payload,key:crypto.randomUUID()};
    busy.current=true;setPending(true);setError('');
    try {
      const response=await fetch('/api/inquiries',{
        method:'POST',headers:{'content-type':'application/json','idempotency-key':attempt.current.key},
        body:payload,cache:'no-store',signal:AbortSignal.timeout(35000),
      });
      const result=await response.json();
      if(!response.ok || result.ok!==true) throw Error(result.message || 'Delivery could not be confirmed. Please retry.');
      attempt.current=null;return true;
    } catch(err) {setError(err.name==='TimeoutError' ? 'Delivery could not be confirmed. Please retry.' : err.message || 'Your enquiry could not be sent. Please retry.');return false;}
    finally {busy.current=false;setPending(false);}
  }
  return {submit,pending,error};
}
