import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {createApiHandler,validateInquiry} from '../server/http.mjs';
import {PublicError} from '../server/brokbuddy.mjs';
import {getPublicMapsConfig} from '../server/maps.mjs';
const body={name:'Test Person',email:'test@example.test',message:'Please contact me about this property.',listingId:'listing-1'};
async function call({payload=body,headers={},method='POST',url='/api/inquiries',runtimeEnv={},client={site:async()=>({properties:[]}),inquire:async()=>({ok:true})}}={}) {
 const req=Readable.from([Buffer.from(typeof payload==='string' ? payload : JSON.stringify(payload))]);
 Object.assign(req,{method,url,headers:{host:'localhost:3000',origin:'http://localhost:3000','content-type':'application/json','idempotency-key':'valid-idempotency-key',...headers}});
 let status,responseHeaders,result;const res={writeHead:(s,h)=>{status=s;responseHeaders=h;},end:data=>{result=data ? JSON.parse(data):null;}};
 await createApiHandler(client,runtimeEnv)(req,res);return {status,headers:responseHeaders,body:result};
}
test('same-origin valid submission confirms delivery and never caches',async()=>{
 let received;const result=await call({client:{inquire:async(input,key)=>{received={input,key};return {ok:true};}}});assert.equal(result.status,200);assert.deepEqual(result.body,{ok:true});assert.equal(received.input.listingId,'listing-1');assert.equal(received.key,'valid-idempotency-key');assert.equal(result.headers['cache-control'],'no-store');
});
test('rejects foreign, missing, opaque, malformed and cross-site origins',async()=>{
 for(const headers of [{origin:'https://attacker.test'},{origin:undefined},{origin:'null'},{origin:'http://localhost:3000/path'},{'sec-fetch-site':'cross-site'}]) assert.equal((await call({headers})).status,403);
});
test('validates MIME, size, idempotency and malformed JSON',async()=>{
 for(const [args,status] of [[{headers:{'content-type':'text/plain'}},415],[{headers:{'content-length':'17000'}},413],[{payload:'x'.repeat(17000)},413],[{headers:{'idempotency-key':'short'}},400],[{payload:'{'},400],[{method:'GET'},405]]) assert.equal((await call(args)).status,status);
});
test('validates exact inquiry contract and contact fields',()=>{
 for(const invalid of [{...body,name:'a'},{...body,message:'short'},{...body,email:'invalid'},{...body,email:'',phone:''},{...body,extra:true},{...body,budget:-1},{...body,phone:'1'.repeat(41)},{...body,listingId:'x'.repeat(121)}]) assert.throws(()=>validateInquiry(invalid),e=>e.status===400);
 assert.deepEqual(validateInquiry(body),body);
});
test('API/auth errors never become successful empty feeds or reveal raw errors',async()=>{
 const result=await call({method:'GET',url:'/api/site',client:{site:async()=>{throw new PublicError(503,'Website unavailable.');}}});assert.equal(result.status,503);assert.equal(result.body.properties,undefined);
 const unknown=await call({client:{inquire:async()=>{throw Error('private secret');}}});assert.equal(unknown.status,503);assert.ok(!JSON.stringify(unknown).includes('private secret'));
 assert.equal((await call({method:'GET',url:'/api/site?slug=other'})).status,400);
});
const clickBody={areaId:'["dubai","dubai marina"]',eventId:'c22e18ee-2002-4acf-aad2-ac34de3e816d'};
test('quick-link proxy provisions a visitor, reuses its cookie, and forwards preview metadata',async()=>{
 const events=[];const client={recordQuickLinkClick:async(...args)=>events.push(args)};
 const args={url:'/api/quick-link-clicks',payload:clickBody,client,runtimeEnv:{NODE_ENV:'production'},headers:{'idempotency-key':undefined,'user-agent':'Browser'}};
 const first=await call(args);assert.equal(first.status,200);assert.deepEqual(first.body,{ok:true});
 assert.match(first.headers['set-cookie'],/HttpOnly; SameSite=Lax; Max-Age=31536000; Secure$/);
 assert.equal(events[0][0].areaId,clickBody.areaId);assert.equal(events[0][0].eventId,clickBody.eventId);assert.ok(events[0][0].visitorId);
 assert.equal(events[0][1].preview,false);assert.equal(events[0][1].userAgent,'Browser');
 const cookie=first.headers['set-cookie'].split(';')[0];
 const next=await call({...args,headers:{...args.headers,cookie,authorization:'Bearer preview'}});
 assert.equal(next.status,200);assert.equal(next.headers['set-cookie'],undefined);assert.equal(events[1][0].visitorId,events[0][0].visitorId);assert.equal(events[1][1].preview,true);
});
test('quick-link proxy rejects malformed events and foreign requests before contacting BrokBuddy',async()=>{
 let calls=0;const client={recordQuickLinkClick:async()=>{calls++;}};
 const args={url:'/api/quick-link-clicks',payload:clickBody,client};
 for(const payload of [{...clickBody,areaId:''},{...clickBody,areaId:'x'.repeat(513)},{...clickBody,areaId:'bad\nname'},{...clickBody,eventId:'invalid'},{...clickBody,eventId:[clickBody.eventId]},{...clickBody,visitorId:'spoofed'},null,[]]) assert.equal((await call({...args,payload})).status,400);
 assert.equal((await call({...args,url:'/api/quick-link-clicks?slug=other'})).status,400);
 assert.equal((await call({...args,headers:{origin:'https://foreign.example'}})).status,403);
 assert.equal((await call({...args,method:'GET'})).status,405);assert.equal(calls,0);
 const failed=await call({...args,client:{recordQuickLinkClick:async()=>{throw Error('private analytics failure');}}});
 assert.equal(failed.status,503);assert.ok(!JSON.stringify(failed.body).includes('private analytics'));
});

const mapsEnv = {
  GOOGLE_MAPS_BROWSER_API_KEY: 'AIza' + 'T'.repeat(35),
  GOOGLE_MAPS_MAP_ID: '8f9c7f3389f798b89cdc534a',
  BROKBUDDY_BROKER_CODE: 'private-broker-code',
  BROKBUDDY_AGENCY_TEMPLATE_CODE: 'private-agency-code',
  DATABASE_URL: 'private-database-url',
};
test('runtime Maps configuration exposes only the browser key and Map ID', async () => {
  const result = await call({method:'GET', url:'/api/maps-config', runtimeEnv:mapsEnv});
  assert.equal(result.status,200);
  assert.deepEqual(result.body, {enabled:true, apiKey:mapsEnv.GOOGLE_MAPS_BROWSER_API_KEY, mapId:mapsEnv.GOOGLE_MAPS_MAP_ID});
  assert.equal(result.headers['cache-control'],'no-store');
  assert.ok(!JSON.stringify(result.body).includes('private-'));
  assert.equal((await call({method:'POST',url:'/api/maps-config',runtimeEnv:mapsEnv})).status,405);
  assert.equal((await call({method:'GET',url:'/api/maps-config?broker=other',runtimeEnv:mapsEnv})).status,400);
});
test('unconfigured/invalid Maps settings disable only maps and never reveal environment values', async () => {
  for (const config of [{}, {...mapsEnv,GOOGLE_MAPS_BROWSER_API_KEY:'bad'}, {...mapsEnv,GOOGLE_MAPS_MAP_ID:'bad id'}]) {
    assert.deepEqual(getPublicMapsConfig(config),{enabled:false});
    const result=await call({method:'GET',url:'/api/maps-config',runtimeEnv:config});
    assert.equal(result.status,200);
    assert.deepEqual(result.body,{enabled:false});
  }
  assert.equal(getPublicMapsConfig({GOOGLE_MAPS_BROWSER_API_KEY:mapsEnv.GOOGLE_MAPS_BROWSER_API_KEY}).mapId,mapsEnv.GOOGLE_MAPS_MAP_ID);
});
