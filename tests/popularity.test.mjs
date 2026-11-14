import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {popularAreaLinks, listingAreaId, trackVisibleProperty, trackQuickLinkClick} from '../src/lib/property-popularity.mjs';
import {compareListingActivity} from '../src/lib/property-filters.mjs';
import {createApiHandler} from '../server/http.mjs';
import {createBrokerClient} from '../server/brokbuddy.mjs';
import {env} from './fixtures.mjs';

const property=(id,extra={})=>({id,status:'ACTIVE',city:'Dubai',neighborhood:'Dubai Marina',viewCount:0,createdAt:'2026-01-01',...extra});
test('area ranking normalizes names, excludes unavailable inventory, preserves rent and advanced URL filters',()=>{
  const rows=[property('a',{viewCount:3}),property('b',{neighborhood:' dubai   marina ',viewCount:4}),property('c',{neighborhood:'Palm',viewCount:6}),property('d',{status:'SOLD',viewCount:1000}),property('e',{neighborhood:'',city:''})];
  const areas=popularAreaLinks(rows,{path:'/properties/rent',search:'beds=2&amenities=Pool&amenities=Balcony&readiness=READY',limit:6});
  assert.equal(areas.length,2);assert.equal(areas[0].listingCount,2);assert.equal(areas[0].clickCount,0);
  const url=new URL(areas[0].href,'https://site.example');assert.equal(url.pathname,'/properties/rent');assert.equal(url.searchParams.has('sort'),false);assert.equal(url.searchParams.get('beds'),'2');assert.deepEqual(url.searchParams.getAll('amenities'),['Pool','Balcony']);
  assert.equal(rows.filter(row=>row.status==='ACTIVE' && listingAreaId(row)===url.searchParams.get('areaId')).length,areas[0].listingCount);
  assert.equal(popularAreaLinks(rows,{limit:1}).length,1);assert.deepEqual(popularAreaLinks([]),[]);
  assert.deepEqual([property('z'),property('a')].sort((a,b)=>compareListingActivity(a,b,'most-viewed')).map(row=>row.id),['a','z']);
});
test('quick links start by listing count, then use card clicks independently of listing views',()=>{
  const rows=[property('a',{viewCount:900}),property('b'),property('c',{neighborhood:'Palm',viewCount:10000})];
  const marina=listingAreaId(rows[0]),palm=listingAreaId(rows[2]);
  assert.deepEqual(popularAreaLinks(rows).map(area=>area.name),['Dubai Marina','Palm']);
  assert.deepEqual(popularAreaLinks(rows,{clicks:[{id:palm,clickCount:1}]}).map(area=>area.name),['Palm','Dubai Marina']);
  const tied=popularAreaLinks(rows,{clicks:[{id:palm,clickCount:7},{id:marina,clickCount:7}]});
  assert.equal(tied[0].id,marina);assert.equal(tied[0].clickCount,7);
  assert.equal(popularAreaLinks(rows,{clicks:[{id:palm,clickCount:-1} ]})[0].id,marina);
});
test('area identity separates cities, uses supplied IDs, and supports city-only UAE listings',()=>{
  const rows=[property('a',{neighborhood:'Central',city:'Dubai'}),property('b',{neighborhood:'Central',city:'Ajman'}),property('c',{neighborhood:'',city:'Sharjah',country:'AE'}),property('d',{neighborhood:'London',country:'GB'}),property('e',{areaId:' area-1 ',neighborhood:'Stable'})];
  const areas=popularAreaLinks(rows);
  assert.equal(areas.length,4);assert.equal(new Set(areas.map(area=>area.id)).size,4);
  assert.equal(areas.find(area=>area.name==='Sharjah').listingCount,1);
  assert.equal(areas.find(area=>area.name==='Stable').id,'area-1');
  const href=popularAreaLinks(rows,{search:'sort=price-asc&page=3&q=waterfront&areaId=old&location=Old'})[0].href;
  const params=new URL(href,'https://site.example').searchParams;
  assert.equal(params.get('sort'),'price-asc');assert.equal(params.get('q'),'waterfront');assert.equal(params.has('page'),false);assert.notEqual(params.get('areaId'),'old');
  assert.deepEqual(popularAreaLinks(rows,{limit:0}),[]);
});
test('card tracking sends one navigation-safe event and skips hidden/preview contexts',async()=>{
  const calls=[];const doc={visibilityState:'visible',location:{search:''}};
  const options={doc,eventId:()=> 'c22e18ee-2002-4acf-aad2-ac34de3e816d',send:(...args)=>{calls.push(args);return Promise.reject(Error('offline'));}};
  await trackQuickLinkClick('area-1',options);
  assert.equal(calls.length,1);assert.equal(calls[0][0],'/api/quick-link-clicks');assert.equal(calls[0][1].keepalive,true);
  assert.deepEqual(JSON.parse(calls[0][1].body),{areaId:'area-1',eventId:'c22e18ee-2002-4acf-aad2-ac34de3e816d'});
  doc.visibilityState='hidden';await trackQuickLinkClick('area-1',options);
  doc.visibilityState='visible';doc.location.search='?preview=1';await trackQuickLinkClick('area-1',options);
  assert.equal(calls.length,1);
});
test('detail tracking waits two visible seconds, cancels hidden/unmounted pages, and absorbs failures',async()=>{
  const listeners=new Map();let callback,delay,cancelled=0,calls=0;
  const doc={visibilityState:'hidden',location:{search:''},addEventListener:(key,fn)=>listeners.set(key,fn),removeEventListener:key=>listeners.delete(key)};
  const options={doc,locks:{request:async(_name,callback)=>callback()},schedule:(fn,ms)=>{callback=fn;delay=ms;return 1;},cancel:()=>{cancelled++;callback=null;},send:()=>{calls++;return Promise.reject(Error('offline'));}};
  const stop=trackVisibleProperty('a',options);assert.equal(callback,undefined);
  doc.visibilityState='visible';listeners.get('visibilitychange')();assert.equal(delay,2000);assert.equal(calls,0);
  doc.visibilityState='hidden';listeners.get('visibilitychange')();assert.equal(callback,null);assert.equal(calls,0);
  doc.visibilityState='visible';listeners.get('visibilitychange')();callback();await Promise.resolve();assert.equal(calls,1);
  listeners.get('visibilitychange')();assert.equal(callback,null);stop();assert.equal(listeners.size,0);assert.ok(cancelled>0);
  const stopEarly=trackVisibleProperty('b',options);stopEarly();assert.equal(callback,null);
  doc.location.search='?preview=1';trackVisibleProperty('c',options);assert.equal(listeners.size,0);
});
test('proxy derives visitor ID from HttpOnly cookie and forwards broker credentials only server to server',async()=>{
  const calls=[];
  const client=createBrokerClient({env,fetchImpl:async(input,options)=>{calls.push({input:String(input),options});return new Response(null,{status:204});}});
  const handler=createApiHandler(client);
  const request=Readable.from([Buffer.from(JSON.stringify({visibleDurationMs:2000}))]);
  Object.assign(request,{method:'POST',url:'/api/property-views/a',headers:{host:'site.example',origin:'https://site.example','content-type':'application/json','user-agent':'Mozilla/5.0',cookie:'bb_visitor=c22e18ee-2002-4acf-aad2-ac34de3e816d'}});
  let status,payload;await handler(request,{writeHead:s=>{status=s;},end:value=>{payload=JSON.parse(value);}});
  assert.equal(status,200);assert.deepEqual(payload,{ok:true});assert.equal(calls.length,1);
  assert.ok(calls[0].input.endsWith('/api/public/broker-template/test-broker/listings/a/views'));
  assert.equal(calls[0].options.headers['X-BrokBuddy-Broker-Code'],env.BROKBUDDY_BROKER_CODE);
  assert.equal(calls[0].options.headers['user-agent'],'Mozilla/5.0');
  assert.deepEqual(JSON.parse(calls[0].options.body),{visitorId:'c22e18ee-2002-4acf-aad2-ac34de3e816d',visibleDurationMs:2000});
  assert.ok(!JSON.stringify(payload).includes(env.BROKBUDDY_BROKER_CODE));
});
