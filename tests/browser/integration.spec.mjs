import {test,expect} from '@playwright/test';
import {createBrokerClient} from '../../server/brokbuddy.mjs';
import {mockApi,env} from '../fixtures.mjs';
import {installMapsMock} from './maps-mock.mjs';
let data;
test.beforeAll(async()=>{data=await createBrokerClient({env,fetchImpl:mockApi().fetchImpl}).site();});
test.beforeEach(async({page})=>{
  await installMapsMock(page);
  // Every submission is intercepted. Browser tests must never create real leads.
  await page.route('**/api/inquiries',route=>route.fulfill({status:503,json:{message:'Mock submission unavailable.'}}));
  await page.route('**/api/visitor',route=>route.fulfill({json:{ok:true}}));
  await page.route('**/api/property-views/*',route=>route.fulfill({json:{ok:true}}));
  await page.route('**/api/quick-link-clicks',route=>route.fulfill({json:{ok:true}}));
  await page.route('**/api/site*',route=>{
    const id=new URL(route.request().url()).searchParams.get('listingId');
    return route.fulfill({json:{...data,selectedProperty:id ? data.properties.find(p=>p.id===id) || null:null}});
  });
  await page.route('https://api.example.test/**',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"><rect width="640" height="400" fill="#e7e5e4"/></svg>'}));
});
const cards=page=>page.locator('button[aria-label="View property details"]');
async function loaded(page,path='/') {await page.goto(path);await expect(page.getByRole('heading',{name:/Test Broker/}).first()).toBeVisible();}
test('all inventory, existing load-more and search include the final API page',async({page})=>{
 await page.goto('/properties');await expect(cards(page)).toHaveCount(6);await page.getByRole('button',{name:/Load More Properties/}).click();await expect(cards(page)).toHaveCount(12);
 await page.getByLabel('Search properties',{exact:true}).fill('Property 27');await expect(cards(page)).toHaveCount(1);await expect(page.getByRole('heading',{name:'Property 27',exact:true})).toBeVisible();
 await page.getByRole('heading',{name:'Property 27',exact:true}).click();await expect(page).toHaveURL(/\/property\/listing-27$/);await expect(page.getByRole('heading',{name:'Property 27',exact:true})).toBeVisible();
});
test('the unified search bar combines location, type, rooms, amenities, price and sorting',async({page})=>{
 await page.goto('/properties');await expect(cards(page)).toHaveCount(6);
 const bar=page.getByRole('search',{name:'Property search'});
 await bar.getByLabel('Search properties',{exact:true}).fill('Dubai Marina');
 await bar.getByRole('button',{name:/^Property type/}).click();
 await bar.getByRole('dialog').getByRole('group',{name:'Property type',exact:true}).getByRole('button',{name:'Apartment',exact:true}).click();
 await bar.getByRole('dialog').getByRole('button',{name:'Done',exact:true}).click();
 await bar.getByRole('button',{name:/^Beds & Baths/}).click();
 await page.getByRole('dialog').getByRole('group',{name:'Bedrooms',exact:true}).getByRole('button',{name:'3',exact:true}).click();
 await page.getByRole('dialog').getByRole('button',{name:'Done',exact:true}).click();
 await bar.getByRole('button',{name:/^Amenities/}).click();
 await page.getByRole('dialog').getByLabel('Private Pool',{exact:true}).check();
 await page.getByRole('dialog').getByRole('button',{name:'Done',exact:true}).click();
 const titles=await page.locator('h3.line-clamp-1').allTextContents();expect(titles.length).toBeGreaterThan(0);for(const title of titles){const p=data.properties.find(p=>p.title===title);expect(p.neighborhood).toBe('Dubai Marina');expect(p.beds).toBeGreaterThanOrEqual(3);}
 await bar.getByRole('button',{name:'Reset Filters',exact:true}).click();
 await bar.getByLabel('Sort By',{exact:true}).selectOption('price-desc');await expect(page.locator('h3.line-clamp-1').first()).toHaveText('Property 27');
 await bar.getByRole('button',{name:/^Price/}).click();
 await page.getByRole('dialog').getByLabel('Maximum price (aed)').fill('15000000');
 await page.getByRole('dialog').getByRole('button',{name:'Done',exact:true}).click();await expect(cards(page)).toHaveCount(6);
 await bar.getByRole('button',{name:'AI Search',exact:true}).click();await page.locator('textarea').fill('waterfront');await page.getByRole('button',{name:'Search Residences',exact:true}).click();await expect(cards(page)).toHaveCount(6);await expect(page.getByText('Description Search Active',{exact:true})).toBeVisible();
});
test('direct detail, unique photo counts, safe rich text and rental calculator suppression',async({page})=>{
 await page.goto('/property/listing-1');await expect(page.getByRole('heading',{name:'Property 01',exact:true})).toBeVisible();await expect(page.getByText('Photo 1 of 2',{exact:true})).toBeVisible();await expect(page.getByRole('heading',{name:'Mortgage Calculator',exact:true})).toBeVisible();await expect(page.locator('strong').filter({hasText:'waterfront'})).toBeVisible();
 await page.locator('img[alt="Property 01"]').first().click();await expect(page.getByText('Property 01 — 1 / 2',{exact:true})).toBeVisible();await page.keyboard.press('Escape');
 await page.goto('/property/listing-3');await expect(page.getByRole('heading',{name:'Property 03',exact:true})).toBeVisible();await expect(page.getByRole('heading',{name:'Mortgage Calculator',exact:true})).toHaveCount(0);await expect(page.getByText(/AED.*300,000/).first()).toBeVisible();expect(await page.locator('body').innerText()).not.toMatch(/300,000.*(?:year|month)/);
});
test('missing details, valid empty inventory and failed feeds have distinct states',async({page})=>{
 await page.goto('/property/missing');await expect(page.getByRole('heading',{name:'Property Not Found'})).toBeVisible();
 await page.route('**/api/site*',route=>route.fulfill({json:{...data,properties:[]}}));await loaded(page);await expect(page.getByText('No active listings available',{exact:true})).toBeVisible();
 await page.route('**/api/site*',route=>route.fulfill({status:503,json:{message:'Unavailable'}}));await page.reload();await expect(page.getByRole('heading',{name:'Website unavailable'})).toBeVisible();await expect(page.locator('footer,nav')).toHaveCount(0);await expect(page.locator('body')).not.toContainText('Test Broker');expect(await page.title()).toBe('Property Portfolio');
});
test('contact failure retains input; unchanged retries reuse the key; success needs confirmation',async({page})=>{
 const submissions=[];await page.route('**/api/inquiries',async route=>{submissions.push({body:route.request().postDataJSON(),key:route.request().headers()['idempotency-key']});return route.fulfill({status:submissions.length===1 ? 502:200,json:submissions.length===1 ? {message:'Please retry safely.'}:{ok:true}});});
 await page.goto('/contact');await page.locator('[name="firstName"]').fill('Test');await page.locator('[name="lastName"]').fill('Person');await page.locator('[name="email"]').fill('test@example.test');await page.locator('[name="message"]').fill('Please contact me about an apartment.');
 await page.locator('button[type="submit"]').click();await expect(page.getByRole('alert')).toHaveText('Please retry safely.');await expect(page.locator('[name="message"]')).toHaveValue('Please contact me about an apartment.');await page.locator('button[type="submit"]').click();await expect(page.getByText(/Your inquiry regarding/)).toBeVisible();expect(submissions).toHaveLength(2);expect(submissions[0].key).toBe(submissions[1].key);expect(submissions[0].body.name).toBe('Test Person');
});
test('viewing enquiry preserves listing, preferred date/time and confirmed success',async({page})=>{
 let submitted;await page.route('**/api/inquiries',route=>{submitted=route.request().postDataJSON();return route.fulfill({json:{ok:true}});});
 await page.goto('/property/listing-1');await expect(page.getByRole('heading',{name:'Property 01',exact:true})).toBeVisible();await page.locator('input[type="date"]').fill('2026-12-15');await page.getByPlaceholder('e.g. Lord Alexander Sinclair').fill('Test Person');await page.getByPlaceholder('vip@domain.com').fill('test@example.test');await page.getByRole('button',{name:'Request Viewing',exact:true}).click();await expect(page.getByText('Showing Request Confirmed',{exact:true})).toBeVisible();expect(submitted.listingId).toBe('listing-1');expect(submitted.message).toContain('2026-12-15');expect(submitted.message).toContain('14:00');
});
test('broker consultation modal and existing footer scheduler submit real payloads',async({page})=>{
 const submissions=[];await page.route('**/api/inquiries',route=>{submissions.push(route.request().postDataJSON());return route.fulfill({json:{ok:true}});});
 await loaded(page);await page.getByRole('button',{name:'Schedule Private Consultation'}).click();await page.getByPlaceholder('e.g. Katherine Pierce').fill('Test Person');await page.getByPlaceholder('k.pierce@capital.com').fill('test@example.test');await page.locator('button[type="submit"]').click();await expect(page.getByText('Direct Message Dispatched',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Done',exact:true}).click();
 await page.getByRole('button',{name:'Private Viewing',exact:true}).click();await page.getByPlaceholder('e.g. Sterling Croft').fill('Test Person');await page.getByPlaceholder('principal@familyoffice.com').fill('test@example.test');await page.getByPlaceholder('+1 (555) 019-2834').fill('+971500000000');await page.locator('button[type="submit"]').click();await expect(page.getByText('Viewing Request Received',{exact:true})).toBeVisible();expect(submissions).toHaveLength(2);expect(submissions[1].listingId).toBe('listing-1');
});
test('rich text supports HTML, escaped HTML, Markdown, plain text and strips active content',async({page})=>{
 const formats=['<p>Hello <strong>world</strong></p>','&lt;p&gt;Hello &lt;strong&gt;world&lt;/strong&gt;&lt;/p&gt;','## Heading\n\n**Bold**\n\n- Item','Plain text\nAnother line','<script>alert(1)</script><img src=x onerror=alert(2)><a href="javascript:alert(3)">Unsafe</a><p style="color:red" onclick="alert(4)">Safe</p>'];
 let bio=formats[0];await page.route('**/api/site*',route=>route.fulfill({json:{...data,agent:{...data.agent,bio}}}));
 const results=[];
 for(const value of formats) {
  bio=value;await loaded(page);
  results.push(await page.locator('[class*="max-h-[140px]"]').innerHTML());
 }
 expect(results[0]).toContain('<strong>world</strong>');expect(results[1]).toContain('<strong>world</strong>');expect(results[1]).not.toContain('&lt;p&gt;');expect(results[2]).toContain('<h2>Heading</h2>');expect(results[2]).toContain('<li>Item</li>');expect(results[3]).toContain('Plain text<br>');expect(results[4]).not.toMatch(/script|onerror|onclick|javascript:|style=/i);
});
test('mobile navigation and map search remain usable with no horizontal overflow',async({page})=>{
 await page.setViewportSize({width:390,height:844});await loaded(page);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.getByRole('button',{name:'Open menu'}).click();await expect(page.getByRole('button',{name:'Close menu'})).toBeVisible();await page.getByRole('button',{name:'Close menu'}).click();
 await page.goto('/map');await expect(page.getByRole('region',{name:'Property map',exact:true})).toBeVisible();await expect(page.locator('.map-price-pin')).toHaveCount(27);await page.getByPlaceholder(/Search/).first().fill('Property 27');await expect(page.locator('.map-price-pin')).toHaveCount(1);
});
test('valuation form sends entered property details and preserves them on errors',async({page})=>{
 const submissions=[];await page.route('**/api/inquiries',route=>{submissions.push({body:route.request().postDataJSON(),key:route.request().headers()['idempotency-key']});return route.fulfill({status:submissions.length<3 ? 502:200,json:submissions.length<3 ? {message:'Please retry safely.'}:{ok:true}});});
 await page.goto('/sell');await page.getByPlaceholder('John Doe').fill('Test Person');await page.getByPlaceholder('john@example.com').fill('test@example.test');await page.getByPlaceholder('+1 (555) 000-0000').fill('+971500000000');await page.getByPlaceholder('123 Ocean Drive, Miami Beach, FL 33139').fill('Test property address');await page.locator('form select').selectOption('Modern Villa');
 await page.locator('button[type="submit"]').click();await expect(page.getByRole('alert')).toHaveText('Please retry safely.');await expect(page.getByPlaceholder('John Doe')).toHaveValue('Test Person');await page.locator('button[type="submit"]').click();await expect(page.getByRole('alert')).toHaveText('Please retry safely.');await page.getByPlaceholder('123 Ocean Drive, Miami Beach, FL 33139').fill('Revised property address');await page.locator('button[type="submit"]').click();await expect(page.getByText('Revised property address',{exact:true})).toBeVisible();expect(submissions[0].key).toBe(submissions[1].key);expect(submissions[2].key).not.toBe(submissions[1].key);expect(submissions[2].body.propertyType).toBe('Modern Villa');expect(submissions[2].body.message).toContain('Revised property address');
});

test('detail maps load on demand at the API location and do not expose feed credentials', async ({page}) => {
  const configRequests=[];
  page.on('request', request => {if(request.url().includes('/api/maps-config')) configRequests.push(request.url());});
  await page.goto('/property/listing-1');
  const location=page.getByRole('region',{name:'Property location',exact:true});
  await expect(location.getByRole('button',{name:'Show map',exact:true})).toBeVisible();
  expect(configRequests).toHaveLength(0);
  await location.getByRole('button',{name:'Show map',exact:true}).click();
  await expect(location.locator('[data-location-pin]')).toHaveCount(1);
  expect(configRequests).toHaveLength(1);
  expect(await page.evaluate(() => window.__mapsCalls.markers[0].position)).toEqual(data.properties[0].coordinates);
  expect(await page.content()).not.toContain(env.BROKBUDDY_BROKER_CODE);
});
test('price pin selection opens the matching detail and mobile recenter remains usable', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/map');
  await expect(page.locator('.map-price-pin')).toHaveCount(27);
  await page.getByRole('button',{name:'Property 01',exact:true}).click();
  await expect(page.locator('.map-price-pin.is-active')).toHaveCount(1);
  await page.getByTitle('Recenter area').click();
  await page.getByRole('button',{name:/^View Residence/}).click();
  await expect(page).toHaveURL(/\/property\/listing-1$/);
  await expect(page.getByRole('heading',{name:'Property 01',exact:true})).toBeVisible();
});
test('Maps failure preserves browsing and missing coordinates never produce an invented pin', async ({page}) => {
  await page.route('**/api/maps-config',route=>route.fulfill({json:{enabled:false}}));
  await page.goto('/map');
  await expect(page.getByText('The map is temporarily unavailable. You can still browse the property list.')).toBeVisible();
  await expect(page.getByPlaceholder(/Search/).first()).toBeVisible();
  await page.route('**/api/site*',route=>route.fulfill({json:{...data,selectedProperty:{...data.properties[0],coordinates:null}}}));
  await page.goto('/property/listing-1');
  await expect(page.getByText('Location unavailable.',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Show map',exact:true})).toHaveCount(0);
});
test('zero coordinates are valid and delayed Google authorization failures show a fallback', async ({page}) => {
  await page.route('**/api/site*',route=>route.fulfill({json:{...data,selectedProperty:{...data.properties[0],coordinates:{lat:0,lng:0}}}}));
  await page.goto('/property/listing-1');
  await page.getByRole('button',{name:'Show map',exact:true}).click();
  await expect(page.locator('[data-location-pin]')).toHaveCount(1);
  expect(await page.evaluate(() => window.__mapsCalls.markers[0].position)).toEqual({lat:0,lng:0});
  await page.evaluate(() => window.gm_authFailure());
  await expect(page.getByText('The map is temporarily unavailable.',{exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Property 01',exact:true})).toBeVisible();
});

test('Ajman maps default to local inventory and fit area filters, search and recenter', async ({page}) => {
  const properties=[
    {...data.properties[0],city:'Ajman',cityState:'Al Jurf 3, Ajman',neighborhood:'Al Jurf 3',coordinates:{lat:25.43,lng:55.59}},
    {...data.properties[1],city:'Ajman',cityState:'Al Rawda, Ajman',neighborhood:'Al Rawda',coordinates:{lat:25.40,lng:55.48}},
    {...data.properties[2],city:'Dubai',cityState:'Business Bay, Dubai',neighborhood:'Business Bay',coordinates:{lat:25.19,lng:55.26}},
  ];
  await page.route('**/api/site*',route=>route.fulfill({json:{...data,properties}}));
  await page.goto('/map');
  await expect(page.locator('.map-price-pin')).toHaveCount(2);
  const localBounds={south:25.40,north:25.43,west:55.48,east:55.59};
  await expect.poll(()=>page.evaluate(()=>window.__mapsCalls.bounds.at(-1)?.bounds)).toEqual(localBounds);
  await expect(page.getByRole('button',{name:'Palm Jumeirah',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Al Jurf 3',exact:true}).click();
  await expect(page.locator('.map-price-pin')).toHaveCount(1);
  await expect.poll(()=>page.evaluate(()=>window.__mapsCalls.maps[0].center)).toEqual(properties[0].coordinates);
  await page.getByRole('button',{name:'All Areas',exact:true}).click();
  await expect(page.locator('.map-price-pin')).toHaveCount(3);
  await expect.poll(()=>page.evaluate(()=>window.__mapsCalls.bounds.at(-1)?.bounds)).toEqual({south:25.19,north:25.43,west:55.26,east:55.59});
  await page.getByPlaceholder(/Search/).first().fill(properties[1].title);
  await expect(page.locator('.map-price-pin')).toHaveCount(1);
  await expect.poll(()=>page.evaluate(()=>window.__mapsCalls.maps[0].center)).toEqual(properties[1].coordinates);
  await page.getByPlaceholder(/Search/).first().fill('');
  await page.getByRole('button',{name:'Ajman',exact:true}).click();
  await page.getByTitle('Show this property on the map').first().click();
  await expect.poll(()=>page.evaluate(()=>window.__mapsCalls.maps[0].center)).toEqual(properties[0].coordinates);
  await page.getByTitle('Show properties in map').first().click();
  await expect.poll(()=>page.evaluate(()=>window.__mapsCalls.maps[0].center)).toEqual({lat:(25.4+25.43)/2,lng:(55.48+55.59)/2});
  await page.goto('/map?area=all');
  await expect(page.locator('.map-price-pin')).toHaveCount(3);
});

test('Ajman inventory without coordinates keeps an Ajman viewport and creates no fake pins', async ({page}) => {
  const properties=[
    {...data.properties[0],city:'Ajman',neighborhood:'Al Jurf 3',coordinates:null},
    {...data.properties[1],city:'Dubai',neighborhood:'Business Bay',coordinates:{lat:25.19,lng:55.26}},
  ];
  await page.route('**/api/site*',route=>route.fulfill({json:{...data,properties}}));
  await page.goto('/map');
  await expect(page.locator('[data-google-map="ready"]')).toBeVisible();
  await expect(page.locator('.map-price-pin')).toHaveCount(0);
  await expect.poll(()=>page.evaluate(()=>window.__mapsCalls.maps[0].center)).toEqual({lat:25.4052,lng:55.5136});
  expect(await page.evaluate(()=>window.__mapsCalls.markers)).toHaveLength(0);
});

test('dropdown filters combine results and persist through refresh and detail navigation', async ({page}) => {
  await page.goto('/properties');
  const bar=page.getByRole('search',{name:'Property search'});
  await expect(bar.getByRole('button',{name:/More filters/i})).toHaveCount(0);
  await expect(bar.getByRole('group',{name:'Completion status',exact:true})).toBeVisible();
  await bar.getByRole('button',{name:/^Price/}).click();
  let panel=page.getByRole('dialog');
  await panel.getByLabel('Minimum price (aed)').fill('500000');
  await panel.getByLabel('Maximum price (aed)').fill('1200000');
  await panel.getByRole('button',{name:'Done',exact:true}).click();
  await bar.getByRole('button',{name:/^Area/}).click();
  panel=page.getByRole('dialog');
  await panel.getByLabel('Minimum area (sq ft)').fill('1008');
  await panel.getByLabel('Maximum area (sq ft)').fill('1012');
  await panel.getByRole('button',{name:'Done',exact:true}).click();
  await bar.getByRole('group',{name:'Completion status',exact:true}).getByRole('button',{name:'Off-plan',exact:true}).click();
  const beforeMore=new URL(page.url()).search;
  await bar.getByRole('button',{name:/^Amenities/}).click();
  panel=page.getByRole('dialog');
  await panel.getByLabel('Private Pool',{exact:true}).check();
  await panel.getByLabel('Balcony',{exact:true}).check();
  await expect(panel.getByRole('button',{name:'Done',exact:true})).toBeEnabled();
  expect(new URL(page.url()).search).toBe(beforeMore);
  await panel.getByRole('button',{name:'Done',exact:true}).click();
  await expect(cards(page)).toHaveCount(2);
  const search=new URL(page.url()).search;
  expect(new URLSearchParams(search).getAll('amenities')).toEqual(['Private Pool','Balcony']);
  await page.reload();await expect(cards(page)).toHaveCount(2);
  await page.getByRole('heading',{name:'Property 08',exact:true}).click();
  await expect(page).toHaveURL(/\/property\/listing-8$/);
  await page.goBack();await expect(cards(page)).toHaveCount(2);
  expect(new URL(page.url()).search).toBe(search);
  await bar.getByRole('button',{name:'Remove Off-plan',exact:true}).click();await expect(cards(page)).toHaveCount(5);
  await bar.getByRole('button',{name:'Reset Filters',exact:true}).click();await expect(cards(page)).toHaveCount(6);
  expect(new URL(page.url()).search).toBe('');
});

test('invalid price ranges cannot apply, cancelling discards edits, and studio means zero bedrooms', async ({page}) => {
  await page.goto('/properties');
  const bar=page.getByRole('search',{name:'Property search'});
  const trigger=bar.getByRole('button',{name:/^Price/});
  await trigger.click();
  const panel=page.getByRole('dialog');
  await panel.getByLabel('Minimum price (aed)').fill('200000');
  await panel.getByLabel('Maximum price (aed)').fill('100000');
  await expect(panel.getByRole('alert')).toHaveText('Maximum price must be at least the minimum price.');
  await expect(panel.getByRole('button',{name:'Done',exact:true})).toBeDisabled();
  await page.keyboard.press('Escape');await expect(panel).toHaveCount(0);await expect(trigger).toBeFocused();
  await trigger.click();await expect(panel.getByLabel('Minimum price (aed)')).toHaveValue('');
  await panel.getByLabel('Minimum price (aed)').fill('500000');
  await panel.getByRole('button',{name:'Reset',exact:true}).click();
  await expect(panel.getByLabel('Minimum price (aed)')).toHaveValue('');
  await page.keyboard.press('Escape');
  await bar.getByRole('button',{name:/^Beds & Baths/}).click();
  await panel.getByRole('group',{name:'Bedrooms',exact:true}).getByRole('button',{name:'Studio',exact:true}).click();
  await panel.getByRole('button',{name:'Done',exact:true}).click();
  await expect(cards(page)).toHaveCount(5);
  for(const title of await page.locator('h3.line-clamp-1').allTextContents()) expect(data.properties.find(property=>property.title===title).beds).toBe(0);
  await expect(bar.getByRole('button',{name:'Remove Studio',exact:true})).toBeVisible();
});

test('mobile dropdowns belong to the search bar, fit the viewport and close with Escape', async ({page}) => {
  await page.setViewportSize({width:390,height:844});await page.goto('/properties');
  const bar=page.getByRole('search',{name:'Property search'});
  await bar.getByRole('button',{name:/^Area/}).click();
  let panel=bar.getByRole('dialog');
  await panel.getByLabel('Minimum area (sq ft)').fill('1025');await panel.getByLabel('Maximum area (sq ft)').fill('1027');
  const apply=panel.getByRole('button',{name:'Done',exact:true});
  await expect(apply).toBeInViewport();expect(await panel.evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
  await apply.click();await expect(cards(page)).toHaveCount(3);
  const trigger=bar.getByRole('button',{name:/^Amenities/});await trigger.click();
  panel=bar.getByRole('dialog');await expect(panel).toBeVisible();
  await page.keyboard.press('Escape');await expect(panel).toHaveCount(0);await expect(trigger).toBeFocused();
  await expect(bar.getByLabel('Sort By',{exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(await page.evaluate(()=>document.body.style.overflow)).not.toBe('hidden');
});

test('commercial searches compare the selected currency and replace rooms with area', async ({page}) => {
  const properties=[
    {...data.properties[0],id:'office',title:'Office',category:'Office',propertyType:'Office',propertyClass:'Commercial',beds:0,price:90000,floorPlanUrl:'https://api.example.test/plan.pdf'},
    {...data.properties[1],id:'warehouse',title:'Warehouse',category:'Warehouse',propertyType:'Warehouse',propertyClass:'Commercial',beds:0,currency:'USD',price:80000},
    {...data.properties[2],currency:'AED'},
  ];
  await page.route('**/api/site*',route=>route.fulfill({json:{...data,properties}}));await page.goto('/properties');
  const bar=page.getByRole('search',{name:'Property search'});
  await bar.getByRole('button',{name:/^Property type/}).click();
  let panel=bar.getByRole('dialog');await panel.getByRole('tab',{name:'Commercial',exact:true}).click();
  await panel.getByRole('button',{name:'Done',exact:true}).click();
  await bar.getByLabel('With floor plan',{exact:true}).check();
  await bar.getByRole('button',{name:/^Price/}).click();panel=bar.getByRole('dialog');
  await expect(panel.getByLabel('Minimum price',{exact:true})).toBeDisabled();
  await panel.getByLabel('Currency',{exact:true}).selectOption('AED');
  await panel.getByLabel('Minimum price (aed)').fill('50000');await panel.getByLabel('Maximum price (aed)').fill('100000');
  await panel.getByRole('button',{name:'Done',exact:true}).click();await expect(cards(page)).toHaveCount(1);
  await expect(page.getByRole('heading',{name:'Office',exact:true})).toBeVisible();
  await expect(bar.getByRole('button',{name:/^Beds & Baths/})).toHaveCount(0);
  await expect(bar.getByRole('button',{name:/^Area/})).toBeVisible();
  await expect(bar.getByLabel('Sort By',{exact:true}).locator('option[value="price-asc"]')).toBeEnabled();
});

test('Latest uses creation dates and Hottest deals ranks real view counts with missing counts last',async({page})=>{
 const properties=data.properties.map((property,index)=>({...property,createdAt:index===26 ? '2026-11-13T00:00:00.000Z' : '2026-01-01T00:00:00.000Z',viewCount:index===2 ? 1000 : index===0 ? 500 : null}));
 await page.route('**/api/site*',route=>route.fulfill({json:{...data,properties}}));await page.goto('/properties');
 const bar=page.getByRole('search',{name:'Property search'});
 await bar.getByLabel('Sort By',{exact:true}).selectOption('latest');await expect(page.locator('h3.line-clamp-1').first()).toHaveText('Property 27');
 await bar.getByLabel('Sort By',{exact:true}).selectOption('most-viewed');await expect(page.locator('h3.line-clamp-1').first()).toHaveText('Property 03');
 await expect(page.locator('h3.line-clamp-1').nth(1)).toHaveText('Property 01');
 await page.reload();await expect(bar.getByLabel('Sort By',{exact:true})).toHaveValue('most-viewed');await expect(page.locator('h3.line-clamp-1').first()).toHaveText('Property 03');
});

test('Hottest deals remains unavailable when the feed has no viewing data',async({page})=>{
 await page.goto('/properties?sort=most-viewed');
 const sort=page.getByRole('search',{name:'Property search'}).getByLabel('Sort By',{exact:true});
 await expect(sort.locator('option[value="most-viewed"]')).toHaveJSProperty('disabled',true);await expect(sort).toHaveValue('latest');
});

test('UAE quick-link cards count the complete inventory on the broker home and listing pages',async({page})=>{
 for(const path of ['/','/properties']) {
  await page.goto(path);
  const areas=page.getByRole('navigation',{name:'Popular areas'});
  await expect(areas.getByRole('link')).toHaveCount(2);
  await expect(areas.getByRole('link').first()).toContainText('Palm Jumeirah');
  await expect(areas.getByRole('link').first()).toContainText('14 listings');
  await expect(areas.getByRole('link').nth(1)).toContainText('13 listings');
  expect(await areas.innerText()).not.toContain('views');
 }
});

test('shared quick-link clicks outrank listing quantity and tracking failure preserves keyboard navigation',async({page})=>{
 const marinaId=JSON.stringify(['dubai','dubai marina']);
 const clicks=[];
 await page.route('**/api/site*',route=>route.fulfill({json:{...data,quickLinkClicks:[{id:marinaId,clickCount:1}]}}));
 await page.route('**/api/quick-link-clicks',route=>{
  clicks.push(route.request().postDataJSON());
  return route.fulfill({status:503,json:{message:'Analytics unavailable'}});
 });
 await page.goto('/');
 const first=page.getByRole('navigation',{name:'Popular areas'}).getByRole('link').first();
 await expect(first).toContainText('Dubai Marina');await expect(first).toContainText('13 listings');
 await first.focus();await page.keyboard.press('Enter');
 await expect(page).toHaveURL(/\/properties\?/);
 await expect(cards(page)).toHaveCount(6);
 expect(new URL(page.url()).searchParams.get('areaId')).toBe(marinaId);
 await expect.poll(()=>clicks.length).toBe(1);expect(clicks[0].areaId).toBe(marinaId);expect(clicks[0].eventId).toMatch(/^[0-9a-f-]{36}$/);
 for(const title of await page.locator('h3.line-clamp-1').allTextContents()) expect(data.properties.find(row=>row.title===title).neighborhood).toBe('Dubai Marina');
 await page.goto('/properties');
 await expect(page.getByRole('navigation',{name:'Popular areas'}).getByRole('link').first()).toContainText('Dubai Marina');
});

test('quick-link cards preserve rent filters, count matching inventory, and fit mobile screens',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/properties/rent?sort=price-desc&amenities=Balcony');
 const areas=page.getByRole('navigation',{name:'Popular areas'});
 await expect(areas.getByRole('link').first()).toContainText('Palm Jumeirah');
 await expect(areas.getByRole('link').first()).toContainText('5 listings');
 await expect(areas.getByRole('link').nth(1)).toContainText('4 listings');
 expect(await areas.evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await areas.getByRole('link').nth(1).click();
 const url=new URL(page.url());expect(url.pathname).toBe('/properties/rent');expect(url.searchParams.get('sort')).toBe('price-desc');expect(url.searchParams.getAll('amenities')).toEqual(['Balcony']);
 await expect(cards(page)).toHaveCount(4);
 await page.reload();await expect(cards(page)).toHaveCount(4);
});

test('Off-plan changes the primary fields and filters only supplied handover and payment information',async({page})=>{
 await page.goto('/properties');
 const bar=page.getByRole('search',{name:'Property search'});
 await bar.getByRole('group',{name:'Completion status',exact:true}).getByRole('button',{name:'Off-plan',exact:true}).click();
 await expect(bar.getByRole('button',{name:/^Handover by/})).toBeDisabled();
 await expect(bar.getByRole('button',{name:/^Payment plan/})).toBeDisabled();
 await expect(bar.getByRole('button',{name:/^Beds & Baths/})).toHaveCount(0);
 await expect(bar.getByRole('button',{name:/^Price/})).toBeVisible();
 const properties=data.properties.map(property=>({...property,handoverYear:['listing-4','listing-8'].includes(property.id) ? 2028 : 2030,paymentPlan:property.id==='listing-4' ? '60/40' : '50/50'}));
 await page.route('**/api/site*',route=>route.fulfill({json:{...data,properties}}));await page.reload();
 await bar.getByRole('button',{name:/^Handover by/}).click();
 await bar.getByRole('dialog').getByRole('button',{name:'2028',exact:true}).click();
 await bar.getByRole('dialog').getByRole('button',{name:'Done',exact:true}).click();await expect(cards(page)).toHaveCount(2);
 await bar.getByRole('button',{name:/^Payment plan/}).click();
 await bar.getByRole('dialog').getByRole('button',{name:'60/40',exact:true}).click();
 await bar.getByRole('dialog').getByRole('button',{name:'Done',exact:true}).click();await expect(cards(page)).toHaveCount(1);
 await expect(page.getByRole('heading',{name:'Property 04',exact:true})).toBeVisible();
});

test('Rent exposes rental periods and does not assume a period when none is supplied',async({page})=>{
 await page.goto('/properties/rent');
 const bar=page.getByRole('search',{name:'Property search'});
 await expect(bar.getByRole('group',{name:'Completion status',exact:true})).toHaveCount(0);
 await bar.getByRole('button',{name:/^Rental period/}).click();
 await expect(bar.getByRole('dialog').getByRole('button',{name:'Monthly',exact:true})).toBeDisabled();
 await page.keyboard.press('Escape');
 const properties=data.properties.map(property=>({...property,rentFrequency:['listing-3','listing-6'].includes(property.id) ? 'MONTHLY' : 'YEARLY'}));
 await page.route('**/api/site*',route=>route.fulfill({json:{...data,properties}}));await page.reload();
 await bar.getByRole('button',{name:/^Rental period/}).click();
 await bar.getByRole('dialog').getByRole('button',{name:'Monthly',exact:true}).click();
 await expect(cards(page)).toHaveCount(2);
 await expect(page.getByRole('heading',{name:'Property 03',exact:true})).toBeVisible();
 await expect(page.getByRole('heading',{name:'Property 06',exact:true})).toBeVisible();
 await page.reload();await expect(cards(page)).toHaveCount(2);
});

test('filter menus remain clickable over cards and clipping ancestors on desktop and mobile',async({page})=>{
 for(const viewport of [{width:1440,height:1000},{width:390,height:844}]) {
  await page.setViewportSize(viewport);await page.goto('/properties?photos=1');
  const bar=page.getByRole('search',{name:'Property search'});
  await expect(bar.getByLabel('With photos',{exact:true})).toHaveCount(0);
  await expect.poll(()=>new URL(page.url()).searchParams.has('photos')).toBe(false);
  await bar.evaluate(element=>{
   element.style.zIndex='0';element.style.transform='translateZ(0)';element.style.overflow='hidden';
   window.scrollTo(0,window.scrollY+element.getBoundingClientRect().top-80);
   const results=document.getElementById('property-results');
   results.style.position='relative';results.style.zIndex='2147483647';results.style.transform='translateZ(0)';
  });
  let overlaps=0;
  for(const name of [/^Property type/,/^Price/,/^Area/,/^Amenities/,/^Beds & Baths/]) {
   await bar.getByRole('button',{name}).click();
   const panel=bar.getByRole('dialog');
   await expect(panel.getByRole('button',{name:'Done',exact:true})).toBeInViewport();
   const result=await panel.evaluate(element=>{
    const panelBox=element.getBoundingClientRect();let overlaps=0;let covered=false;
    for(const card of document.querySelectorAll('#property-results > .grid > div')) {
     const box=card.getBoundingClientRect();
     const left=Math.max(panelBox.left+12,box.left+12),right=Math.min(panelBox.right-12,box.right-12);
     const top=Math.max(panelBox.top+12,box.top+12),bottom=Math.min(panelBox.bottom-12,box.bottom-12);
     if(left>=right || top>=bottom) continue;
     overlaps++;
     for(const fraction of [.2,.5,.8]) {
      const hit=document.elementFromPoint(left+(right-left)*fraction,top+(bottom-top)*fraction);
      if(!element.contains(hit)) covered=true;
     }
    }
    return {overlaps,covered};
   });
   overlaps+=result.overlaps;expect(result.covered).toBe(false);
   if(name.source==='^Beds & Baths') await panel.getByRole('button',{name:'Studio',exact:true}).click();
   await panel.getByRole('button',{name:'Done',exact:true}).click();
  }
  expect(overlaps).toBeGreaterThan(0);await expect(cards(page)).toHaveCount(5);
 }
});
