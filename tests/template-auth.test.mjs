import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {Readable} from 'node:stream';
import {createBrokerClient,getConfig,PublicError} from '../server/brokbuddy.mjs';
import {createApiHandler} from '../server/http.mjs';
import {createCredentialGuard,assertPrivateTemplateConfiguration} from '../server/template-security.mjs';
import {auditTemplateArtifacts} from '../scripts/audit-template-artifacts.mjs';
import {env,mockApi} from './fixtures.mjs';

const brokerCode='31'.repeat(16), otherBrokerCode='42'.repeat(16), agencyCode='53'.repeat(16);
const settings={...env,BROKBUDDY_BROKER_CODE:brokerCode,BROKBUDDY_AGENCY_CODE:agencyCode};
const hash=value=>createHash('sha256').update(value).digest('hex');
const phoneInquiry={name:'Test Person',phone:'+971500000000',propertyType:'Office',message:'Contact enquiry: Rent commercial'};

test('broker requests use only the matching broker slug/header; wrong, revoked and agency credentials fail closed',async()=>{
  for(const code of [brokerCode,otherBrokerCode,agencyCode,'64'.repeat(16)]) {
    const fixture=mockApi();
    const client=createBrokerClient({env:{...settings,BROKBUDDY_BROKER_CODE:code},fetchImpl:(url,options)=>{
      assert.equal(options.headers['X-BrokBuddy-Agency-Code'],undefined);
      assert.equal(new URL(url).searchParams.has('code'),false);
      if(options.headers['X-BrokBuddy-Broker-Code']!==brokerCode) return Promise.resolve(Response.json({message:'Denied'},{status:404}));
      return fixture.fetchImpl(url,options);
    }});
    if(code===brokerCode) assert.equal((await client.site()).agent.slug,env.BROKBUDDY_BROKER_PROFILE_SLUG);
    else await assert.rejects(client.site(),error=>error.status===503);
  }
  assert.throws(()=>getConfig({...settings,BROKBUDDY_BROKER_CODE:undefined}),error=>error.status===503);
  assert.throws(()=>getConfig({...settings,BROKBUDDY_API_BASE_URL:'https://api.example.test/forward'}),error=>error.status===503);
  const fixture=mockApi({transform:value=>value.agent && !value.id && !value.listings ? {...value,agent:{...value.agent,slug:'other-broker'}} : value});
  await assert.rejects(createBrokerClient({env:settings,fetchImpl:fixture.fetchImpl}).site(),error=>error.status===503);
});

test('all broker writes authenticate in headers and keep codes/hashes out of URLs and JSON metadata',async()=>{
  const fixture=mockApi();const client=createBrokerClient({env:settings,fetchImpl:fixture.fetchImpl});
  await client.inquire(phoneInquiry,'synthetic-idempotency-key');
  await client.recordView('listing-1',{visitorId:'synthetic-visitor',visibleDurationMs:2000});
  await client.recordQuickLinkClick({areaId:'synthetic-area',eventId:'synthetic-event',visitorId:'synthetic-visitor'});
  const guard=createCredentialGuard(settings);
  for(const call of fixture.calls) {
    assert.equal(call.options.headers['X-BrokBuddy-Broker-Code'],brokerCode);
    assert.equal(call.options.cache,'no-store');assert.equal(call.options.redirect,'error');
    assert.equal(guard(call.url.href),false);assert.equal(guard(call.options.body),false);
  }
  const postsBefore=fixture.calls.filter(call=>call.options.method==='POST').length;
  await assert.rejects(client.inquire({...phoneInquiry,message:`Accidental credential: ${brokerCode}`},'synthetic-idempotency-key'),error=>error.status===400);
  await assert.rejects(client.inquire(phoneInquiry,brokerCode),error=>error.status===400);
  await assert.rejects(client.recordView(brokerCode,{visitorId:'synthetic-visitor',visibleDurationMs:2000}),error=>error.status===400);
  await assert.rejects(client.recordView('listing-1',{visitorId:'synthetic-visitor',visibleDurationMs:2000},{userAgent:brokerCode}),error=>error.status===400);
  assert.equal(fixture.calls.filter(call=>call.options.method==='POST').length,postsBefore);
});

test('raw, hashed, encoded and escaped credentials cannot escape via feed fields or assets',async()=>{
  for(const value of [brokerCode,hash(brokerCode),agencyCode,hash(agencyCode),[...brokerCode].map(char=>'%'+char.charCodeAt(0).toString(16)).join(''),Buffer.from(brokerCode).toString('base64')]) {
    const fixture=mockApi({transform:payload=>({...payload,unexpectedCredential:value})});
    await assert.rejects(createBrokerClient({env:settings,fetchImpl:fixture.fetchImpl}).site(),error=>error.status===503 && !createCredentialGuard(settings)(error.message));
  }
  const escaped=[...brokerCode].map(char=>'\\u00'+char.charCodeAt(0).toString(16)).join('');
  const fixture=mockApi({transform:payload=>({...payload,unexpectedCredential:escaped})});
  await assert.rejects(createBrokerClient({env:settings,fetchImpl:fixture.fetchImpl}).site(),error=>error.status===503);
  assert.equal(createCredentialGuard(settings)(JSON.stringify({source:hash(brokerCode)})),true);
});

test('phone-only durable intake confirmations succeed; malformed success claims never do',async()=>{
  for(const outcome of ['created','existing_opportunity','ownership_conflict','idempotent']) {
    const fixture=mockApi({confirmation:{inquiry:null,intake:{submissionId:'synthetic-submission',outcome,ownershipPreserved:outcome!=='created',leadId:'private-lead-id'}}});
    assert.deepEqual(await createBrokerClient({env:settings,fetchImpl:fixture.fetchImpl}).inquire(phoneInquiry,'synthetic-idempotency-key'),{ok:true});
  }
  for(const confirmation of [{ok:true},{inquiry:null},{intake:{submissionId:'x'}},{intake:{submissionId:'x',outcome:'failed',ownershipPreserved:false}},{intake:{submissionId:'',outcome:'created',ownershipPreserved:false}}]) {
    await assert.rejects(createBrokerClient({env:settings,fetchImpl:mockApi({confirmation}).fetchImpl}).inquire(phoneInquiry,'synthetic-idempotency-key'),error=>error.status===502);
  }
});

async function apiCall(client,{url='/api/site',method='GET',body=phoneInquiry,headers={}}={}) {
  const request=Readable.from(method==='GET' ? [] : [Buffer.from(JSON.stringify(body))]);
  Object.assign(request,{url,method,headers:{host:'broker-domain.example',origin:'https://broker-domain.example','content-type':'application/json','idempotency-key':'synthetic-idempotency-key',...headers}});
  let status,responseHeaders,payload;
  await createApiHandler(client,settings)(request,{writeHead:(code,values)=>{status=code;responseHeaders=values;},end:value=>{payload=JSON.parse(value);}});
  return {status,headers:responseHeaders,payload};
}

test('same-origin proxy rejects arbitrary forwarding/credential inputs and redacts all response paths',async()=>{
  let calls=0;const client={site:async()=>{calls++;return {properties:[]};},inquire:async()=>{calls++;return {ok:true};}};
  for(const url of ['/api/site?url=https://attacker.test','/api/site?slug=other','/api/site?listingId=../private','/api/site?listingId=','/api/inquiries?code=ignored']) {
    assert.equal((await apiCall(client,{url,method:url.startsWith('/api/inquiries') ? 'POST' : 'GET'})).status,400);
  }
  for(const extra of [{brokerCode},{templateHexCode:agencyCode},{publicTemplateCodeHash:hash(brokerCode)}]) assert.equal((await apiCall(client,{url:'/api/inquiries',method:'POST',body:{...phoneInquiry,...extra}})).status,400);
  assert.equal(calls,0);
  for(const site of [async()=>({properties:[],secret:brokerCode}),async()=>({properties:[],hash:hash(brokerCode)}),async()=>{throw new PublicError(502,brokerCode);}]) {
    const result=await apiCall({site});assert.equal(result.status,503);assert.equal(createCredentialGuard(settings)(result),false);
    assert.equal(result.headers['cache-control'],'no-store');assert.equal(result.headers['vercel-cdn-cache-control'],'no-store');
  }
  const fixture=mockApi();const result=await apiCall(createBrokerClient({env:settings,fetchImpl:fixture.fetchImpl}),{url:'/api/inquiries',method:'POST',headers:{'x-brokbuddy-broker-code':otherBrokerCode,'x-brokbuddy-agency-code':agencyCode,'x-forwarded-host':'agency-domain.example'}});
  assert.equal(result.status,200);
  assert.ok(fixture.calls.every(call=>call.options.headers['X-BrokBuddy-Broker-Code']===brokerCode));
});

test('build checks reject public-prefixed credentials and scan actual artifact bytes without revealing values',async t=>{
  for(const publicEnv of [{VITE_BROKBUDDY_BROKER_CODE:brokerCode},{NEXT_PUBLIC_TEMPLATE_CODE:agencyCode},{VITE_PUBLIC_SETTINGS:JSON.stringify({secret:brokerCode})},{VITE_PUBLIC_SETTINGS:hash(brokerCode)}]) {
    assert.throws(()=>assertPrivateTemplateConfiguration({...settings,...publicEnv}),error=>!createCredentialGuard(settings)(error.message));
  }
  assert.doesNotThrow(()=>assertPrivateTemplateConfiguration({...settings,VITE_SITE_TITLE:'Public portfolio'}));
  const folder=await mkdtemp(path.join(tmpdir(),'novalux-artifact-audit-'));t.after(()=>rm(folder,{recursive:true,force:true}));
  await writeFile(path.join(folder,'index.html'),'<h1>Public portfolio</h1>');
  assert.deepEqual(await auditTemplateArtifacts(folder,settings),{checked:1,credentialExposed:false});
  for(const secret of [brokerCode,hash(brokerCode),agencyCode]) {
    await writeFile(path.join(folder,'app.js'),`export const unsafe=${JSON.stringify(secret)}`);
    await assert.rejects(auditTemplateArtifacts(folder,settings),error=>!createCredentialGuard(settings)(error.message));
  }
});
