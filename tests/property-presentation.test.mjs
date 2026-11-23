import {test} from 'node:test';
import assert from 'node:assert/strict';
import {displayPropertyLocation,propertyShareLinks,whatsappContactUrl} from '../src/lib/property-presentation.mjs';
test('location labels prefer area and city over technical map addresses',()=>{
 const property={neighborhood:'Ajman',city:'Ajman',location:'CGFM+676 - Al Jerf Industrial 3 - Ajman - United Arab Emirates'};
 assert.equal(displayPropertyLocation(property),'Al Jerf Industrial 3, Ajman');
 assert.ok(property.location.startsWith('CGFM+676'));
 assert.equal(displayPropertyLocation({...property,neighborhood:'Al Jurf 3'}),'Al Jurf 3, Ajman');
 assert.equal(displayPropertyLocation({neighborhood:'Dubai Marina',city:'Dubai'}),'Dubai Marina, Dubai');
 assert.equal(displayPropertyLocation({city:'Ajman',neighborhood:'Ajman'}),'Ajman');
});
test('missing structured locations retain meaningful text without plus codes',()=>{
 assert.equal(displayPropertyLocation({location:'CGFM+676 - Al Jerf Industrial 3 - Ajman'}),'Al Jerf Industrial 3, Ajman');
 assert.equal(displayPropertyLocation({location:'CGFM+676 - Al Jerf Industrial 3 - Ajman - United Arab Emirates'}),'Al Jerf Industrial 3, Ajman');
 assert.equal(displayPropertyLocation({neighborhood:'CGFM+676 - Al Jerf Industrial 3 - Ajman - United Arab Emirates',city:'Ajman'}),'Al Jerf Industrial 3, Ajman');
 assert.equal(displayPropertyLocation({location:'CGFM+676'}),'');
 assert.equal(displayPropertyLocation({location:'1 University Street'}),'1 University Street');
 assert.equal(displayPropertyLocation({}),'');
 assert.equal(displayPropertyLocation({location:'—',city:'N/A'}),'');
});
test('share links use only the canonical local property URL and encoded public title',()=>{
 const links=propertyShareLinks({id:'listing-1',title:'A home & garden #1'},'https://website.example/current?preview=private#section');
 assert.equal(links.url,'https://website.example/property/listing-1');
 for(const [kind,value] of Object.entries(links)) {
  if(kind==='url') continue;
  const url=new URL(value);assert.ok(!url.href.includes('preview='));
  assert.ok([...url.searchParams.values()].some(value=>value.includes(links.url)));
 }
 assert.equal(new URL(links.x).searchParams.get('text'),'A home & garden #1');
});
test('WhatsApp contact links require supplied valid contact data',()=>{
 for(const value of ['+971 50 000 0000','https://wa.me/971500000000','https://api.whatsapp.com/send?phone=971500000000']) {
  const url=new URL(whatsappContactUrl(value,'Hello & welcome'));
  assert.equal(url.pathname,'/971500000000');assert.equal(url.searchParams.get('text'),'Hello & welcome');
 }
 for(const value of ['',undefined,'not-a-number','https://foreign.example/?phone=971500000000','https://secret@wa.me/971500000000']) assert.equal(whatsappContactUrl(value,'hello'),null);
});
