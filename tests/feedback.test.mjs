import {test} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {Readable} from 'node:stream';
import {createBrokerClient} from '../server/brokbuddy.mjs';
import {createFeedbackClient,getFeedbackConfig} from '../server/feedback.mjs';
import {createFeedbackLimiter,validateFeedback} from '../server/feedback-http.mjs';
import {createApiHandler} from '../server/http.mjs';
import {env} from './fixtures.mjs';
import {feedbackConfig,feedbackFeed,submission} from './feedback-fixtures.mjs';
const agencyEnv={...env,BROKBUDDY_FEEDBACK_SCOPE:'agency',BROKBUDDY_AGENCY_SLUG:'test-agency',BROKBUDDY_AGENCY_CODE:'b'.repeat(32)};
const publicConfig={...feedbackConfig,scope:'agency',enabled:true};
function upstream(runtime=env,override) {
 const calls=[];
 const fetchImpl=async (url,options)=>{
  calls.push({url:new URL(url),options});
  if(override) {const response=override(new URL(url),options);if(response) return response;}
  if(String(url).endsWith('/config')) return Response.json(feedbackConfig);
  if(options.method==='POST') return Response.json({submissionId:'private-pending-id'},{status:202});
  return Response.json(feedbackFeed(new URL(url).searchParams.get('kind') || 'REVIEW'));
 };
 return {client:createBrokerClient({env:runtime,fetchImpl}),calls};
}
async function call(handler,{url='/api/feedback',method='POST',body=submission,headers={}}={}) {
 const req=Readable.from([Buffer.from(typeof body==='string' ? body:JSON.stringify(body))]);
 Object.assign(req,{url,method,headers:{host:'website.example',origin:'https://website.example','content-type':'application/json',...headers},socket:{remoteAddress:'192.0.2.1'}});
 let status,result,responseHeaders;
 await handler(req,{writeHead:(s,h)=>{status=s;responseHeaders=h;},end:data=>{result=data ? JSON.parse(data):null;}});
 return {status,body:result,headers:responseHeaders};
}
test('feedback selects separate fixed scopes with no agency fallback and no forwarded Origin',async()=>{
 for(const runtime of [env,agencyEnv]) {
  const {client,calls}=upstream(runtime);const result=await client.feedback.config();
  const agency=runtime===agencyEnv;
  assert.equal(calls[0].url.pathname,agency?'/api/public/agency/test-agency/feedback/config':'/api/public/broker-template/test-broker/feedback/config');
  assert.equal(calls[0].options.headers[agency?'x-brokbuddy-agency-code':'x-brokbuddy-broker-code'],agency?'b'.repeat(32):env.BROKBUDDY_BROKER_CODE);
  assert.equal(calls[0].options.headers.origin,undefined);assert.equal(calls[0].options.redirect,'error');assert.equal(calls[0].options.cache,'no-store');
  assert.equal(result.scope,agency?'agency':'broker');assert.equal(JSON.stringify(result).includes('private@example'),false);assert.equal(result.brokers.length,agency?1:0);
 }
 for(const runtime of [{...agencyEnv,BROKBUDDY_AGENCY_CODE:undefined},{...agencyEnv,BROKBUDDY_AGENCY_SLUG:undefined},{...agencyEnv,BROKBUDDY_FEEDBACK_SCOPE:'invalid'},{...env,BROKBUDDY_BROKER_CODE:undefined,BROKBUDDY_AGENCY_CODE:agencyEnv.BROKBUDDY_AGENCY_CODE}]) assert.throws(()=>getFeedbackConfig(runtime));
});
test('broker config 404 disables native content even for a non-JSON upstream response',async()=>{
 const {client}=upstream(env,()=>new Response('Not found',{status:404}));
 const result=await call(createApiHandler(client,env),{url:'/api/feedback/config',method:'GET'});
 assert.equal(result.status,404);assert.deepEqual(result.body,{enabled:false});
 const agency=upstream(agencyEnv,()=>new Response('Not found',{status:404}));
 const missing=await call(createApiHandler(agency.client,agencyEnv),{url:'/api/feedback/config',method:'GET'});
 assert.equal(missing.status,404);assert.notEqual(missing.body.enabled,false);
});
test('published feeds page on demand, strip private metadata and rewrite fixed media URLs',async()=>{
 const {client,calls}=upstream(agencyEnv);
 for(const kind of ['REVIEW','VIDEO']) {
  const result=await call(createApiHandler(client,agencyEnv),{url:`/api/feedback?kind=${kind}&page=1&pageSize=12`,method:'GET'});
  assert.equal(result.status,200);assert.equal(result.body.items[0].avatarUrl,`/api/feedback/${kind==='REVIEW'?'review':'video'}-1/avatar`);
  if(kind==='VIDEO') assert.equal(result.body.items[0].videoUrl,'/api/feedback/video-1/video');
  assert.equal(JSON.stringify(result).includes('storage.example'),false);assert.equal(result.headers['cache-control'],'no-store');assert.equal(result.body.items[0].response,'Thank you for sharing your experience.');
 }
 assert.equal(calls.length,2);assert.match(calls[0].url.search,/page=1&pageSize=12/);
});
test('same-origin submit validates fresh agency broker membership and independent omission',async()=>{
 for(const runtime of [env,agencyEnv]) {
  const {client,calls}=upstream(runtime);const result=await call(createApiHandler(client,runtime),{body:{...submission,...(runtime===agencyEnv?{creditedBrokerId:'broker-1'}:{})}});
  assert.equal(result.status,202);assert.deepEqual(result.body,{message:'Thank you. Your review has been submitted for review.'});
  const sent=JSON.parse(calls.find(c=>c.options.method==='POST').options.body);
  assert.equal(sent.submissionKey,submission.submissionKey);assert.equal(sent.creditedBrokerId,runtime===agencyEnv?'broker-1':undefined);
  assert.equal(JSON.stringify(result).includes('private-pending-id'),false);
 }
 assert.throws(()=>validateFeedback({...submission,creditedBrokerId:'other-agency'},publicConfig),e=>e.status===400);
 assert.throws(()=>validateFeedback({...submission,creditedBrokerId:'broker-1'},{...publicConfig,scope:'broker'}),e=>e.status===400);
});
test('validation rejects malformed ratings, photos, names, consent, flags and body fields',()=>{
 for(const extra of [{name:'a'},{name:'a'.repeat(101)},{name:'a\nb'},{rating:0},{rating:6},{rating:1.5},{rating:'😄'},{message:'short'},{message:'x'.repeat(3001)},{consent:false},{status:'PUBLISHED'},{organizationId:'agency'},{ownerBrokerId:'owner'},{avatar:{mimeType:'image/svg+xml',dataBase64:'PHN2Zz4='}},{avatar:{mimeType:'image/gif',dataBase64:'R0lGODlh'}},{avatar:{mimeType:'image/png',dataBase64:'data:image/png;base64,AAAA'}},{avatar:{mimeType:'image/png',dataBase64:Buffer.from('<svg/>').toString('base64')}},{avatar:{mimeType:'image/png',dataBase64:'AAAA'.repeat(710000)}},{submissionKey:'bad'},{submissionKey:[submission.submissionKey]}]) assert.throws(()=>validateFeedback({...submission,...extra},publicConfig),e=>[400,413].includes(e.status),JSON.stringify(extra).slice(0,100));
 assert.equal(validateFeedback(submission,publicConfig).rating,5);
});
test('rejects cross-site posts, arbitrary proxy params, invalid IDs, and oversized streams before upstream',async()=>{
 const {client,calls}=upstream();const handler=createApiHandler(client,env);
 for(const args of [{headers:{origin:'https://evil.example'}},{headers:{origin:undefined}},{headers:{origin:'null'}},{headers:{origin:'https://website.example/path'}},{headers:{'sec-fetch-site':'cross-site'}},{headers:{'content-type':'text/plain'}},{headers:{'content-length':'2850001'}},{body:'x'.repeat(2850001)},{body:'{'},{url:'/api/feedback?url=https://evil.example'},{url:'/api/feedback/config?scope=agency',method:'GET'},{url:'/api/feedback?kind=REVIEW&page=0',method:'GET'},{url:'/api/feedback?kind=REVIEW&page=1&page=2',method:'GET'},{url:'/api/feedback?kind=REVIEW&pageSize=100',method:'GET'},{url:'/api/feedback/..%2fsecret/avatar',method:'GET'}]) assert.ok((await call(handler,args)).status>=400);
 assert.equal(calls.length,0);
});
test('rate limit allows retries with the same UUID and enforces 3 new submissions per hour',async()=>{
 let now=1;const limit=createFeedbackLimiter({now:()=>now});
 for(const key of ['one','two','three','three']) limit('visitor',key);
 assert.throws(()=>limit('visitor','four'),e=>e.status===429);
 limit('other','four');now+=3600001;limit('visitor','four');
 const {client,calls}=upstream();const handler=createApiHandler(client,env);
 for(let i=0;i<3;i++) assert.equal((await call(handler)).status,202);
 assert.equal(new Set(calls.filter(c=>c.options.method==='POST').map(c=>JSON.parse(c.options.body).submissionKey)).size,1);
 for(const key of ['c515db71-ece4-4c3c-bb39-b5089e85b8d0','d515db71-ece4-4c3c-bb39-b5089e85b8d0']) assert.equal((await call(handler,{body:{...submission,submissionKey:key}})).status,202);
 const denied=await call(handler,{body:{...submission,submissionKey:'e515db71-ece4-4c3c-bb39-b5089e85b8d0'}});assert.equal(denied.status,429);assert.equal(denied.headers['retry-after'],'3600');
});
test('upstream failures retain status/validation safely and unexpected success is not accepted',async()=>{
 for(const status of [400,401,403,404,413,422,429,500,503]) {
  const {client}=upstream(env,(url,options)=>options.method==='POST'?Response.json({message:'Check your avatar.',errors:{avatar:'Use a smaller photo.'},private:'do not expose'},{status}):null);
  const result=await call(createApiHandler(client,env));assert.equal(result.status,status);assert.equal(result.body.message,'Check your avatar.');assert.equal(result.body.errors.avatar,'Use a smaller photo.');assert.equal(result.body.private,undefined);
 }
 const {client}=upstream(env,(url,options)=>options.method==='POST'?Response.json({ok:true},{status:200}):null);
 assert.equal((await call(createApiHandler(client,env))).status,502);
 const blank=upstream(env,(url,options)=>options.method==='POST'?new Response(null,{status:202}):null);
 assert.equal((await call(createApiHandler(blank.client,env))).status,202);
 const secret=upstream(env,()=>Response.json({...feedbackConfig,moderationText:env.BROKBUDDY_BROKER_CODE}));
 const hidden=await call(createApiHandler(secret.client,env),{url:'/api/feedback/config',method:'GET'});assert.equal(hidden.status,503);assert.ok(!JSON.stringify(hidden).includes(env.BROKBUDDY_BROKER_CODE));
});
test('media authenticates on every request, forwards Range, streams 206 and does not cache hidden media',async t=>{
 let hidden=false;const calls=[];
 const feedback=createFeedbackClient({env,fetchImpl:async(url,options)=>{
  calls.push({url:String(url),options});
  if(hidden) return Response.json({message:'Not found'},{status:404});
  if(options.headers.range==='bytes=999-') return new Response(null,{status:416,headers:{'content-range':'bytes */6','accept-ranges':'bytes'}});
  return new Response('abc',{status:options.headers.range?206:200,headers:{'content-type':String(url).endsWith('/avatar')?'image/webp':'video/mp4','content-length':'3','accept-ranges':'bytes',...(options.headers.range?{'content-range':'bytes 0-2/6'}:{})}});
 }});
 const server=http.createServer(createApiHandler({feedback},env));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
 const base=`http://127.0.0.1:${server.address().port}`;
 let response=await fetch(base+'/api/feedback/video-1/video',{headers:{range:'bytes=0-2'}});assert.equal(response.status,206);assert.equal(await response.text(),'abc');assert.equal(response.headers.get('content-range'),'bytes 0-2/6');assert.equal(response.headers.get('content-length'),'3');assert.equal(response.headers.get('accept-ranges'),'bytes');assert.equal(response.headers.get('cache-control'),'no-store');
 response=await fetch(base+'/api/feedback/video-1/video',{headers:{range:'bytes=999-'}});assert.equal(response.status,416);assert.equal(response.headers.get('content-range'),'bytes */6');await response.text();
 response=await fetch(base+'/api/feedback/review-1/avatar');assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'image/webp');await response.text();
 hidden=true;response=await fetch(base+'/api/feedback/video-1/video');assert.equal(response.status,404);await response.text();
 assert.equal(calls.length,4);assert.ok(calls.every(c=>c.options.headers['x-brokbuddy-broker-code']===env.BROKBUDDY_BROKER_CODE && !c.options.headers.origin));
});

test('full-size photos are bounded without regex overflow and every integer rating uses the same contract',()=>{
 const bytes=Buffer.alloc(2097152);Buffer.from([137,80,78,71,13,10,26,10]).copy(bytes);
 for(let rating=1;rating<=5;rating++) assert.equal(validateFeedback({...submission,rating,avatar:{mimeType:'image/png',dataBase64:bytes.toString('base64')}},publicConfig).rating,rating);
});
test('canonical website origin, error redaction and media header guards cannot leak a credential',async()=>{
 const {client,calls}=upstream();
 const handler=createApiHandler(client,{...env,BROKBUDDY_FEEDBACK_WEBSITE_ORIGIN:'https://website.example'});
 assert.equal((await call(handler,{headers:{origin:'http://website.example'}})).status,403);assert.equal(calls.length,0);
 const failed=upstream(env,(url,options)=>options.method==='POST' ? Response.json({message:env.BROKBUDDY_BROKER_CODE,errors:{avatar:'https://private.example/avatar?code='+env.BROKBUDDY_BROKER_CODE}},{status:422}):null);
 const result=await call(createApiHandler(failed.client,env));assert.equal(result.status,422);assert.ok(!JSON.stringify(result).includes(env.BROKBUDDY_BROKER_CODE));assert.ok(!JSON.stringify(result).includes('private.example'));
 const feedback=createFeedbackClient({env,fetchImpl:async()=>new Response('abc',{headers:{'content-type':'image/webp; secret='+env.BROKBUDDY_BROKER_CODE}})});
 await assert.rejects(()=>feedback.media('review-1','avatar'),error=>error.status===503);
});
