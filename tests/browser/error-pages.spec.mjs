import {test,expect} from '@playwright/test';
import {createBrokerClient} from '../../server/brokbuddy.mjs';
import {mockApi,env} from '../fixtures.mjs';

let data;
test.beforeAll(async()=>{data=await createBrokerClient({env,fetchImpl:mockApi().fetchImpl}).site();});
test.beforeEach(async({page})=>{
  await page.route('**/api/site*',route=>route.fulfill({json:{...data,selectedProperty:null}}));
  await page.route('https://api.example.test/**',route=>route.fulfill({status:204}));
  await page.route('**/api/inquiries',route=>route.fulfill({status:503,json:{message:'Mock submission unavailable.'}}));
});

for(const [device,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]) {
  test(`${device} unknown routes show the themed 404 and recover to the homepage`,async({page})=>{
    await page.setViewportSize(viewport);await page.goto('/this-page-does-not-exist');
    await expect(page.getByRole('heading',{name:'Page not found',exact:true})).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content','noindex, nofollow');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:`.verification/error-pages/${device}-404.png`,fullPage:true});
    await page.getByRole('link',{name:'Back to home',exact:true}).click();
    await expect(page).toHaveURL(/\/$/);await expect(page.getByRole('heading',{name:/Test Broker/}).first()).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content','index, follow');
  });

  test(`${device} unavailable page hides broker data and retry fetches the recovered feed`,async({page})=>{
    await page.setViewportSize(viewport);
    let recovered=false;
    await page.route('**/api/site*',route=>route.fulfill(recovered ? {json:data} : {status:503,json:{message:'Unavailable'}}));
    await page.goto('/');await expect(page.getByRole('heading',{name:'Website unavailable',exact:true})).toBeVisible();
    await expect(page.locator('footer,nav')).toHaveCount(0);await expect(page.locator('body')).not.toContainText('Test Broker');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:`.verification/error-pages/${device}-unavailable.png`,fullPage:true});
    recovered=true;await page.getByRole('button',{name:'Try again',exact:true}).click();
    await expect(page.getByRole('heading',{name:/Test Broker/}).first()).toBeVisible();
  });
}

test('missing properties and advisors share the error design with working directory links',async({page})=>{
  await page.goto('/property/missing');await expect(page.getByRole('heading',{name:'Property Not Found',exact:true})).toBeVisible();
  await expect(page.locator('main.error-page--embedded')).toBeVisible();
  await page.getByRole('link',{name:'Browse properties',exact:true}).click();
  await expect(page).toHaveURL(/\/properties$/);await expect(page.getByRole('search',{name:'Property search'})).toBeVisible();
  await page.goto('/agents/missing');await expect(page.getByRole('heading',{name:'Advisor Profile Not Found',exact:true})).toBeVisible();
  await page.getByRole('link',{name:'Browse advisors',exact:true}).click();
  await expect(page).toHaveURL(/\/agents$/);await expect(page.locator('main.error-page')).toHaveCount(0);
});
