import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {createApiHandler,validateInquiry} from '../server/http.mjs';
import {PublicError} from '../server/brokbuddy.mjs';
const body={name:'Test Person',email:'test@example.test',message:'Please contact me about this property.',listingId:'listing-1'};
async function call({payload=body,headers={},method='POST',url='/api/inquiries',client={site:async()=>({properties:[]}),inquire:async()=>({ok:true})}}={}) {
 const req=Readable.from([Buffer.from(typeof payload==='string' ? payload : JSON.stringify(payload))]);
 Object.assign(req,{method,url,headers:{host:'localhost:3000',origin:'http://localhost:3000','content-type':'application/json','idempotency-key':'valid-idempotency-key',...headers}});
 let status,responseHeaders,result;const res={writeHead:(s,h)=>{status=s;responseHeaders=h;},end:data=>{result=data ? JSON.parse(data):null;}};
 await createApiHandler(client)(req,res);return {status,headers:responseHeaders,body:result};
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
