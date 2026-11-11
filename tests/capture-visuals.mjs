// Read-only live-feed visual audit. No inquiry endpoint is called.
import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
const origin=process.env.VISUAL_BASE_URL || 'http://127.0.0.1:3000';
try {process.loadEnvFile();} catch {}
const code=process.env.BROKBUDDY_BROKER_CODE;
const response=await fetch(origin+'/api/site');
if(!response.ok) throw Error('The configured broker feed is unavailable.');
const data=await response.json();
const sale=data.properties.find(p=>p.marketCategory==='buy');
const rental=data.properties.find(p=>p.marketCategory==='rent');
const routes=[['home','/'],['properties','/properties'],...(sale ? [['detail','/property/'+sale.id]]:[]),...(rental ? [['rent','/property/'+rental.id]]:[]),['contact','/contact'],['sell','/sell'],['agents','/agents'],['about','/about'],['map','/map']];
await fs.mkdir('.verification/integrated',{recursive:true});
const browser=await chromium.launch();const report=[];let exposed=false;const checks=[];
for(const [device,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]) {
 const page=await browser.newPage({viewport});const errors=[];
 // Freeze one freshly verified public snapshot for a consistent visual audit.
 // This route interception exists only in this test process, never in the app.
 await page.route('**/api/site*',route=>{
  const id=new URL(route.request().url()).searchParams.get('listingId');
  return route.fulfill({json:{...data,selectedProperty:id ? data.properties.find(p=>p.id===id) || null:null}});
 });
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',req=>{if(req.headers()['x-brokbuddy-broker-code'] || (code && req.url().includes(code))) exposed=true;});
 page.on('response',res=>{if(['document','script','fetch'].includes(res.request().resourceType())) checks.push(res.body().then(body=>{if(code && body.includes(Buffer.from(code))) exposed=true;}).catch(()=>{}));});
 for(const [name,path] of routes) {
  await page.goto(origin+path);
  await page.locator('footer,.leaflet-container').first().waitFor({timeout:45000});
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForFunction(()=>[...document.images].filter(img=>img.getBoundingClientRect().top<innerHeight).every(img=>img.complete),{},{timeout:15000}).catch(()=>{});
  await page.screenshot({path:`.verification/integrated/${device}-${name}.png`,fullPage:true});
  report.push({device,path,name,headings:await page.locator('h1,h2,h3').allTextContents(),horizontalOverflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),geometry:await page.locator('#root > div,nav,footer,h1').evaluateAll(es=>es.map(e=>({tag:e.tagName,classes:e.className,x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}))),errors:[...errors]});
  await fs.writeFile('.verification/integrated/pages.json',JSON.stringify({credentialExposed:exposed,pages:report},null,2));
 }
 await page.close();
}
await Promise.allSettled(checks);await browser.close();
await fs.writeFile('.verification/integrated/pages.json',JSON.stringify({credentialExposed:exposed,pages:report},null,2));
if(exposed || report.some(p=>p.errors.length || p.horizontalOverflow)) throw Error('Visual audit detected browser errors, overflow or credential exposure.');
console.log(JSON.stringify({screenshots:report.length,viewports:['1440x1000','390x844'],browserErrors:0,horizontalOverflow:false,credentialExposed:false}));
