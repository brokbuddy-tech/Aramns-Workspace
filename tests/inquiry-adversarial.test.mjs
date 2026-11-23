import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {validateInquiry,createApiHandler} from '../server/http.mjs';
import {createBrokerClient,PublicError} from '../server/brokbuddy.mjs';
import {buildContactInquiry,contactErrors} from '../src/lib/contact-workflow.mjs';
import {contactCases} from './contact-cases.mjs';
import {env,mockApi} from './fixtures.mjs';

const baseline={name:'Synthetic Visitor',phone:'+971500000000',message:'A synthetic property enquiry.'};
const rejected=value=>assert.throws(()=>validateInquiry(value),error=>error instanceof PublicError && error.status===400);

test('all 249 contact choice combinations preserve structured answers without stale branch fields',()=>{
  let checked=0;
  for(const {details,requirements} of contactCases()) {
    const payload=buildContactInquiry(details,requirements);
    assert.deepEqual(validateInquiry(payload),payload);
    assert.equal(payload.nationality,details.nationality);assert.equal(payload.transactionType,details.service);
    const keys=payload.specialNotes.map(answer=>answer.key);
    assert.equal(new Set(keys).size,keys.length);
    assert.equal(keys.includes('occupants'),details.service==='rent' && details.sector==='residential');
    assert.equal(keys.includes('readiness'),details.service==='buy' && details.sector==='residential');
    assert.equal(keys.includes('purpose'),details.service==='buy' && details.sector==='commercial');
    checked++;
  }
  assert.equal(checked,249);
});

test('invalid states cannot generate a completed contact payload',()=>{
  const initial=contactCases().next().value;
  for(const [field,value] of [['nationality',''],['nationality','\u200b\u200b'],['name','1'.repeat(120)],['name','X'.repeat(121)],['visitorType','admin'],['service','sell'],['sector','industrial'],['phone','+123']]) {
    assert.throws(()=>buildContactInquiry({...initial.details,[field]:value},initial.requirements));
  }
  for(const field of ['propertyType','readiness']) assert.throws(()=>buildContactInquiry(initial.details,{...initial.requirements,[field]:'__injected__'}));
  assert.ok(Object.keys(contactErrors(0,{nationality:'\u202eaa',visitorType:'customer'})).length);
});

test('Unicode names, apostrophes, hyphens and plain injection-shaped text remain data',()=>{
  for(const name of ['أحمد بن علي','प्रथम सोनी','李小龙',"Zoë O’Connor-Smith","<img src=x onerror=alert(1)>","Robert'); DROP TABLE leads;--"]) {
    assert.equal(validateInquiry({...baseline,name}).name,name);
  }
  assert.equal(validateInquiry({...baseline,message:'First line\nSecond line\twith details'}).message,'First line\nSecond line\twith details');
  for(const phone of ['+971 50 000 0000','(555) 123-4567','1234567','1'.repeat(15)]) assert.equal(validateInquiry({...baseline,phone}).phone,phone);
  for(const phone of ['123456','1'.repeat(16),'++971500000000','<script>','\n971500000000','+97150000000\u007f']) rejected({...baseline,phone});
});

test('length boundaries, control characters, malformed identifiers and unknown keys are rejected',()=>{
  for(const [key,max] of [['name',120],['email',254],['phone',40],['message',4000],['listingId',120],['propertyType',120],['nationality',120]]) rejected({...baseline,[key]:'a'.repeat(max+1)});
  for(const value of ['a\u0000b','a\u007fb','a\u0085b','a\ud800b','a\udfffb']) for(const key of ['name','message','propertyType','nationality']) rejected({...baseline,[key]:value.padEnd(key==='message' ? 12 : 2,'a')});
  for(const listingId of ['../listing','x/y','%2fprivate','?slug=other','x\ny']) rejected({...baseline,listingId});
  for(const value of [null,[],true,0,'hello',JSON.parse('{"__proto__":{"polluted":true}}'),{...baseline,brokerId:'other'},{...baseline,budget:-1},{...baseline,budget:Infinity}]) rejected(value);
  assert.equal({}.polluted,undefined);
});

test('Special Notes reject nested data, reserved metadata, duplicates and oversized values',()=>{
  const good={key:'occupants',label:'Who will live here?',value:'Family'};
  for(const specialNotes of [null,{},[null],[{...good,extra:true}],[{...good,key:'password'}],[{...good,label:'API key'}],[good,good],[{...good,value:{nested:true}}],[{...good,value:[['nested']]}],[{...good,value:'x'.repeat(2001)}],[{...good,value:NaN}],[{...good,value:Array(21).fill('x')}],Array(41).fill(good)]) rejected({...baseline,specialNotes});
  assert.deepEqual(validateInquiry({...baseline,specialNotes:[good,{key:'pets',label:'Pets',value:false},{key:'children',label:'Children',value:0},{key:'empty',label:'Empty',value:' '},{key:'areas',label:'Areas',value:[' ','Ajman']}]}).specialNotes,[good,{key:'pets',label:'Pets',value:false},{key:'children',label:'Children',value:0},{key:'areas',label:'Areas',value:['Ajman']}]);
});

test('6,000 deterministic type/Unicode/length mutations never crash validation or pollute prototypes',()=>{
  let seed=0x51f15e;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};
  const fragments=['a','أ','é','\u0000','\u007f','\ud800','\u200b','\u202e','\n',' ','<script>','"','🚪'];
  const fields=['name','email','phone','message','listingId','propertyType','nationality','transactionType','specialNotes','budget'];
  const lengths=[0,1,2,39,40,80,120,254,2000,4000,4001];
  const types=[null,[],{},true,false,0,-1,NaN,Infinity,['x'],{key:'x',value:'y'}];
  let accepted=0,rejectedCount=0;
  for(let i=0;i<6000;i++) {
    const key=fields[i%fields.length];
    const value=i%3===0 ? types[random()%types.length] : fragments[random()%fragments.length].repeat(lengths[random()%lengths.length]);
    try {
      const parsed=validateInquiry({...baseline,[key]:value});
      assert.deepEqual(validateInquiry(JSON.parse(JSON.stringify(parsed))),parsed);accepted++;
    } catch(error) {assert.ok(error instanceof PublicError && error.status===400,`Unexpected validator failure for ${key}`);rejectedCount++;}
  }
  assert.equal(accepted+rejectedCount,6000);assert.ok(accepted>0);assert.ok(rejectedCount>0);assert.equal({}.polluted,undefined);
});

async function proxyCall({payload=baseline,raw,chunks,headers={},method='POST',url='/api/inquiries',client={inquire:async()=>({ok:true})}}={}) {
  const request=Readable.from(chunks || [Buffer.from(raw===undefined ? JSON.stringify(payload) : raw)]);
  Object.assign(request,{url,method,headers:{host:'template.example',origin:'https://template.example','content-type':'application/json','idempotency-key':'synthetic-test-key',...headers}});
  let status,body,responseHeaders;
  await createApiHandler(client,env)(request,{writeHead(code,h){status=code;responseHeaders=h;},end(value){body=JSON.parse(value);}});
  return {status,body,headers:responseHeaders};
}

test('HTTP rejects invalid and oversized byte streams before any upstream write',async()=>{
  let writes=0;const client={inquire:async()=>{writes++;return {ok:true};}};
  for(const args of [{raw:'null'},{raw:'[]'},{raw:'{'},{raw:'{'.repeat(17000)},{chunks:[Buffer.alloc(9000,32),Buffer.alloc(9000,32)]},{headers:{origin:'https://attacker.example'}},{headers:{origin:'null'}},{headers:{'content-type':'text/plain'}},{headers:{'idempotency-key':'x'}},{url:'/api/inquiries?broker=other'},{payload:{...baseline,phone:'not a phone'}}]) {
    const response=await proxyCall({...args,client});assert.ok([400,403,413,415].includes(response.status));assert.equal(response.headers['cache-control'],'no-store');
  }
  assert.equal(writes,0);
  const {details,requirements}=contactCases().next().value;
  assert.equal((await proxyCall({client,payload:buildContactInquiry(details,requirements)})).status,200);
  assert.equal(writes,1);
});

test('credentials in structured answers never become upstream enquiry metadata',async()=>{
  const fixture=mockApi();const client=createBrokerClient({env,fetchImpl:fixture.fetchImpl});
  const result=await proxyCall({client,payload:{...baseline,specialNotes:[{key:'extra',label:'Extra',value:env.BROKBUDDY_BROKER_CODE}]}});
  assert.equal(result.status,400);assert.ok(!JSON.stringify(result).includes(env.BROKBUDDY_BROKER_CODE));
  assert.equal(fixture.calls.filter(call=>call.options.method==='POST').length,0);
});
