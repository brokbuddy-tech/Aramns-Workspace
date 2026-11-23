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
 const row=await bar.locator('.property-search-toolbar > *').evaluateAll(elements=>elements.map(element=>element.getBoundingClientRect().top));
 expect(Math.max(...row)-Math.min(...row)).toBeLessThan(1);
 const search=await bar.getByRole('button',{name:'Search',exact:true}).boundingBox();
 const ai=await bar.getByRole('button',{name:'AI Search',exact:true}).boundingBox();
 expect(ai.x).toBeGreaterThan(search.x);expect(ai.y).toBe(search.y);
 await expect(bar).not.toContainText('Find a home that fits what you have in mind.');
 await expect(bar).not.toContainText('Search by description');
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
 await page.goto('/contact');const form=page.getByRole('form',{name:'Contact enquiry'});
 await form.getByLabel('Nationality').fill('Indian');await form.getByRole('radio',{name:'Customer',exact:true}).check();await form.getByRole('button',{name:'Continue'}).click();
 await form.getByLabel('Full name').fill('Test Person');await form.getByLabel('Phone number').fill('+971500000000');await form.getByRole('radio',{name:'Buy property'}).check();await form.getByRole('button',{name:'Continue'}).click();
 await form.getByRole('radio',{name:'Residential',exact:true}).check();await form.getByLabel('Property type').selectOption('Apartment');await form.getByLabel('Completion status').selectOption('Ready');await form.getByRole('button',{name:'Continue'}).click();
 await form.getByRole('button',{name:'Send enquiry'}).click();await expect(page.getByRole('alert')).toHaveText('Please retry safely.');await expect(form).toContainText('Apartment');await expect(form).toContainText('Ready');await form.getByRole('button',{name:'Send enquiry'}).click();await expect(page.getByRole('heading',{name:'Enquiry received'})).toBeVisible();expect(submissions).toHaveLength(2);expect(submissions[0].key).toBe(submissions[1].key);expect(submissions[0].body.name).toBe('Test Person');expect(submissions[0].body.message).toContain('Nationality: Indian');
});
test('listing representative replaces booking and provides property sharing on desktop and mobile',async({page})=>{
 const agent={...data.agent,whatsapp:'+971500000000',officeLicenseId:'ORN-12890'};
 await page.route('**/api/site*',route=>route.fulfill({json:{...data,agent,selectedProperty:{...data.properties[0],neighborhood:'Ajman',city:'Ajman',location:'CGFM+676 - Al Jerf Industrial 3 - Ajman - United Arab Emirates'}}}));
 await page.addInitScript(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{window.__copiedProperty=value;}}});});
 for(const width of [1440,390,320]) {
  await page.setViewportSize({width,height:900});await page.goto('/property/listing-1?preview=do-not-share');
  const card=page.getByRole('complementary',{name:'Test Broker',exact:true});await expect(card).toBeVisible();
  await expect(page.getByRole('button',{name:'Request Viewing',exact:true})).toHaveCount(0);await expect(page.getByText('Schedule Private Viewing',{exact:true})).toHaveCount(0);
  await expect(page.locator('.property-detail-page').getByText('Al Jerf Industrial 3, Ajman',{exact:true}).filter({visible:true})).toHaveCount(2);
  await expect(card.getByText('Exclusive Listing Representative',{exact:true})).toHaveCount(0);
  await expect(card.getByText(/100%|verified|certified/i)).toHaveCount(0);
  await expect(card.locator('dt').filter({hasText:/^Listings$/})).toBeVisible();
  await expect(card.locator('dt').filter({hasText:/^Experience$/})).toBeVisible();
  await expect(card.getByText('Languages:',{exact:true})).toHaveCount(0);
  await expect(card.getByText('Specialization:',{exact:true})).toHaveCount(0);
  await expect(card.locator('.listing-representative-credentials')).toContainText('ORN-12890');
  const photo=await card.locator('.listing-representative-photo').boundingBox(),identity=await card.locator('.listing-representative-identity').boundingBox();
  expect(photo.width).toBeLessThanOrEqual(width>=1024 ? 180:108);expect(identity.x).toBeGreaterThan(photo.x+photo.width);
  await expect(card.getByRole('link',{name:'Call Advisor',exact:true})).toHaveAttribute('href','tel:+971500000000');
  await expect(card.getByRole('link',{name:'WhatsApp',exact:true})).toHaveAttribute('href',/^https:\/\/wa.me\/971500000000\?/);
  await expect(card.getByRole('link',{name:'WhatsApp',exact:true})).toHaveCSS('background-color','rgb(37, 211, 102)');
  await expect(card.getByRole('link',{name:/Share property on/})).toHaveCount(4);
  for(const link of await card.getByRole('link',{name:/Share property on/}).all()) {
   const url=new URL(await link.getAttribute('href'));expect([...url.searchParams.values()].some(value=>value.includes('/property/listing-1'))).toBe(true);expect(url.search).not.toContain('preview');
  }
  await card.getByRole('button',{name:'Copy property link',exact:true}).click();await expect(card.getByRole('status')).toHaveText('Link copied');
  expect(await page.evaluate(()=>window.__copiedProperty)).toBe(new URL('/property/listing-1',page.url()).href);
  const rows=await card.locator('.listing-share-icons > *').evaluateAll(elements=>elements.map(el=>el.getBoundingClientRect().top));expect(Math.max(...rows)-Math.min(...rows)).toBeLessThan(1);
  if(width===1440) expect(await card.evaluate(el=>el.getBoundingClientRect().height<=innerHeight-48)).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await card.screenshot({path:`.verification/listing-representative-${width}.png`});
 }
});
test('broker card omits languages and specialization with compact spacing at every breakpoint',async({page})=>{
 const specialization='Residential and commercial rental/Sales of Apartments, Villas, Shops, Warehouses, Labor Camps, Sub leasing Properties, Free Hold Properties and Lands.';
 const agent={...data.agent,title:'Helping buyers, sellers, and investors move with confidence.',whatsapp:'+971500000000',languages:['Hindi','Urdu','English','Punjabi','Bangali'],specialization};
 await page.route('**/api/site*',route=>route.fulfill({json:{...data,agent,selectedProperty:data.properties[0]}}));
 for(const width of [320,402,768,1024,1600]) {
  await page.setViewportSize({width,height:874});await page.goto('/property/listing-1');
  const card=page.getByRole('complementary',{name:'Test Broker',exact:true});
  await expect(card).toBeVisible();await page.evaluate(()=>document.fonts.ready);
  await expect(card).not.toContainText('Languages:');await expect(card).not.toContainText('Specialization:');await expect(card).not.toContainText(specialization);
  await expect(card.getByRole('button',{name:'Show more',exact:true})).toHaveCount(0);
  await expect(card.getByRole('link',{name:'Call Advisor',exact:true})).toBeVisible();await expect(card.getByRole('link',{name:'WhatsApp',exact:true})).toBeVisible();
  const layout=await card.evaluate(el=>({height:el.getBoundingClientRect().height,gaps:[...el.children].slice(1).map((child,index)=>child.getBoundingClientRect().top-el.children[index].getBoundingClientRect().bottom)}));
  expect(layout.height).toBeLessThan(550);for(const gap of layout.gaps) {expect(gap).toBeGreaterThanOrEqual(20);expect(gap).toBeLessThanOrEqual(24);}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await card.screenshot({path:`.verification/listing-compact-${width}.png`,style:'header.fixed, button[aria-label="Back to top"] { display:none !important; }'});
 }
});
test('financing consultation modal and existing footer scheduler submit real payloads',async({page})=>{
 const submissions=[];await page.route('**/api/inquiries',route=>{submissions.push(route.request().postDataJSON());return route.fulfill({json:{ok:true}});});
 await page.goto('/property/listing-1');await page.getByRole('button',{name:'Request Financing Consultation'}).click();await page.getByPlaceholder('e.g. Katherine Pierce').fill('Test Person');await page.getByPlaceholder('k.pierce@capital.com').fill('test@example.test');await page.getByRole('dialog',{name:'Contact broker'}).locator('button[type="submit"]').click();await expect(page.getByText('Direct Message Dispatched',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Done',exact:true}).click();
 await page.getByRole('button',{name:'Private Viewing',exact:true}).click();await page.getByPlaceholder('e.g. Sterling Croft').fill('Test Person');await page.getByPlaceholder('principal@familyoffice.com').fill('test@example.test');await page.getByPlaceholder('+1 (555) 019-2834').fill('+971500000000');await page.getByRole('dialog',{name:'Schedule a viewing'}).locator('button[type="submit"]').click();await expect(page.getByText('Viewing Request Received',{exact:true})).toBeVisible();expect(submissions).toHaveLength(2);expect(submissions[1].listingId).toBe('listing-1');
});
test('rich text supports HTML, escaped HTML, Markdown, plain text and strips active content',async({page})=>{
 const formats=['<p>Hello <strong>world</strong></p>','&lt;p&gt;Hello &lt;strong&gt;world&lt;/strong&gt;&lt;/p&gt;','## Heading\n\n**Bold**\n\n- Item','Plain text\nAnother line','<script>alert(1)</script><img src=x onerror=alert(2)><a href="javascript:alert(3)">Unsafe</a><p style="color:red" onclick="alert(4)">Safe</p>'];
 let bio=formats[0];await page.route('**/api/site*',route=>route.fulfill({json:{...data,agent:{...data.agent,bio}}}));
 const results=[];
 for(const value of formats) {
  bio=value;await loaded(page);
  results.push(await page.locator('.profile-bio').innerHTML());
 }
 expect(results[0]).toContain('<strong>world</strong>');expect(results[1]).toContain('<strong>world</strong>');expect(results[1]).not.toContain('&lt;p&gt;');expect(results[2]).toContain('<h2>Heading</h2>');expect(results[2]).toContain('<li>Item</li>');expect(results[3]).toContain('Plain text<br>');expect(results[4]).not.toMatch(/script|onerror|onclick|javascript:|style=/i);
});
test('mobile navigation and map search remain usable with no horizontal overflow',async({page})=>{
 await page.setViewportSize({width:390,height:844});await loaded(page);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.getByRole('button',{name:'Open menu'}).click();await expect(page.getByRole('button',{name:'Close menu'})).toBeVisible();await page.getByRole('button',{name:'Close menu'}).click();
 await page.goto('/map');await expect(page.getByRole('region',{name:'Property map',exact:true})).toBeVisible();await expect(page.locator('.map-price-pin')).toHaveCount(27);await page.getByRole('searchbox',{name:'Search map properties'}).fill('Property 27');await expect(page.locator('.map-price-pin')).toHaveCount(1);
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
  await expect(page.getByText('Location unavailable.',{exact:true})).toHaveCount(0);
  await expect(page.getByRole('region',{name:'Property location',exact:true})).toContainText('Location');
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
  const filters=bar.getByRole('button',{name:'Filters',exact:true});
  await expect(filters).toHaveAttribute('aria-expanded','false');
  await expect(bar.getByRole('button',{name:/^Area/})).toBeHidden();
  await expect(bar.getByRole('button',{name:'Search',exact:true})).toBeVisible();
  await filters.click();
  await expect(filters).toHaveAttribute('aria-expanded','true');
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
  await page.keyboard.press('Escape');
  await expect(filters).toHaveAttribute('aria-expanded','false');
  await expect(filters).toBeFocused();
  await expect(bar.getByLabel('Sort By',{exact:true})).toBeHidden();
  await filters.click();await expect(bar.getByLabel('Sort By',{exact:true})).toBeVisible();
  await bar.getByRole('button',{name:'Search',exact:true}).click();
  await expect(filters).toHaveAttribute('aria-expanded','false');
  await expect(cards(page)).toHaveCount(3);
  await page.setViewportSize({width:1440,height:1000});
  await expect(filters).toHaveCount(0);
  await expect(bar.getByLabel('Sort By',{exact:true})).toBeVisible();
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
  expect((await areas.getByRole('link').first().boundingBox()).height).toBeLessThan(40);
  if(path === '/properties') {
   const search=await page.getByRole('search',{name:'Property search'}).boundingBox();
   const results=await page.locator('#property-results').boundingBox();
   expect(Math.abs(search.x-results.x)).toBeLessThan(1);
   expect(Math.abs(search.width-results.width)).toBeLessThan(1);
  }
 }
});

test('legacy city-only communities produce working address-area links and hide empty navigation',async({page})=>{
 const properties=data.properties.slice(0,3).map((property,index)=>({...property,city:'Ajman',neighborhood:'Ajman',location:index < 2 ? 'CGFM+676 - Al Jerf Industrial 3 - Ajman - United Arab Emirates' : '1 University Street'}));
 await page.route('**/api/site*',route=>route.fulfill({json:{...data,properties}}));
 const clicks=[];await page.route('**/api/quick-link-clicks',route=>{clicks.push(route.request().postDataJSON());return route.fulfill({status:204});});
 await page.goto('/properties');
 const areas=page.getByRole('navigation',{name:'Popular areas'});
 await expect(areas.getByRole('link')).toHaveCount(1);
 await expect(areas.getByRole('link')).toContainText('Al Jerf Industrial 3');
 await areas.getByRole('link').click();await expect(cards(page)).toHaveCount(2);
 await page.reload();await expect(cards(page)).toHaveCount(2);expect(clicks).toHaveLength(0);
 await page.getByLabel('Search properties',{exact:true}).fill('no matching listing');
 await expect(areas).toHaveCount(0);
 await expect(page.getByText('No areas match the current search.',{exact:true})).toHaveCount(0);
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
 const search=await page.getByRole('search',{name:'Property search'}).boundingBox();
 const results=await page.locator('#property-results').boundingBox();
 expect(Math.abs(search.x-results.x)).toBeLessThan(1);
 expect(Math.abs(search.width-results.width)).toBeLessThan(1);
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
  if(viewport.width<768) await bar.getByRole('button',{name:'Filters',exact:true}).click();
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

test('profile moves icon-only official links below the portrait and expands the biography',async({page})=>{
 let agency='—';const bio='<p>'+('Synthetic professional biography. '.repeat(60))+'</p>';
 await page.route('**/api/site*',route=>route.fulfill({json:{...data,agent:{...data.agent,agency,bio,socialLinks:{facebook:'https://www.facebook.com/synthetic',linkedin:'https://www.linkedin.com/in/synthetic',instagram:'https://www.instagram.com/synthetic'}}}}));
 for(const width of [1440,390,320]) {
  await page.setViewportSize({width,height:900});await loaded(page);
  await expect(page.getByRole('button',{name:'Schedule Private Consultation'})).toHaveCount(0);
  const links=page.getByRole('navigation',{name:'Official links',exact:true});await expect(links.getByRole('link')).toHaveCount(5);
  expect(await links.innerText()).toBe('');await expect(page.locator('.profile-details .official-profile-links')).toHaveCount(0);
  await expect(page.getByText(/^Agency:/)).toHaveCount(0);await expect(page.locator('.profile-bio')).toContainText('Synthetic professional biography.');
  expect(await links.locator('a').evaluateAll(items=>items.every(item=>item.getBoundingClientRect().width>=44 && item.getBoundingClientRect().height>=44))).toBe(true);
  await expect.poll(()=>links.locator('img').evaluateAll(images=>images.every(img=>img.complete && img.naturalWidth>0))).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(width===1440) expect(await page.locator('.profile-bio').evaluate(el=>el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(220);
  await page.locator('.profile-header').screenshot({path:`.verification/profile-icons-${width}.png`});
 }
 agency='Synthetic Brokerage LLC';await loaded(page);await expect(page.getByText('Agency: Synthetic Brokerage LLC',{exact:true})).toBeVisible();await expect(page.getByText('Agency: Al Baqa Properties LLC',{exact:true})).toHaveCount(0);
});

test('broker metrics and contact fields disappear when the broker has not supplied them',async({page})=>{
 const sparse={...data.agent,languages:['','—'],experience:'—',licenseId:null,careerVolume:'—',agency:null,phone:'',email:'',bio:''};
 await page.route('**/api/site*',route=>route.fulfill({json:{...data,agent:sparse}}));
 await loaded(page);const header=page.locator('.profile-header');
 for(const label of ['Experience','License ID','Languages','Career Volume','Career Realization']) await expect(header.getByText(label,{exact:true})).toHaveCount(0);
 await expect(header.getByText(/^Agency:/)).toHaveCount(0);
 await expect(header.getByRole('link',{name:'Call Agent',exact:true})).toHaveCount(0);
 await expect(header.getByRole('link',{name:'Email Agent',exact:true})).toHaveCount(0);
 await expect(header.getByRole('button',{name:'Share Profile',exact:true})).toBeVisible();
 await expect(page.getByText(/Licensed ID/)).toHaveCount(0);
 await page.route('**/api/site*',route=>route.fulfill({json:{...data,agent:{...sparse,experience:'0 years',languages:['','English','—'],licenseId:'123',agency:'Test Agency'}}}));
 await loaded(page);
 for(const label of ['Experience','0+ years','Languages','English','License ID','123','Agency: Test Agency']) await expect(header.getByText(label,{exact:true}).first()).toBeVisible();
 await expect(header.getByText('Career Volume',{exact:true})).toHaveCount(0);
});

test('missing listing metrics disappear from cards and detail sections, while zero bedrooms remain',async({page})=>{
 const sparse={...data.properties[0],beds:null,baths:'—',sqft:null,propertyType:'',category:'',yearBuilt:null,heatingCooling:null,garage:null,hoaFees:null,lotSize:null,handover:'',paymentPlan:'',description:'',amenities:['','—'],neighborhood:'',city:'',cityState:'',location:'',country:'',coordinates:null};
 await page.route('**/api/site*',route=>route.fulfill({json:{...data,properties:[sparse],selectedProperty:sparse}}));
 await page.goto('/properties');await expect(cards(page)).toHaveCount(1);
 const listings=page.locator('#property-results');
 await expect(listings.getByText(/Beds|Baths|sqft/)).toHaveCount(0);
 await page.goto('/property/listing-1');await expect(page.getByRole('heading',{name:sparse.title,exact:true})).toBeVisible();
 await expect(page.getByLabel('Essential property specifications',{exact:true})).toHaveCount(0);
 for(const label of ['Bedrooms','Bathrooms','Total Area','Built Year','Parking','Plot / Lot','Climate & HVAC','Vehicular Garaging','Service Charges / HOA','Plot Dimension']) await expect(page.getByText(label,{exact:true})).toHaveCount(0);
 await expect(page.getByRole('heading',{name:'Description',exact:true})).toHaveCount(0);
 await expect(page.getByRole('heading',{name:'Amenities & Highlights',exact:true})).toHaveCount(0);
 await expect(page.getByRole('region',{name:'Property location',exact:true})).toHaveCount(0);
 await expect(page.getByText('ACTIVE',{exact:true})).toBeVisible();
 const supplied={...sparse,beds:0,baths:2,sqft:1250,propertyType:'Apartment',garage:0,hoaFees:0};
 await page.route('**/api/site*',route=>route.fulfill({json:{...data,properties:[supplied],selectedProperty:supplied}}));
 await page.goto('/property/listing-1');await expect(page.getByRole('heading',{name:sparse.title,exact:true})).toBeVisible();
 const specs=page.getByLabel('Essential property specifications',{exact:true});
 for(const label of ['Bedrooms','Bathrooms','Total Area','Parking','0 Suites','2 Baths','1,250 sqft']) await expect(specs.getByText(label,{exact:true})).toBeVisible();
 await expect(page.getByText('Service Charges / HOA',{exact:true})).toBeVisible();
});

test('mobile profile aligns contacts, location and sparse metrics without clipping',async({page})=>{
 const agent={...data.agent,name:'Arman Alam',experience:'4 years',licenseId:'3644',languages:['Hindi','Urdu','English','Punjabi','Bangali'],careerVolume:'—',region:'Ajman, Dubai',title:'Helping buyers, sellers, and investors move with confidence.',bio:'<p>'+('Public professional biography. '.repeat(60))+'</p>',socialLinks:{facebook:'https://www.facebook.com/synthetic',linkedin:'https://www.linkedin.com/in/synthetic',instagram:'https://www.instagram.com/synthetic'}};
 await page.route('**/api/site*',route=>route.fulfill({json:{...data,agent}}));
 for(const width of [320,360,390,430]) {
  await page.setViewportSize({width,height:844});await page.goto('/');await expect(page.locator('.profile-details h1')).toHaveText('Arman Alam');
  const contacts=page.locator('.profile-contact-actions');
  await expect(contacts.getByRole('link',{name:'Call Agent',exact:true})).toBeVisible();
  await expect(contacts.getByRole('link',{name:'Email Agent',exact:true})).toBeVisible();
  await expect(contacts.getByRole('button',{name:'Share Profile',exact:true})).toBeVisible();
  const boxes=await contacts.locator(':scope > *').evaluateAll(elements=>elements.map(el=>{const r=el.getBoundingClientRect();const label=el.querySelector('span');return {top:r.top,height:r.height,width:r.width,clipped:label.scrollWidth>label.clientWidth+1,whiteSpace:getComputedStyle(label).whiteSpace};}));
  expect(new Set(boxes.map(box=>box.top)).size).toBe(1);expect(new Set(boxes.map(box=>box.height)).size).toBe(1);
  for(const box of boxes) {expect(box.height).toBeGreaterThanOrEqual(44);expect(box.clipped).toBe(false);expect(box.whiteSpace).toBe('normal');}
  await expect(page.locator('.profile-region > span').last()).toHaveText('Ajman, Dubai');
  await expect(page.locator('.profile-region > span').first()).toBeHidden();
  await expect(page.locator('.profile-direct-links > span')).toBeHidden();
  const contactLinks=await page.locator('.profile-direct-links > a').evaluateAll(links=>links.map(link=>link.getBoundingClientRect().left));
  expect(new Set(contactLinks).size).toBe(1);
  const fonts=await page.locator('.profile-metric-label').evaluateAll(labels=>labels.map(label=>getComputedStyle(label).fontSize));expect(new Set(fonts)).toEqual(new Set(['10px']));
  const metrics=page.locator('.profile-metrics');const last=metrics.locator(':scope > div').last();
  expect((await last.boundingBox()).width).toBeGreaterThan((await metrics.boundingBox()).width*.8);
  expect(await page.getByRole('region',{name:'Broker biography'}).evaluate(el=>el.scrollHeight>el.clientHeight)).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('.profile-header').screenshot({path:`.verification/profile-aligned-${width}.png`});
 }
});

test('footer is the document boundary and scrolling stops at the bottom',async({page})=>{
 await page.route('**/api/feedback/config',route=>route.fulfill({json:{enabled:false}}));
 for(const width of [360,1440]) {
  await page.setViewportSize({width,height:780});
  for(const path of ['/','/properties','/property/listing-1','/contact']) {
   await page.goto(path);await expect(page.getByRole('contentinfo')).toContainText('Test Broker');
   await page.evaluate(async()=>{
    await document.fonts.ready;
    document.documentElement.style.scrollBehavior='auto';
    window.scrollTo(0,document.documentElement.scrollHeight);
   });
   const boundary=await page.evaluate(()=>{
    const footer=document.querySelector('footer'),scroller=document.scrollingElement;
    return {gap:scroller.scrollHeight-(footer.getBoundingClientRect().bottom+scrollY),maxScroll:scroller.scrollHeight-innerHeight,scroll:scrollY,behavior:getComputedStyle(document.documentElement).overscrollBehaviorY};
   });
   expect(boundary.gap,`${width}px ${path}: space after footer`).toBeLessThanOrEqual(1);
   expect(Math.abs(boundary.maxScroll-boundary.scroll)).toBeLessThanOrEqual(1);
   expect(boundary.behavior).toBe('none');
   await page.mouse.move(width/2,700);await page.mouse.wheel(0,1500);
   await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(boundary.scroll);
   await page.mouse.wheel(0,-500);
   await expect.poll(()=>page.evaluate(()=>scrollY)).toBeLessThan(boundary.scroll);
  }
 }
});

test('listing advisor keeps compact spacing and fits the desktop viewport',async({page})=>{
 const agent={...data.agent,whatsapp:'+971500000000',experience:'4 years',languages:['Hindi','Urdu','English','Punjabi','Bangali'],specialization:'Residential and commercial rental/Sales of Apartments, Villas, Shops, Warehouses, Labor Camps, Sub leasing Properties, Free Hold Properties and Lands.'};
 const property={...data.properties[0],description:Array.from({length:70},()=>'<p>A detailed public property description covering location, dimensions, availability and amenities.</p>').join('')};
 await page.route('**/api/site*',route=>route.fulfill({json:{...data,agent,selectedProperty:property}}));
 for(const viewport of [{width:1600,height:900},{width:1280,height:680}]) {
  await page.setViewportSize(viewport);await page.goto('/property/listing-1');
  await expect(page.getByRole('heading',{name:property.title,exact:true})).toBeVisible();
  const card=page.getByRole('complementary',{name:'Test Broker',exact:true});
  await page.evaluate(async()=>{await document.fonts.ready;const column=document.querySelector('.listing-representative-column');window.scrollTo({top:scrollY+column.getBoundingClientRect().top+200,behavior:'instant'});});
  await expect(page.locator('.site-header')).toHaveAttribute('data-visible','false');
  await expect(page.locator('.site-header')).toHaveCSS('opacity','0');
  await expect.poll(()=>card.evaluate(el=>Math.round(el.getBoundingClientRect().top))).toBe(24);
  expect(await card.evaluate(el=>innerHeight-el.getBoundingClientRect().bottom)).toBeGreaterThanOrEqual(23);
  const gaps=await card.evaluate(el=>[...el.children].slice(1).map((child,index)=>Math.round(child.getBoundingClientRect().top-el.children[index].getBoundingClientRect().bottom)));
  for(const gap of gaps) expect(gap).toBe(20);
  await card.evaluate(el=>{el.scrollTop=el.scrollHeight;});
  await expect(card.getByRole('button',{name:'Copy property link',exact:true})).toBeInViewport();
  await page.screenshot({path:`.verification/listing-advisor-filled-${viewport.width}.png`});
  await page.mouse.move(300,300);await page.mouse.wheel(0,-80);
  await expect(page.locator('.site-header')).toHaveAttribute('data-visible','true');
  await expect.poll(()=>card.evaluate(el=>Math.round(el.getBoundingClientRect().top))).toBe(112);
  expect(await card.evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight-23)).toBe(true);
 }
 await page.setViewportSize({width:390,height:844});await page.goto('/property/listing-1');
 const card=page.getByRole('complementary',{name:'Test Broker',exact:true});await expect(card).toBeVisible();
 expect(await card.evaluate(el=>getComputedStyle(el).maxHeight)).toBe('none');
 expect(await page.locator('.listing-representative-column').evaluate(el=>getComputedStyle(el).position)).toBe('static');
});
