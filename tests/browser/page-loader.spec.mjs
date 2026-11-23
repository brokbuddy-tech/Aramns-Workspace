import {test,expect} from '@playwright/test';
import {createBrokerClient} from '../../server/brokbuddy.mjs';
import {mockApi,env} from '../fixtures.mjs';

let data;
test.beforeAll(async()=>{data=await createBrokerClient({env,fetchImpl:mockApi().fetchImpl}).site();});
test.beforeEach(async({page})=>{
  await page.route('**/api/branding',route=>route.fulfill({json:{name:'Arman Alam',tagline:'Property Advisor'}}));
});

for(const [device,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]) {
  test(`${device} loading scene animates during the request and gives way to the actual page`,async({page})=>{
    await page.setViewportSize(viewport);
    let release;const pending=new Promise(resolve=>{release=resolve;});
    await page.route('**/api/site*',async route=>{await pending;await route.fulfill({json:data});});
    await page.route('https://api.example.test/**',route=>route.fulfill({status:204}));
    try {
      await page.goto('/properties');
      const loader=page.getByRole('main',{name:'Loading page',exact:true});
      await expect(loader).toHaveAttribute('aria-busy','true');
      await expect(page.getByRole('status')).toContainText('Gathering available properties');
      await expect(loader.getByRole('heading',{name:'Arman Alam',exact:true})).toBeVisible();
      await expect(loader.locator('.page-loader-tagline')).toHaveText('Property Advisor');
      expect(await page.evaluate(()=>document.fonts.load('64px Mirza').then(fonts=>fonts.length))).toBeGreaterThan(0);
      expect(await page.evaluate(()=>document.fonts.load('64px "Novalux Majlis"').then(fonts=>fonts.length))).toBeGreaterThan(0);
      await expect(page.locator('.skeleton-block')).toHaveCount(0);
      const sun=loader.locator('.courtyard-sun');
      const first=await sun.evaluate(element=>getComputedStyle(element).transform);
      await expect.poll(()=>sun.evaluate(element=>getComputedStyle(element).transform)).not.toBe(first);
      const progress=loader.locator('.page-loader-progress > span');
      const progressStart=await progress.evaluate(element=>getComputedStyle(element).transform);
      await expect.poll(()=>progress.evaluate(element=>getComputedStyle(element).transform)).not.toBe(progressStart);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      await loader.evaluate(element=>{for(const animation of element.getAnimations({subtree:true})) {animation.pause();animation.currentTime=1800;}});
      await page.screenshot({path:`.verification/loading/${device}-courtyard.png`,fullPage:true});
      release();await expect(page.getByRole('search',{name:'Property search'})).toBeVisible();
      await expect(loader).toHaveCount(0);
    } finally {release();}
  });
}

test('reduced motion leaves both the loader and failed-feed illustration still',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  let release;const pending=new Promise(resolve=>{release=resolve;});
  await page.route('**/api/site*',async route=>{await pending;await route.fulfill({status:503,json:{message:'Unavailable'}});});
  try {
    await page.goto('/contact');
    const loader=page.getByRole('main',{name:'Loading page',exact:true});
    await expect(page.getByRole('status')).toContainText('Opening the page');
    expect(await loader.evaluate(element=>element.getAnimations({subtree:true}).filter(animation=>animation.playState==='running').length)).toBe(0);
    release();await expect(page.getByRole('heading',{name:'Website unavailable',exact:true})).toBeVisible();
    await expect(loader).toHaveCount(0);
    expect(await page.locator('.courtyard-scene').evaluate(element=>element.getAnimations({subtree:true}).length)).toBe(0);
    await expect(page.getByRole('button',{name:'Try again'})).toBeVisible();
  } finally {release();}
});

test('unavailable branding does not block the feed or invent a broker identity',async({page})=>{
  await page.route('**/api/branding',route=>route.fulfill({status:503,json:{message:'Unavailable'}}));
  let release;const pending=new Promise(resolve=>{release=resolve;});
  await page.route('**/api/site*',async route=>{await pending;await route.fulfill({json:data});});
  try {
    await page.goto('/properties');
    const loader=page.getByRole('main',{name:'Loading page',exact:true});
    await expect(loader.getByRole('heading',{name:'Property Portfolio',exact:true})).toBeVisible();
    await expect(loader.locator('.page-loader-tagline')).toHaveCount(0);
    release();await expect(page.getByRole('search',{name:'Property search'})).toBeVisible();
    await expect(loader).toHaveCount(0);
  } finally {release();}
});

test('long API branding fits a narrow screen',async({page})=>{
  await page.setViewportSize({width:320,height:700});
  await page.route('**/api/branding',route=>route.fulfill({json:{name:'Alexanderthegreat Al Noor',tagline:'A considered approach to finding your next home in the Emirates'}}));
  let release;const pending=new Promise(resolve=>{release=resolve;});
  await page.route('**/api/site*',async route=>{await pending;await route.fulfill({json:data});});
  try {
    await page.goto('/');
    await expect(page.getByRole('heading',{name:'Alexanderthegreat Al Noor',exact:true})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  } finally {release();}
});
