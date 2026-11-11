import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createBrokerClient,getConfig,mapListing,mapAgent,publicAsset} from '../server/brokbuddy.mjs';
import {env,agent,listing,mockApi} from './fixtures.mjs';
const create=mock=>createBrokerClient({env,fetchImpl:mock.fetchImpl});
test('loads complete pagination rather than the two-listing profile preview',async()=>{
 const mock=mockApi();const data=await create(mock).site();assert.equal(data.properties.length,27);assert.equal(data.agent.name,'Test Broker');assert.equal(data.agent.licenseId,'BRN-123');assert.equal(data.agent.careerVolume,'—');assert.deepEqual(data.agent.testimonials,[]);
 assert.deepEqual(mock.calls.filter(x=>x.url.pathname.endsWith('/listings')).map(x=>x.url.search),'?page=1&limit=12 ?page=2&limit=12 ?page=3&limit=12'.split(' '));
 for(const call of mock.calls) {assert.equal(call.options.headers['X-BrokBuddy-Broker-Code'],env.BROKBUDDY_BROKER_CODE);assert.equal(call.options.cache,'no-store');assert.equal(call.options.redirect,'error');assert.ok(call.options.signal instanceof AbortSignal);assert.ok(!call.url.href.includes(env.BROKBUDDY_BROKER_CODE));}
 assert.ok(!JSON.stringify(data).includes(env.BROKBUDDY_BROKER_CODE));
});
test('preserves numeric price, source currency and actual unique gallery photos',()=>{
 const a=mapAgent(agent(),env.BROKBUDDY_BROKER_PROFILE_SLUG,env.BROKBUDDY_API_BASE_URL);
 const p=mapListing(listing(3,{price:35000,currency:'EUR',bedrooms:null,bathrooms:null,builtUpArea:null}),a,env.BROKBUDDY_API_BASE_URL);
 assert.equal(p.price,35000);assert.equal(p.currency,'EUR');assert.equal(p.marketCategory,'rent');assert.equal(p.priceFormatted,'€35,000.00');assert.ok(!/month|year/i.test(p.priceFormatted));assert.equal(p.beds,'—');assert.equal(p.sqft,'—');assert.equal(p.images.length,2);assert.equal(p.yearBuilt,null);
});
test('valid empty feed remains distinct from unavailable and malformed feeds',async()=>{
 assert.deepEqual((await create(mockApi({count:0})).site()).properties,[]);
 for(const status of [401,403,404,500]) await assert.rejects(create(mockApi({fail:()=>Response.json({error:'private'},{status})})).site(),e=>e.status===503 && !e.message.includes('private'));
 await assert.rejects(create(mockApi({transform:x=>x.listings ? {...x,listings:[]} : x})).site(),e=>e.status===503);
 await assert.rejects(create(mockApi({transform:x=>x.listings ? {...x,totalPages:999}:x})).site(),e=>e.status===503);
 await assert.rejects(create(mockApi({transform:x=>x.agent && !x.listings && !x.id ? {...x,activeListings:null}:x})).site(),e=>e.status===503);
});
test('fails closed on sibling broker ownership, malformed values and duplicate inventory',async()=>{
 for(const overrides of [{agent:{id:'broker-b',slug:'test-broker'}},{broker:{id:'broker-a',brokerProfile:{slug:'sibling'}}},{price:'123'},{currency:'invalid'},{status:'DRAFT'},{images:null}]) {
  const mock=mockApi({transform:x=>x.listings ? {...x,listings:[{...x.listings[0],...overrides},...x.listings.slice(1)]}:x});await assert.rejects(create(mock).site(),e=>e.status===503);
 }
 await assert.rejects(create(mockApi({transform:x=>x.listings ? {...x,listings:x.listings.map(()=>x.listings[0])}:x})).site(),e=>e.status===503);
 await assert.rejects(create(mockApi({transform:x=>x.agent && !x.id && !x.listings ? {...x,agent:{...x.agent,slug:'sibling'}}:x})).site(),e=>e.status===503);
});
test('direct detail lookup uses the scoped endpoint and verifies the requested ID',async()=>{
 const mock=mockApi();const data=await create(mock).site('listing-27');assert.equal(data.selectedProperty.id,'listing-27');assert.ok(mock.calls.some(c=>c.url.pathname==='/api/public/broker-template/test-broker/listings/listing-27'));
 const notFound=await create(mockApi()).site('missing');assert.equal(notFound.selectedProperty,null);assert.equal(notFound.detailNotFound,true);
 await assert.rejects(create(mockApi({transform:(x,url)=>url.pathname.endsWith('/listings/listing-27') ? {...x,id:'listing-1'}:x})).site('listing-27'),e=>e.status===503);
});
test('inquiry verifies publication and listing context, sends no feed code, and preserves retries',async()=>{
 const mock=mockApi();const client=create(mock),body={name:'Test Person',email:'test@example.test',message:'Please arrange a property viewing.',listingId:'listing-2'};
 await client.inquire(body,'test-idempotency-key');await client.inquire(body,'test-idempotency-key');
 const posts=mock.calls.filter(c=>c.options.method==='POST');assert.equal(posts.length,2);
 for(const post of posts){assert.equal(post.url.pathname,'/api/public/broker/test-broker/inquiry');assert.equal(post.options.headers['idempotency-key'],'test-idempotency-key');assert.equal(post.options.headers['X-BrokBuddy-Broker-Code'],undefined);assert.equal(JSON.parse(post.options.body).listingId,'listing-2');}
 const denied=mockApi({fail:()=>Response.json({},{status:404})});await assert.rejects(create(denied).inquire(body,'key'),e=>e.status===503);assert.equal(denied.calls.some(x=>x.options.method==='POST'),false);
 await assert.rejects(create(mockApi({confirmation:{message:'ok'}})).inquire(body,'key'),e=>e.status===502);
 await assert.rejects(create(mockApi()).inquire({...body,listingId:'missing'},'key'),e=>e.status===404);
});
test('configuration, transport and asset failures never reveal credentials or errors',async()=>{
 for(const overrides of [{BROKBUDDY_BROKER_CODE:'INVALID'},{BROKBUDDY_BROKER_PROFILE_SLUG:'../other'},{BROKBUDDY_API_BASE_URL:'http://api.example.test'},{BROKBUDDY_API_BASE_URL:'https://user:password@example.test'}]) assert.throws(()=>getConfig({...env,...overrides}),e=>e.status===503 && !e.message.includes('password'));
 assert.throws(()=>publicAsset('javascript:alert(1)',env.BROKBUDDY_API_BASE_URL),e=>e.status===503);
 const client=createBrokerClient({env,fetchImpl:async()=>{throw Error(env.BROKBUDDY_BROKER_CODE);}});await assert.rejects(client.site(),e=>!e.message.includes(env.BROKBUDDY_BROKER_CODE));
 await assert.rejects(create(mockApi({transform:x=>({...x,unexpected:env.BROKBUDDY_BROKER_CODE})})).site(),e=>e.status===503);
});
test('rate limits and bounded upstream timeouts are safe failures',async()=>{
 await assert.rejects(create(mockApi({fail:()=>Response.json({},{status:429})})).site(),e=>e.status===429);
 const keepAlive=setTimeout(()=>{},100);
 const client=createBrokerClient({env,timeoutMs:5,fetchImpl:(_url,opts)=>new Promise((_,reject)=>opts.signal.addEventListener('abort',()=>reject(Error('Timeout'))))});
 await assert.rejects(client.site(),e=>e.status===503);clearTimeout(keepAlive);
});
