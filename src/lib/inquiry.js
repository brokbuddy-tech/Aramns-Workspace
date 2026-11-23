import {useRef,useState} from 'react';
export function useInquiry() {
  const [pending,setPending]=useState(false);
  const [error,setError]=useState('');
  const attempt=useRef(null), busy=useRef(false);
  async function submit(body) {
    if(busy.current) return false;
    busy.current=true;setPending(true);setError('');
    let publicMessage='We could not send your enquiry. Please try again.';
    try {
      const payload=JSON.stringify(body);
      if(attempt.current?.payload!==payload) attempt.current={payload,key:crypto.randomUUID()};
      const response=await fetch('/api/inquiries',{
        method:'POST',headers:{'content-type':'application/json','idempotency-key':attempt.current.key},
        body:payload,cache:'no-store',signal:AbortSignal.timeout(35000),
      });
      const result=await response.json();
      if(!result || typeof result!=='object' || Array.isArray(result) || !response.ok || result.ok!==true) {
        if(typeof result?.message==='string' && result.message.trim() && result.message.length<=500 && !/[\u0000-\u001f\u007f]/u.test(result.message)) publicMessage=result.message;
        throw Error();
      }
      attempt.current=null;return true;
    } catch(err) {setError(err.name==='TimeoutError' ? 'Delivery could not be confirmed. Please retry.' : publicMessage);return false;}
    finally {busy.current=false;setPending(false);}
  }
  return {submit,pending,error};
}
