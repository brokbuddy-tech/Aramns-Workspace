import {test,expect} from '@playwright/test';
import {createBrokerClient} from '../../server/brokbuddy.mjs';
import {env,mockApi} from '../fixtures.mjs';

async function setup(page, links={}) {
 const site=await createBrokerClient({env,fetchImpl:mockApi({count:2,transform:value=>value.agent && !value.id ? {...value,agent:{...value.agent,...links}}:value}).fetchImpl}).site();
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.origin!==new URL(test.info().project.use.baseURL || 'http://127.0.0.1:3000').origin) return route.abort();
  if(!url.pathname.startsWith('/api/')) return route.continue();
  if(url.pathname==='/api/site') return route.fulfill({json:site});
  if(url.pathname==='/api/branding') return route.fulfill({json:{name:site.agent.name}});
  if(url.pathname==='/api/maps-config') return route.fulfill({json:{enabled:false}});
  if(url.pathname==='/api/feedback/config') return route.fulfill({status:404,json:{message:'Unavailable'}});
  return route.fulfill({json:{ok:true}});
 });
 await page.goto('/');
 await expect(page.getByRole('heading',{name:/Test Broker/}).first()).toBeVisible();
}

test('profile and footer portal links reflect the connected broker branding on mobile',async({page})=>{
 await page.setViewportSize({width:390,height:900});
 const links={propertyFinderProfileUrl:'https://www.propertyfinder.ae/en/agent/example-123',bayutProfileUrl:'https://www.bayut.com/brokers/example-456.html',dubizzleProfileUrl:'https://dubai.dubizzle.com/profile/example/'};
 await setup(page,links);
 for(const [name,href] of [['Property Finder',links.propertyFinderProfileUrl],['Bayut',links.bayutProfileUrl],['Dubizzle',links.dubizzleProfileUrl]]) {
  await expect(page.getByRole('navigation',{name:'Official links'}).getByRole('link',{name,exact:true})).toHaveAttribute('href',href);
  await expect(page.getByRole('contentinfo').getByRole('link',{name,exact:true})).toHaveAttribute('href',href);
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
});

test('missing profiles never show placeholder portal buttons or footer links',async({page})=>{
 await setup(page);
 await expect(page.getByRole('navigation',{name:'Official links'})).toHaveCount(0);
 for(const name of ['Bayut','Property Finder','Dubizzle']) await expect(page.getByRole('contentinfo').getByRole('link',{name,exact:true})).toHaveCount(0);
 await expect(page.getByRole('contentinfo')).not.toContainText('Portals');
});
