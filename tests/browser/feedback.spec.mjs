import {test,expect} from '@playwright/test';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createBrokerClient} from '../../server/brokbuddy.mjs';
import {env,mockApi} from '../fixtures.mjs';
import {feedbackConfig,feedbackFeed,feedbackItem,submission} from '../feedback-fixtures.mjs';
let site,videoBytes,videoFolder;
const png=Buffer.from(submission.avatar.dataBase64,'base64');
const screenshotStyle='header.fixed, button[aria-label="Back to top"] { display:none !important; }';
test.beforeAll(async()=>{
 site=await createBrokerClient({env,fetchImpl:mockApi({count:2}).fetchImpl}).site();
 // Generated local solid-color video with audio, used only to test real controls/seeking.
 videoFolder=await mkdtemp(path.join(tmpdir(),'novalux-feedback-video-'));
 await promisify(execFile)('ffmpeg',['-v','error','-f','lavfi','-i','color=c=0x263647:s=180x320:r=24:d=4','-f','lavfi','-i','sine=frequency=440:duration=4','-c:v','libvpx','-c:a','libvorbis','-shortest',path.join(videoFolder,'synthetic.webm')]);
 videoBytes=await readFile(path.join(videoFolder,'synthetic.webm'));
});
test.afterAll(async()=>{if(videoFolder) await rm(videoFolder,{recursive:true,force:true});});
async function setup(page,{scope='broker',configStatus=200,failFeed=false,failFirst=false,delay=0,empty=false,submissionFailureStatus=422}={}) {
 const calls=[],posts=[],media=[];let hidden=false;
 await page.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url());
  const local=url.origin===new URL(test.info().project.use.baseURL || 'http://127.0.0.1:3000').origin;
  if(!local) return route.abort(); // No live upstream traffic in synthetic browser tests.
  if(!url.pathname.startsWith('/api/')) return route.continue();
  calls.push(url.pathname+url.search);
  if(url.pathname==='/api/site') return route.fulfill({json:site});
  if(url.pathname==='/api/branding') return route.fulfill({json:{name:site.agent.name}});
  if(url.pathname==='/api/maps-config') return route.fulfill({json:{enabled:false}});
  if(url.pathname==='/api/feedback/config') return route.fulfill({status:configStatus,json:configStatus===404 ? {enabled:false}:configStatus!==200?{message:'Review connection unavailable.'}:{...feedbackConfig,enabled:true,scope,brokers:scope==='agency'?feedbackConfig.brokers.map(({id,name})=>({id,name})):[],brokerCreditEnabled:scope==='agency'}});
  if(url.pathname==='/api/feedback' && request.method()==='POST') {
   posts.push(request.postDataJSON());if(delay) await new Promise(resolve=>setTimeout(resolve,delay));
   return route.fulfill({status:failFirst && posts.length===1?submissionFailureStatus:202,json:failFirst && posts.length===1?{message:'Please check the photo and retry.'}:{message:'Received'}});
  }
  if(url.pathname==='/api/feedback') {
   if(failFeed) return route.fulfill({status:503,json:{message:'Published reviews unavailable.'}});
   const kind=url.searchParams.get('kind'),pageNumber=Number(url.searchParams.get('page'));
   const items=hidden || empty ? []:kind==='REVIEW'?[feedbackItem('review-'+pageNumber)]:[feedbackItem('video-1','VIDEO'),{...feedbackItem('video-2','VIDEO'),name:'Second Synthetic Client'}];
   return route.fulfill({json:feedbackFeed(kind,{items:items.map(item=>({...item,avatarUrl:`/api/feedback/${item.id}/avatar`,...(kind==='VIDEO'?{videoUrl:`/api/feedback/${item.id}/video`}:{})})),page:pageNumber,total:hidden || empty?0:kind==='REVIEW'?13:2,hasMore:!hidden && !empty && kind==='REVIEW' && pageNumber===1,ratingSummary:{average:hidden || empty?null:4,count:hidden || empty?0:13}})});
  }
  if(/^\/api\/feedback\/[^/]+\/avatar$/.test(url.pathname)) return route.fulfill({contentType:'image/png',body:png});
  if(/^\/api\/feedback\/[^/]+\/video$/.test(url.pathname)) {
   media.push({path:url.pathname,range:request.headers().range});
   if(hidden) return route.fulfill({status:404,json:{message:'Not found'}});
   return route.fulfill({contentType:'video/webm',body:videoBytes,headers:{'accept-ranges':'bytes','cache-control':'no-store'}});
  }
  return route.fulfill({json:{ok:true}});
 });
 return {calls,posts,media,hide:()=>{hidden=true;},setConfigStatus:status=>{configStatus=status;}};
}
async function openForm(page) {await page.goto('/');await page.getByRole('contentinfo').getByRole('link',{name:'Write a review',exact:true}).click();await expect(page).toHaveURL(/\/write-a-review$/);const form=page.getByRole('region',{name:'Write a review',exact:true});await expect(form).toBeVisible();return form;}
async function fill(form) {
 await form.getByLabel('Reviewer photo (required)',{exact:true}).setInputFiles({name:'synthetic.png',mimeType:'image/png',buffer:png});
 await form.getByLabel('Name (required)',{exact:true}).fill('Synthetic Reviewer');
 await form.getByRole('radio',{name:'5 Very happy',exact:true}).check();
 await form.getByLabel('Your review (required)',{exact:true}).fill('A private pending review for synthetic tests.');
 await form.getByRole('checkbox').check();
}
test('independent reviews: validation, accessible faces, retry key, pending lock, acknowledgement and no optimistic review',async({page})=>{
 const {posts}=await setup(page,{failFirst:true,delay:350});
 const form=await openForm(page);await expect(form.getByText("Broker you'd like to mention (optional)")).toHaveCount(0);
 await form.getByRole('button',{name:'Submit review',exact:true}).click();expect(posts).toHaveLength(0);
 await form.getByLabel('Reviewer photo (required)',{exact:true}).setInputFiles({name:'bad.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg/>')});await expect(form.getByRole('alert')).toContainText('JPEG, PNG or WebP');
 await form.getByLabel('Reviewer photo (required)',{exact:true}).setInputFiles({name:'large.png',mimeType:'image/png',buffer:Buffer.alloc(2097153)});await expect(form.getByRole('alert')).toContainText('at most 2 MB');
 await fill(form);await expect(form.getByAltText('Your selected reviewer photo')).toBeVisible();
 await form.getByRole('radio',{name:'1 Very unhappy',exact:true}).focus();await page.keyboard.press('ArrowRight');await expect(form.getByRole('radio',{name:'2 Unhappy',exact:true})).toBeChecked();await form.getByRole('radio',{name:'5 Very happy',exact:true}).check();
 await form.getByLabel('Your review (required)',{exact:true}).fill('short');await form.getByRole('button',{name:'Submit review',exact:true}).click();expect(posts).toHaveLength(0);
 await form.getByLabel('Your review (required)',{exact:true}).fill('A private pending review for synthetic tests.');
 await form.getByRole('button',{name:'Submit review',exact:true}).click();await expect(form.getByRole('button',{name:'Submitting…'})).toBeDisabled();await expect(form.getByRole('button',{name:'Back to profile'})).toBeDisabled();
 await expect(form.getByRole('alert')).toContainText('Please check the photo and retry.');await expect(form.getByLabel('Name (required)',{exact:true})).toHaveValue('Synthetic Reviewer');
 await form.getByRole('button',{name:'Submit review',exact:true}).click();await expect(form.getByRole('status')).toHaveText('Thank you. Your review has been submitted for review.');
 expect(posts).toHaveLength(2);expect(posts[0].submissionKey).toBe(posts[1].submissionKey);expect(posts[0].rating).toBe(5);expect(posts[0].creditedBrokerId).toBeUndefined();expect(posts[0].avatar.dataBase64).not.toContain('data:');
 await form.getByRole('button',{name:'Done',exact:true}).click();await expect(page.locator('.native-review-card')).not.toContainText('A private pending review');
 await page.getByRole('contentinfo').getByRole('link',{name:'Write a review',exact:true}).click();await fill(form);await form.getByRole('button',{name:'Submit review',exact:true}).click();await expect(form.getByRole('status')).toBeVisible();expect(posts[2].submissionKey).not.toBe(posts[0].submissionKey);
});
test('agency broker mention searches names, clears, and sends the selected ID',async({page})=>{
 const {posts}=await setup(page,{scope:'agency'});const form=await openForm(page);await fill(form);
 await form.getByLabel("Broker you'd like to mention (optional)").fill('Synthetic');await form.getByLabel('Choose a broker',{exact:true}).selectOption('broker-1');
 await form.getByRole('button',{name:'Clear broker',exact:true}).click();await expect(form.getByLabel('Choose a broker',{exact:true})).toHaveValue('');
 await form.getByLabel('Choose a broker',{exact:true}).selectOption('broker-1');await form.getByRole('button',{name:'Submit review',exact:true}).click();await expect(form.getByRole('status')).toBeVisible();expect(posts[0].creditedBrokerId).toBe('broker-1');
 await form.getByRole('button',{name:'Done',exact:true}).click();await expect(page.locator('.native-review-card')).toContainText('Broker mentioned: Synthetic Broker');
 await page.getByRole('contentinfo').getByRole('link',{name:'Write a review',exact:true}).click();await fill(form);await form.getByRole('button',{name:'Submit review',exact:true}).click();await expect(form.getByRole('status')).toBeVisible();expect(posts[1].creditedBrokerId).toBeNull();
});
test('desktop/mobile plain text, disclosure, owner reply, paging and hidden records',async({page})=>{
 const state=await setup(page);await page.goto('/');const section=page.locator('.native-feedback');
 await expect(page.locator('.native-write-review, .profile-write-review')).toHaveCount(0);await expect(page.getByRole('contentinfo').getByRole('link',{name:'Write a review',exact:true})).toHaveAttribute('href','/write-a-review');
 await expect(section.getByRole('heading',{name:'Selected client reviews'})).toBeVisible();await expect(section).toContainText('These reviews are selected for publication by the business.');
 await expect(section.locator('.native-review-card')).toContainText('<script>unsafe()</script>');expect(await section.locator('.native-review-card script').count()).toBe(0);await expect(section.getByText('Business reply',{exact:true})).toBeVisible();
 expect(state.calls.filter(url=>/kind=REVIEW/.test(url))).toHaveLength(1);await page.getByRole('navigation',{name:'Client reviews pages'}).getByRole('button',{name:'Next',exact:true}).click();await expect(page.getByRole('navigation',{name:'Client reviews pages'})).toContainText('Page 2');await expect(section.locator('.native-review-card img')).toHaveAttribute('src','/api/feedback/review-2/avatar');
 const previewStyle=await page.addStyleTag({content:screenshotStyle});
 await section.screenshot({path:'.verification/native-feedback-desktop.png',style:screenshotStyle});
 for(const width of [1440,390,320]) {
  await page.setViewportSize({width,height:900});await section.scrollIntoViewIfNeeded();
  if(width===390) await section.screenshot({path:'.verification/native-feedback-mobile.png',style:screenshotStyle});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(width<=390) expect(await section.locator('.native-video-card').first().evaluate(el=>el.getBoundingClientRect().width)).toBeGreaterThanOrEqual(250);
  await page.getByRole('contentinfo').getByRole('link',{name:'Write a review',exact:true}).click();
  const form=page.getByRole('region',{name:'Write a review',exact:true});await expect(form).toBeVisible();
  await expect(page.getByRole('dialog',{name:'Write a review',exact:true})).toHaveCount(0);
  expect(await form.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
  expect(await page.locator('.native-faces label').evaluateAll(labels=>labels.every(label=>{const box=label.getBoundingClientRect(),textElement=label.querySelector('.native-rating-label'),text=textElement.getBoundingClientRect();return text.right<=box.right && text.left>=box.left && textElement.scrollWidth<=textElement.clientWidth;}))).toBe(true);
  if(width<=390) expect(await page.locator('.native-faces label').first().evaluate(el=>el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(64);
  if(width===320) await form.screenshot({path:'.verification/native-feedback-form-mobile.png'});
  await form.getByRole('button',{name:'Back to profile',exact:true}).click();await expect(section).toBeVisible();
 }

 await previewStyle.evaluate(el=>el.remove());
 state.hide();await section.getByRole('button',{name:'Refresh reviews'}).click();await expect(section.getByText('No published client reviews yet.',{exact:true})).toBeVisible();await expect(section.locator('.native-review-card')).toHaveCount(0);await expect(section).toContainText('No native rating available.');
});
test('video viewer defers downloads, supports native playback/seeking/volume, navigation and close pause',async({page})=>{
 const {media}=await setup(page);await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');const section=page.locator('.native-feedback');
 await expect(section.getByRole('button',{name:'Watch testimonial from Synthetic Client'})).toBeVisible();expect(media).toHaveLength(0);
 await expect(section.locator('.native-video-card p, .native-video-card time, .native-video-name')).toHaveCount(0);
 expect(await section.locator('.native-video-card').evaluateAll(cards=>cards.every(card=>card.innerText.trim()===''))).toBe(true);
 const inline=section.locator('.native-video-card video').first();
 await inline.click();await inline.evaluate(async player=>{await player.play();window.__inlineVideo=player;});await expect(inline).toHaveJSProperty('paused',false);
 await section.getByRole('button',{name:'Watch testimonial from Synthetic Client'}).click();const dialog=page.getByRole('dialog');expect(await page.evaluate(()=>window.__inlineVideo.paused)).toBe(true);await expect(dialog.locator('p,aside')).toHaveCount(0);const video=dialog.locator('video');await expect(video).toHaveJSProperty('readyState',4);
 expect(await video.evaluate(el=>el.controls && el.playsInline && !el.autoplay)).toBe(true);
 await video.evaluate(async el=>{el.volume=.25;await el.play();el.currentTime=2;});await expect.poll(()=>video.evaluate(el=>el.currentTime)).toBeGreaterThanOrEqual(2);expect(await video.evaluate(el=>el.volume)).toBe(.25);
 await video.evaluate(el=>{el.style.transform='translateY(10000px)';});await expect(video).toHaveJSProperty('paused',true);await video.evaluate(async el=>{el.style.transform='';await el.play();});
 await video.evaluate(el=>{window.__firstVideo=el;});await dialog.getByRole('button',{name:'Next video'}).click();await expect(dialog.getByRole('heading')).toHaveText('Second Synthetic Client');expect(await page.evaluate(()=>window.__firstVideo.paused)).toBe(true);
 await expect(video).toHaveJSProperty('readyState',4);await video.evaluate(async el=>{window.__closedVideo=el;await el.play();});await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);expect(await page.evaluate(()=>window.__closedVideo.paused)).toBe(true);
 await section.getByRole('button',{name:'Watch testimonial from Synthetic Client'}).click();await page.getByRole('button',{name:'Next video'}).focus();await page.keyboard.press('ArrowRight');await expect(page.getByRole('dialog').getByRole('heading')).toHaveText('Second Synthetic Client');await page.getByRole('button',{name:'Close video'}).click();
});
test('review entry is hidden during outages and returns automatically when the API recovers',async({page})=>{
 const state=await setup(page,{configStatus:404});await page.clock.install();await page.goto('/');
 await expect(page.getByRole('heading',{name:'Test Broker',exact:true}).first()).toBeVisible();
 const entry=page.getByRole('contentinfo').getByRole('link',{name:'Write a review',exact:true});
 await expect(entry).toHaveCount(0);await expect(page.locator('.native-write-review, .profile-write-review')).toHaveCount(0);
 expect(state.calls.some(url=>url.includes('kind='))).toBe(false);expect(state.posts).toHaveLength(0);
 state.setConfigStatus(200);await page.clock.fastForward(30000);await expect(entry).toBeVisible();
 await expect(entry).toHaveAttribute('href','/write-a-review');
 state.setConfigStatus(503);await page.evaluate(()=>window.dispatchEvent(new Event('online')));await expect(entry).toHaveCount(0);
 state.setConfigStatus(200);await page.evaluate(()=>window.dispatchEvent(new Event('online')));await expect(entry).toBeVisible();
 await page.clock.resume();
 await entry.click();await expect(page).toHaveURL(/\/write-a-review$/);await expect(page.getByRole('region',{name:'Write a review',exact:true})).toBeVisible();
 await page.reload();await expect(page.getByRole('form',{name:'Write a review',exact:true})).toBeVisible();
});

test('direct review route handles unavailability and preserves a draft through an outage',async({page})=>{
 const state=await setup(page,{configStatus:503});await page.goto('/write-a-review');
 await expect(page.getByRole('region',{name:'Review availability'})).toContainText('temporarily unavailable');
 await expect(page.getByRole('form',{name:'Write a review',exact:true})).toHaveCount(0);
 await expect(page.getByRole('contentinfo').getByRole('link',{name:'Write a review',exact:true})).toHaveCount(0);
 state.setConfigStatus(200);await page.getByRole('button',{name:'Check again',exact:true}).click();
 const form=page.getByRole('region',{name:'Write a review',exact:true});await expect(form).toBeVisible();await fill(form);
 state.setConfigStatus(503);await page.evaluate(()=>window.dispatchEvent(new Event('online')));
 await expect(form.getByRole('button',{name:'Submit review',exact:true})).toBeDisabled();
 await expect(form.getByLabel('Name (required)',{exact:true})).toHaveValue('Synthetic Reviewer');
 state.setConfigStatus(200);await page.getByRole('button',{name:'Check again',exact:true}).click();
 await expect(form.getByRole('button',{name:'Submit review',exact:true})).toBeEnabled();
 await expect(form.getByLabel('Your review (required)',{exact:true})).toHaveValue('A private pending review for synthetic tests.');
});

test('published feed errors and valid empty feeds do not invent testimonials',async({page})=>{
 await setup(page,{failFeed:true});await page.goto('/');await expect(page.locator('.native-feedback').getByRole('alert')).toHaveCount(2);await expect(page.locator('.native-review-card')).toHaveCount(0);
 await page.unroute('**/*');await setup(page,{empty:true});await page.reload();await expect(page.getByText('No published client reviews yet.',{exact:true})).toBeVisible();await expect(page.getByText('No published video testimonials yet.',{exact:true})).toBeVisible();
});


test('mobile review form has room to complete and submit at 320px and 390px',async({page})=>{
 const {posts}=await setup(page);
 for(const width of [320,390]) {
  await page.setViewportSize({width,height:844});const form=await openForm(page);await fill(form);
  await expect(form.getByRole('radio',{name:'5 Very happy',exact:true})).toBeChecked();
  await form.getByRole('button',{name:'Submit review',exact:true}).scrollIntoViewIfNeeded();
  await expect(form.getByRole('button',{name:'Submit review',exact:true})).toBeInViewport();
  await form.getByRole('button',{name:'Submit review',exact:true}).click();await expect(form.getByRole('status')).toHaveText('Thank you. Your review has been submitted for review.');
 }
 expect(posts).toHaveLength(2);
});
