import {test,expect} from '@playwright/test';
import {createBrokerClient} from '../../server/brokbuddy.mjs';
import {mockApi,env} from '../fixtures.mjs';
let data;
test.beforeAll(async()=>{data=await createBrokerClient({env,fetchImpl:mockApi().fetchImpl}).site();});
test.beforeEach(async({page})=>{
  // Every submission is intercepted. Browser tests must never create real leads.
  await page.route('**/api/inquiries',route=>route.fulfill({status:503,json:{message:'Mock submission unavailable.'}}));
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
 await page.getByPlaceholder(/Search all properties/).fill('Property 27');await expect(cards(page)).toHaveCount(1);await expect(page.getByRole('heading',{name:'Property 27',exact:true})).toBeVisible();
 await page.getByRole('heading',{name:'Property 27',exact:true}).click();await expect(page).toHaveURL(/\/property\/listing-27$/);await expect(page.getByRole('heading',{name:'Property 27',exact:true})).toBeVisible();
});
test('existing location, type, price, bedrooms, amenities and sorting match real values',async({page})=>{
 await page.goto('/properties');await expect(cards(page)).toHaveCount(6);const selects=page.locator('select');
 await selects.nth(0).selectOption('Dubai Marina');await selects.nth(1).selectOption('Apartment');await selects.nth(3).selectOption('3');await selects.nth(4).selectOption('pool');
 const titles=await page.locator('h3.line-clamp-1').allTextContents();expect(titles.length).toBeGreaterThan(0);for(const title of titles){const p=data.properties.find(p=>p.title===title);expect(p.neighborhood).toBe('Dubai Marina');expect(p.beds).toBeGreaterThanOrEqual(3);}
 await selects.nth(0).selectOption('All');await selects.nth(1).selectOption('All');await selects.nth(3).selectOption('All');await selects.nth(4).selectOption('All');await selects.nth(5).selectOption('price-desc');await expect(page.locator('h3.line-clamp-1').first()).toHaveText('Property 27');
 await selects.nth(2).selectOption('under-15m');await expect(cards(page)).toHaveCount(6);
 await page.getByRole('button',{name:'AI Search',exact:true}).click();await page.locator('textarea').fill('waterfront');await page.getByRole('button',{name:'Search Residences',exact:true}).click();await expect(cards(page)).toHaveCount(6);await expect(page.getByText('Description Search Active',{exact:true})).toBeVisible();
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
 await page.goto('/map');await expect(page.locator('.leaflet-container')).toBeVisible();expect(await page.locator('.map-price-pin').count()).toBe(27);await page.getByPlaceholder(/Search/).first().fill('Property 27');await expect(page.locator('.map-price-pin')).toHaveCount(1);
});
test('valuation form sends entered property details and preserves them on errors',async({page})=>{
 const submissions=[];await page.route('**/api/inquiries',route=>{submissions.push({body:route.request().postDataJSON(),key:route.request().headers()['idempotency-key']});return route.fulfill({status:submissions.length<3 ? 502:200,json:submissions.length<3 ? {message:'Please retry safely.'}:{ok:true}});});
 await page.goto('/sell');await page.getByPlaceholder('John Doe').fill('Test Person');await page.getByPlaceholder('john@example.com').fill('test@example.test');await page.getByPlaceholder('+1 (555) 000-0000').fill('+971500000000');await page.getByPlaceholder('123 Ocean Drive, Miami Beach, FL 33139').fill('Test property address');await page.locator('form select').selectOption('Modern Villa');
 await page.locator('button[type="submit"]').click();await expect(page.getByRole('alert')).toHaveText('Please retry safely.');await expect(page.getByPlaceholder('John Doe')).toHaveValue('Test Person');await page.locator('button[type="submit"]').click();await expect(page.getByRole('alert')).toHaveText('Please retry safely.');await page.getByPlaceholder('123 Ocean Drive, Miami Beach, FL 33139').fill('Revised property address');await page.locator('button[type="submit"]').click();await expect(page.getByText('Revised property address',{exact:true})).toBeVisible();expect(submissions[0].key).toBe(submissions[1].key);expect(submissions[2].key).not.toBe(submissions[1].key);expect(submissions[2].body.propertyType).toBe('Modern Villa');expect(submissions[2].body.message).toContain('Revised property address');
});
