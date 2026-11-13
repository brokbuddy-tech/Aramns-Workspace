import {randomUUID} from 'node:crypto';
import {PublicError} from './brokbuddy.mjs';
import {getPublicMapsConfig} from './maps.mjs';
const message = 'We could not send your enquiry. Please try again.';
export function validateInquiry(value) {
  if(!value || typeof value!=='object' || Array.isArray(value)) throw new PublicError(400,'Please check your enquiry.');
  const allowed=['name','email','phone','message','listingId','budget','propertyType'];
  if(Object.keys(value).some(key=>!allowed.includes(key))) throw new PublicError(400,'Please check your enquiry.');
  const body={};
  for(const [key,min,max] of [['name',2,120],['message',10,4000],['email',0,254],['phone',0,40],['listingId',1,120],['propertyType',0,120]]) {
    if(value[key]===undefined && !['name','message'].includes(key)) continue;
    if(typeof value[key]!=='string' || value[key].trim().length<min || value[key].trim().length>max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value[key])) throw new PublicError(400,'Please check your name, contact details and message (10–4000 characters).');
    body[key]=value[key].trim();
  }
  if(body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) throw new PublicError(400,'Please enter a valid email address.');
  if(!body.email && !body.phone) throw new PublicError(400,'Please provide an email address or phone number.');
  if(value.budget!==undefined) {
    if(typeof value.budget!=='number' || !Number.isFinite(value.budget) || value.budget<0 || value.budget>1_000_000_000_000) throw new PublicError(400,'Please check your budget.');
    body.budget=value.budget;
  }
  return body;
}
export function createApiHandler(client, env = process.env) {
  return async (req,res) => {
    const responseHeaders={};
    const send=(status,data)=>{res.writeHead(status,{...responseHeaders,'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin'}); res.end(JSON.stringify(data));};
    try {
      const url=new URL(req.url,'http://localhost');
      if (url.pathname === '/api/maps-config') {
        if (req.method !== 'GET') return send(405, {message: 'Method not allowed.'});
        if (url.search) return send(400, {message: 'Invalid request.'});
        return send(200, getPublicMapsConfig(env));
      }
      const cookies = String(req.headers.cookie || '').split(';').map(value=>value.trim());
      let visitorId = cookies.find(value=>value.startsWith('bb_visitor='))?.slice('bb_visitor='.length);
      const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if(req.method==='GET' && url.pathname==='/api/site') {
        const keys=[...url.searchParams.keys()];
        if(keys.some(k=>k!=='listingId') || url.searchParams.getAll('listingId').length>1) throw new PublicError(400,'Invalid request.');
        return send(200,await client.site(url.searchParams.get('listingId')));
      }
      const visitorBootstrap=url.pathname==='/api/visitor';
      const viewMatch=url.pathname.match(/^\/api\/property-views\/([A-Za-z0-9_-]{1,120})$/);
      if(url.pathname!=='/api/inquiries' && !viewMatch && !visitorBootstrap) return send(404,{message:'Not found.'});
      if(req.method!=='POST') return send(405,{message:'Method not allowed.'});
      // Host is the same public host used for this request. Do not trust forwarded
      // origin/host headers; the reverse proxy must preserve Host and terminate TLS.
      let origin;
      try {origin=new URL(req.headers.origin);} catch {throw new PublicError(403,'Request origin is not allowed.');}
      if(!['http:','https:'].includes(origin.protocol) || origin.host!==req.headers.host || origin.origin!==req.headers.origin || ['cross-site','none'].includes(req.headers['sec-fetch-site'])) throw new PublicError(403,'Request origin is not allowed.');
      if(!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) throw new PublicError(415,'Please send a JSON enquiry.');
      if(Number(req.headers['content-length'])>16384) throw new PublicError(413,'Your message is too large.');
      const key=req.headers['idempotency-key'];
      if(!viewMatch && !visitorBootstrap && (typeof key!=='string' || !/^[A-Za-z0-9_-]{16,120}$/.test(key))) throw new PublicError(400,'Please retry your enquiry.');
      const chunks=[];let size=0;
      for await(const chunk of req) {size+=chunk.length; if(size>16384) throw new PublicError(413,'Your message is too large.');chunks.push(chunk);}
      let raw; try {raw=JSON.parse(Buffer.concat(chunks).toString('utf8'));} catch {throw new PublicError(400,'Please check your enquiry.');}
      if (visitorBootstrap) {
        if (url.search || !raw || typeof raw!=='object' || Array.isArray(raw) || Object.keys(raw).length) throw new PublicError(400,'Invalid visitor request.');
        if (!uuid.test(visitorId || '')) {
          visitorId=randomUUID();
          responseHeaders['set-cookie']=`bb_visitor=${visitorId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${env.NODE_ENV==='production' || req.socket?.encrypted ? '; Secure':''}`;
        }
        return send(200,{ok:true});
      }
      if (viewMatch) {
        if (url.search || !raw || typeof raw!=='object' || Array.isArray(raw) || Object.keys(raw).some(key=>key!=='visibleDurationMs') || !Number.isInteger(raw.visibleDurationMs) || raw.visibleDurationMs<2000 || raw.visibleDurationMs>86400000 || !uuid.test(visitorId || '')) throw new PublicError(400,'Invalid property view.');
        const preview=Boolean(req.headers.authorization || cookies.some(value=>value.startsWith('accessToken=') || value.startsWith('adminAccessToken=')));
        await client.recordView(viewMatch[1],{visitorId,visibleDurationMs:raw.visibleDurationMs},{userAgent:String(req.headers['user-agent'] || '').slice(0,1024),preview});
        return send(200,{ok:true});
      }
      const body=validateInquiry(raw);
      return send(200,await client.inquire(body,key));
    } catch(error) {
      // Never serialize upstream errors, URLs, headers or configuration.
      return send(error instanceof PublicError ? error.status : 503,{message:error instanceof PublicError ? error.message : message});
    }
  };
}
