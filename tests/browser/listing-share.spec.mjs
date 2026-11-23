import {test,expect} from '@playwright/test';
import {createBrokerClient} from '../../server/brokbuddy.mjs';
import {mockApi,env} from '../fixtures.mjs';
let data;
test.beforeAll(async()=>{data=await createBrokerClient({env,fetchImpl:mockApi().fetchImpl}).site();});
test.beforeEach(async({page})=>{
  await page.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.origin!==new URL(test.info().project.use.baseURL).origin) return route.abort();
    if(url.pathname==='/api/site') return route.fulfill({json:data});
    if(url.pathname==='/api/branding') return route.fulfill({json:{name:data.agent.name}});
    if(url.pathname.startsWith('/api/')) return route.fulfill({json:{enabled:false}});
    return route.continue();
  });
});
test('card share options copy the canonical listing and preserve browsing on desktop and mobile',async({page})=>{
  await page.addInitScript(()=>{
    Object.defineProperty(navigator,'share',{configurable:true,value:undefined});
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{if(window.__denyCopy) throw new Error('Denied');window.__copiedListing=value;}}});
  });
  for(const width of [1440,390,320]) {
    await page.setViewportSize({width,height:900});await page.goto('/properties?preview=private');
    const trigger=page.getByRole('button',{name:/^Share listing:/}).first();
    await expect(trigger).toBeVisible();const name=await trigger.getAttribute('aria-label');
    const property=data.properties.find(item=>`Share listing: ${item.title}`===name),url=new URL(`/property/${property.id}`,page.url()).href;
    const box=await trigger.boundingBox();expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);
    await trigger.click();const dialog=page.getByRole('dialog',{name:'Share listing',exact:true});await expect(dialog).toBeVisible();await expect(page).toHaveURL(/\/properties\?preview=private$/);
    await expect(dialog).toContainText(property.title);await expect(dialog.getByRole('link')).toHaveCount(4);
    for(const link of await dialog.getByRole('link').all()) {
      const target=new URL(await link.getAttribute('href'));expect([...target.searchParams.values()].some(value=>value.includes(url))).toBe(true);expect(target.search).not.toContain('private');
    }
    await dialog.getByRole('button',{name:'Copy link',exact:true}).click();await expect(dialog.getByRole('status')).toHaveText('Listing link copied');expect(await page.evaluate(()=>window.__copiedListing)).toBe(url);
    expect(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    if(width===390) await dialog.screenshot({path:'.verification/listing-card-share-mobile.png'});
    await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(trigger).toBeFocused();
    await page.evaluate(()=>{window.__denyCopy=true;});await trigger.click();await dialog.getByRole('button',{name:'Copy link',exact:true}).click();await expect(dialog.getByLabel('Copy this listing link')).toHaveValue(url);
    await dialog.getByRole('button',{name:'Close sharing options'}).click();await expect(dialog).not.toBeVisible();
  }
  await page.getByRole('button',{name:'View property details',exact:true}).first().click();await expect(page).toHaveURL(/\/property\//);
});
test('native card sharing receives only the public listing URL and cancellation leaves browsing intact',async({page})=>{
  await page.addInitScript(()=>{Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{window.__sharedListing=data;if(window.__shareError) throw new DOMException('Share unavailable',window.__shareError);}});});
  await page.goto('/properties?preview=private');const trigger=page.getByRole('button',{name:/^Share listing:/}).first();await expect(trigger).toBeVisible();
  const name=await trigger.getAttribute('aria-label'),property=data.properties.find(item=>`Share listing: ${item.title}`===name);
  await trigger.click();expect(await page.evaluate(()=>window.__sharedListing)).toEqual({title:property.title,url:new URL(`/property/${property.id}`,page.url()).href});
  await expect(page.getByRole('dialog',{name:'Share listing',exact:true})).not.toBeVisible();await expect(page).toHaveURL(/\/properties\?preview=private$/);
  await page.evaluate(()=>{window.__shareError='AbortError';});await trigger.click();await expect(page.getByRole('dialog',{name:'Share listing',exact:true})).not.toBeVisible();
  await page.evaluate(()=>{window.__shareError='NotAllowedError';});await trigger.click();await expect(page.getByRole('dialog',{name:'Share listing',exact:true})).toBeVisible();
});
