import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AJMAN_VIEWPORT,buildMapAreas,defaultMapArea,getMapViewport,matchesMapArea,validCoordinates,listingCity} from '../src/lib/map-geography.mjs';

const ajman = [
  {id:'a',city:'Ajman',neighborhood:'Al Jurf 3',coordinates:{lat:25.43,lng:55.59}},
  {id:'b',city:'Ajman',neighborhood:'Al Rawda',coordinates:{lat:25.40,lng:55.48}},
];
const dubai = {id:'c',city:'Dubai',neighborhood:'Business Bay',coordinates:{lat:25.19,lng:55.26}};

test('Ajman is the default when other cities also have listings', () => {
  const areas=buildMapAreas([dubai,...ajman]);
  assert.equal(defaultMapArea(areas),'ajman');
  const area=areas.find(area=>area.id==='ajman');
  assert.equal(area.count,2);
  assert.deepEqual([dubai,...ajman].filter(property=>matchesMapArea(property,area)).map(property=>property.id),['a','b']);
  assert.deepEqual(area.viewport.bounds,{south:25.40,north:25.43,west:55.48,east:55.59});
  assert.deepEqual(areas[0].viewport.bounds,{south:25.19,north:25.43,west:55.26,east:55.59});
});

test('areas come from the inventory, handle spelling case, and separate equal names in different cities', () => {
  const inventory=[...ajman,{...ajman[0],city:' ajman ',neighborhood:'al jurf 3'}, {...dubai,neighborhood:'Al Rawda'}];
  const areas=buildMapAreas(inventory);
  assert.equal(areas.filter(area=>area.kind==='city' && area.name==='Ajman').length,1);
  assert.equal(areas.find(area=>area.id==='al-jurf-3').count,2);
  assert.equal(areas.some(area=>area.id==='palm-jumeirah'),false);
  const duplicates=areas.filter(area=>area.kind==='community' && area.value==='Al Rawda');
  assert.equal(new Set(duplicates.map(area=>area.id)).size,2);
  assert.equal(inventory.filter(property=>matchesMapArea(property,duplicates.find(area=>area.city==='Ajman'))).length,1);
});

test('empty or invalid locations use an Ajman viewing area without inventing pins', () => {
  const properties=[{city:'Ajman',coordinates:null},{city:'Ajman',coordinates:{lat:NaN,lng:55.5}},{city:'Ajman',coordinates:{lat:91,lng:181}}];
  assert.equal(getMapViewport(properties),AJMAN_VIEWPORT);
  assert.equal(properties.filter(property=>validCoordinates(property.coordinates)).length,0);
  assert.equal(defaultMapArea(buildMapAreas([])),'all');
  assert.equal(buildMapAreas([...properties,dubai]).find(area=>area.id==='ajman').viewport,AJMAN_VIEWPORT);
});

test('single properties and coincident pins have an exact centre while zero coordinates remain valid', () => {
  const point={coordinates:{lat:0,lng:0}};
  assert.equal(validCoordinates(point.coordinates),true);
  assert.deepEqual(getMapViewport([point]),{center:{lat:0,lng:0},zoom:16,bounds:null});
  assert.deepEqual(getMapViewport([ajman[0],ajman[0]]),{center:ajman[0].coordinates,zoom:16,bounds:null});
});

test('older feeds can derive cities from cityState without treating a community as a city', () => {
  assert.equal(listingCity({neighborhood:'Al Jurf 3',cityState:'Al Jurf 3, Ajman'}),'Ajman');
  assert.equal(listingCity({neighborhood:'Al Jurf 3',cityState:'Al Jurf 3'}),'');
  assert.equal(defaultMapArea(buildMapAreas([dubai])),'dubai');
});
