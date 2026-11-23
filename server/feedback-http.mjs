import {createHash} from 'node:crypto';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {PublicError} from './brokbuddy.mjs';
const MAX_BODY = 2_850_000; // 2 MiB base64 + bounded review metadata, before JSON decoding.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fail = message => {throw new PublicError(400,message);};
export function validateFeedback(value, config) {
  if (!value || typeof value!=='object' || Array.isArray(value) || Object.keys(value).some(k=>!['submissionKey','name','rating','message','avatar','creditedBrokerId','consent'].includes(k))) fail('Please check your review.');
  if (typeof value.submissionKey!=='string' || !UUID.test(value.submissionKey)) fail('Please reset the form and try again.');
  if (typeof value.name!=='string' || value.name.trim().length<2 || value.name.trim().length>100 || /[\r\n\u0000-\u001f\u007f]/u.test(value.name)) fail('Please enter a name between 2 and 100 characters.');
  if (!Number.isInteger(value.rating) || value.rating<1 || value.rating>5) fail('Choose a rating from 1 to 5.');
  if (typeof value.message!=='string' || value.message.trim().length<10 || value.message.trim().length>3000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value.message)) fail('Write a review between 10 and 3000 characters.');
  if (value.consent!==true) fail('Please consent to publication after moderation.');
  const avatar=value.avatar;
  if (!avatar || typeof avatar!=='object' || Array.isArray(avatar) || Object.keys(avatar).some(k=>!['mimeType','dataBase64'].includes(k)) || !['image/jpeg','image/png','image/webp'].includes(avatar.mimeType) || !config.avatarMimeTypes.includes(avatar.mimeType)) fail('Choose a JPEG, PNG or WebP photo.');
  if (typeof avatar.dataBase64!=='string' || !avatar.dataBase64 || avatar.dataBase64.length>4*Math.ceil(config.avatarMaxBytes/3) || avatar.dataBase64.length%4!==0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(avatar.dataBase64)) fail('Please choose a valid photo, at most 2 MB.');
  const bytes=Buffer.from(avatar.dataBase64,'base64');
  if (bytes.toString('base64')!==avatar.dataBase64) fail('Please choose a valid photo.');
  if (bytes.length>config.avatarMaxBytes) throw new PublicError(413,'Your photo must be at most 2 MB.');
  // Full safe decoding/cropping remains upstream; reject obvious MIME disguises here.
  const signature = avatar.mimeType==='image/jpeg' ? bytes[0]===255 && bytes[1]===216 && bytes[2]===255
    : avatar.mimeType==='image/png' ? bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
    : bytes.toString('ascii',0,4)==='RIFF' && bytes.toString('ascii',8,12)==='WEBP';
  if (!signature) fail('The photo does not match its JPEG, PNG or WebP format.');
  const body={submissionKey:value.submissionKey,name:value.name.trim(),rating:value.rating,message:value.message.trim(),avatar:{mimeType:avatar.mimeType,dataBase64:avatar.dataBase64},consent:true};
  if (value.creditedBrokerId!=null && (config.scope!=='agency' || !config.brokerCreditEnabled || typeof value.creditedBrokerId!=='string' || !config.brokers.some(b=>b.id===value.creditedBrokerId))) fail('Choose a broker from this website’s list, or leave it blank.');
  if (config.scope==='agency') body.creditedBrokerId=value.creditedBrokerId ?? null;
  return body;
}
// Per-process bounded limiter. An IP bucket cannot be bypassed by clearing cookies
// or supplying X-Forwarded-For. State is local to this Node process.
export function createFeedbackLimiter({now=Date.now,maxVisitors=10000}={}) {
  const visitors=new Map();
  return (visitor,key) => {
    const time=now();
    for (const [id,bucket] of visitors) if (bucket.until<=time) visitors.delete(id);
    const id=createHash('sha256').update(visitor).digest('hex');
    let bucket=visitors.get(id);
    if (!bucket) {
      if (visitors.size>=maxVisitors) throw new PublicError(429,'Too many review requests. Please try again later.');
      bucket={until:time+3600000,keys:new Set(),attempts:0};visitors.set(id,bucket);
    }
    if (++bucket.attempts>30 || !bucket.keys.has(key) && bucket.keys.size>=3) throw new PublicError(429,'You can submit up to 3 reviews per hour. Please try again later.');
    bucket.keys.add(key);
  };
}
export function createFeedbackHandler(client, env, containsCredential) {
  const limit=createFeedbackLimiter();
  return async (req,res,url) => {
    const headers={'cache-control':'no-store','cdn-cache-control':'no-store','vercel-cdn-cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'same-origin'};
    const send=(status,data)=>{
      if (containsCredential(data)) {status=503;data={message:'Client reviews are temporarily unavailable.'};}
      res.writeHead(status,{...headers,'content-type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));
    };
    try {
      const configPath=url.pathname==='/api/feedback/config';
      const feedPath=url.pathname==='/api/feedback';
      const media=url.pathname.match(/^\/api\/feedback\/([A-Za-z0-9_-]{1,120})\/(avatar|video)$/);
      if (!configPath && !feedPath && !media) return send(404,{message:'Not found.'});
      if (req.method==='GET') {
        if (media) {
          if (url.search || req.headers.range && !/^bytes=(?:\d+-\d*|-\d+)$/.test(req.headers.range)) throw new PublicError(400,'Invalid media request.');
          const response=await client.media(media[1],media[2],req.headers.range);
          for (const name of ['content-type','content-length','content-range','accept-ranges']) {
            const value=response.headers.get(name);if(value) headers[name]=value;
          }
          if (response.status===416) {await response.body?.cancel();headers['content-length']='0';res.writeHead(416,headers);res.end();return;}
          res.writeHead(response.status,headers);
          if (response.body) await pipeline(Readable.fromWeb(response.body),res); else res.end();
          return;
        }
        if (configPath) {
          if (url.search) throw new PublicError(400,'Invalid request.');
          return send(200,await client.config());
        }
        const params=url.searchParams;
        if ([...params.keys()].some(k=>!['kind','page','pageSize'].includes(k) || params.getAll(k).length!==1) || !['REVIEW','VIDEO'].includes(params.get('kind')) || !/^[1-9]\d{0,5}$/.test(params.get('page') || '1') || !/^(?:[1-9]|1[0-2])$/.test(params.get('pageSize') || '12')) throw new PublicError(400,'Invalid review page.');
        return send(200,await client.feed({kind:params.get('kind'),page:Number(params.get('page') || 1),pageSize:Number(params.get('pageSize') || 12)}));
      }
      if (req.method!=='POST' || !feedPath) return send(405,{message:'Method not allowed.'});
      if (url.search) throw new PublicError(400,'Invalid request.');
      let origin;
      try {origin=new URL(req.headers.origin);} catch {throw new PublicError(403,'Request origin is not allowed.');}
      if (!['http:','https:'].includes(origin.protocol) || origin.origin!==req.headers.origin || origin.host!==req.headers.host || ['cross-site','none'].includes(req.headers['sec-fetch-site']) || env.BROKBUDDY_FEEDBACK_WEBSITE_ORIGIN && origin.origin!==env.BROKBUDDY_FEEDBACK_WEBSITE_ORIGIN) throw new PublicError(403,'Request origin is not allowed.');
      if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) throw new PublicError(415,'Please send a JSON review.');
      if (Number(req.headers['content-length'])>MAX_BODY) throw new PublicError(413,'Your photo and review are too large. The photo limit is 2 MB.');
      const chunks=[];let size=0;
      for await (const chunk of req) {
        size+=chunk.length;if(size>MAX_BODY) throw new PublicError(413,'Your photo and review are too large. The photo limit is 2 MB.');
        chunks.push(chunk);
      }
      let raw;try {raw=JSON.parse(Buffer.concat(chunks).toString('utf8'));} catch {throw new PublicError(400,'Please check your review.');}
      if (containsCredential(raw)) throw new PublicError(400,'Please check your review.');
      if (typeof raw?.submissionKey!=='string' || !UUID.test(raw.submissionKey)) throw new PublicError(400,'Please reset the form and try again.');
      limit(req.socket?.remoteAddress || 'unknown-visitor',raw.submissionKey);
      const config=await client.config(); // Fresh enabled state and agency membership on every attempt.
      const body=validateFeedback(raw,config);
      return send(202,await client.submit(body));
    } catch(error) {
      if (res.headersSent) {res.destroy();return;}
      if (error.status===429) headers['retry-after']='3600';
      return send(error instanceof PublicError ? error.status:503,error instanceof PublicError ? error.feedbackBody || {message:error.message}:{message:'Client reviews are temporarily unavailable. Please try again.'});
    }
  };
}
