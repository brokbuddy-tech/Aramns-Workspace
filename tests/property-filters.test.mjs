import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyAdvancedFilters, matchesAdvancedFilters, readListingSearch, writeListingSearch, rangeError, propertySector, compareListingActivity, hasListingViews, matchesRoomCount} from '../src/lib/property-filters.mjs';
import {mapListing, mapAgent} from '../server/brokbuddy.mjs';
import {agent, listing, env} from './fixtures.mjs';

const property = overrides => mapListing(listing(1, overrides), mapAgent(agent(), env.BROKBUDDY_BROKER_PROFILE_SLUG, env.BROKBUDDY_API_BASE_URL), env.BROKBUDDY_API_BASE_URL);
const filters = overrides => ({...emptyAdvancedFilters(), ...overrides});

test('range boundaries include exact values and reject missing measurements', () => {
  const selected = filters({minPrice:'100000',maxPrice:'100000',minArea:'1001',maxArea:'1001',baths:'2'});
  assert.equal(matchesAdvancedFilters(property(), selected, ['AED']), true);
  assert.equal(matchesAdvancedFilters(property({price:99999}), selected, ['AED']), false);
  assert.equal(matchesAdvancedFilters(property({builtUpArea:null}), selected, ['AED']), false);
  assert.equal(matchesAdvancedFilters(property({bathrooms:null}), selected, ['AED']), false);
  assert.equal(matchesAdvancedFilters(property({price:0,builtUpArea:0}), filters({maxPrice:'0',maxArea:'0'}), ['AED']), true);
});

test('every selected amenity must exist; partial names and descriptions do not qualify', () => {
  const selected = filters({amenities:['private pool','Balcony']});
  assert.equal(matchesAdvancedFilters(property(),selected,['AED']),true);
  assert.equal(matchesAdvancedFilters(property({amenities:['Private Pool']}),selected,['AED']),false);
  assert.equal(matchesAdvancedFilters(property({amenities:[]}),selected,['AED']),false);
  assert.equal(matchesAdvancedFilters(property({amenities:['Pool','Balcony']}),selected,['AED']),false);
});

test('mixed currencies require a selected currency before comparing amounts', () => {
  const selected = filters({minPrice:'200000'});
  assert.equal(matchesAdvancedFilters(property(),selected,['AED','USD']),true);
  assert.equal(matchesAdvancedFilters(property(),{...selected,currency:'AED'},['AED','USD']),false);
  assert.equal(matchesAdvancedFilters(property({price:300000,currency:'USD'}),{...selected,currency:'AED'},['AED','USD']),false);
  assert.equal(matchesAdvancedFilters(property({price:300000}),{...selected,currency:'AED'},['AED','USD']),true);
});

test('commercial classification preserves the source category and supports known commercial subtypes', () => {
  const commercial = property({category:'Commercial',propertyType:'Land'});
  assert.equal(commercial.propertyClass,'Commercial');
  assert.equal(propertySector(commercial),'commercial');
  assert.equal(propertySector({propertyType:'Office'}),'commercial');
  assert.equal(propertySector({propertyType:'Warehouse'}),'commercial');
  assert.equal(propertySector({propertyType:'Land'}),'');
  assert.equal(matchesAdvancedFilters(commercial,filters({sector:'commercial'})),true);
  assert.equal(matchesAdvancedFilters(property(),filters({sector:'commercial'})),false);
});

test('completion and media filters use supplied listing facts', () => {
  assert.equal(matchesAdvancedFilters(property(),filters({readiness:'OFFPLAN'})),false);
  assert.equal(matchesAdvancedFilters(property({readiness:'OFFPLAN'}),filters({readiness:'OFFPLAN'})),true);
  assert.equal(matchesAdvancedFilters(property(),filters({floorPlan:true})),false);
  assert.equal(matchesAdvancedFilters(property({floorPlanUrl:'/plan.pdf'}),filters({floorPlan:true})),true);
});

test('retired photo filters are ignored and removed from saved search URLs', () => {
  const {basic,advanced}=readListingSearch('?photos=1&location=Dubai+Marina');
  assert.equal('photos' in advanced,false);
  assert.equal(matchesAdvancedFilters(property({images:[]}),advanced),true);
  const saved=writeListingSearch('?photos=1&campaign=portfolio',basic,{...advanced,photos:true});
  assert.equal(new URLSearchParams(saved).has('photos'),false);
  assert.equal(new URLSearchParams(saved).get('location'),'Dubai Marina');
  assert.equal(new URLSearchParams(saved).get('campaign'),'portfolio');
});

test('shareable searches preserve repeated amenities, studio, zero bounds and unrelated parameters', () => {
  const basic = {q:'Palm & marina',beds:'studio',sort:'latest',location:'Dubai Marina'};
  const selected = filters({amenities:['Private Pool','Balcony'],minPrice:'0',maxPrice:'500000',floorPlan:true,readiness:'READY'});
  const encoded = writeListingSearch('?campaign=portfolio&location=Old&amenities=Old',basic,selected);
  const restored = readListingSearch(encoded);
  assert.deepEqual(restored.advanced,selected);
  for (const [key,value] of Object.entries(basic)) assert.equal(restored.basic[key],value);
  assert.equal(new URLSearchParams(encoded).get('campaign'),'portfolio');
  const cleared = writeListingSearch(encoded,{},emptyAdvancedFilters());
  assert.equal(cleared,'campaign=portfolio');
});

test('Latest orders by creation date and preserves older saved newest searches', () => {
  const rows=[{id:'older',createdAt:'2026-01-01'}, {id:'missing'}, {id:'latest',createdAt:'2026-11-13'}];
  assert.deepEqual(rows.sort((a,b)=>compareListingActivity(a,b,'latest')).map(row=>row.id),['latest','older','missing']);
  assert.equal(readListingSearch('?sort=newest').basic.sort,'latest');
});

test('most viewed uses real non-negative counts and places missing metrics below zero views', () => {
  const rows=[{id:'missing',createdAt:'2026-11-13'}, {id:'zero',viewCount:0}, {id:'popular',viewCount:100}, {id:'less',viewCount:5}];
  assert.deepEqual(rows.sort((a,b)=>compareListingActivity(a,b,'most-viewed')).map(row=>row.id),['popular','less','zero','missing']);
  assert.equal(hasListingViews(property()),false);
  assert.equal(property({viewCount:0}).viewCount,0);
  assert.equal(property({viewCount:100}).viewCount,100);
  for(const viewCount of [-1,'100',Infinity,1.5]) assert.equal(property({viewCount}).viewCount,null);
  assert.equal(readListingSearch('?sort=most-viewed').basic.sort,'most-viewed');
});

test('invalid query values cannot inject non-finite amounts or unsupported choices', () => {
  const {basic,advanced} = readListingSearch('?minPrice=Infinity&maxPrice=-3&minArea=NaN&maxArea=10&beds=invalid&sort=invalid&price=invalid&currency=bad&sector=unknown&baths=99&readiness=unknown');
  assert.equal(basic.beds,''); assert.equal(basic.sort,''); assert.equal(basic.price,'');
  assert.deepEqual(advanced,filters({maxArea:'10'}));
  assert.match(rangeError(filters({minPrice:'200',maxPrice:'100'})),/Maximum price/);
  assert.match(rangeError(filters({minArea:'10',maxArea:'0'})),/Maximum area/);
  assert.match(rangeError(filters({minPrice:'-1'})),/valid price/);
  assert.equal(rangeError(filters({minPrice:'0',maxPrice:'0'})),'');
});

test('room pills match exact counts and use plus only for the final ranges', () => {
  assert.equal(matchesRoomCount(3,'3'),true);
  assert.equal(matchesRoomCount(4,'3'),false);
  assert.equal(matchesRoomCount(0,'studio'),true);
  assert.equal(matchesRoomCount(null,'studio'),false);
  assert.equal(matchesRoomCount(9,'8+'),true);
  assert.equal(matchesRoomCount(7,'8+'),false);
  assert.equal(matchesAdvancedFilters(property({bathrooms:3}),filters({baths:'2'})),false);
  assert.equal(matchesAdvancedFilters(property({bathrooms:7}),filters({baths:'6+'})),true);
});

test('contextual search uses published rental periods, handover dates and payment plans', () => {
  const supplied=property({transactionType:'RENT',rentFrequency:'MONTHLY',handoverDate:'2028-06-01',paymentPlan:'60/40'});
  assert.equal(supplied.rentFrequency,'MONTHLY');
  assert.equal(supplied.handoverYear,2028);
  assert.equal(matchesAdvancedFilters(supplied,filters({rentFrequency:'MONTHLY',handoverBy:'2028',paymentPlan:'60/40'})),true);
  assert.equal(matchesAdvancedFilters(supplied,filters({rentFrequency:'YEARLY'})),false);
  assert.equal(matchesAdvancedFilters(supplied,filters({handoverBy:'2027'})),false);
  assert.equal(matchesAdvancedFilters(property(),filters({handoverBy:'2028'})),false);
  assert.equal(property().rentFrequency,null);
  assert.equal(property().handoverYear,null);
  assert.equal(property().paymentPlan,'');
  const restored=readListingSearch(writeListingSearch('',{beds:'8+'},filters({baths:'6+',rentFrequency:'MONTHLY',handoverBy:'2028',paymentPlan:'60/40'})));
  assert.equal(restored.basic.beds,'8+');
  assert.equal(restored.advanced.baths,'6+');
  assert.equal(restored.advanced.rentFrequency,'MONTHLY');
  assert.equal(restored.advanced.handoverBy,'2028');
  assert.equal(restored.advanced.paymentPlan,'60/40');
});
