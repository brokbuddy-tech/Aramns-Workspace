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
async function setup(page,{scope='broker',configStatus=200,failFeed=false,failFirst=false,delay=0,empty=false,emptyKinds=[],failedKinds=[],submissionFailureStatus=422,railItemCount=0}={}) {
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
   const kind=url.searchParams.get('kind'),pageNumber=Number(url.searchParams.get('page'));
   if(failFeed || failedKinds.includes(kind)) return route.fulfill({status:503,json:{message:'Published reviews unavailable.'}});
   const isEmpty=hidden || empty || emptyKinds.includes(kind);
   const items=isEmpty ? []:railItemCount ? Array.from({length:railItemCount},(_,index)=>({...feedbackItem(`${kind.toLowerCase()}-${index+1}`,kind),...(kind==='REVIEW' ? {rating:index%5+1}:{})})):kind==='REVIEW'?[feedbackItem('review-'+pageNumber)]:[feedbackItem('video-1','VIDEO'),{...feedbackItem('video-2','VIDEO'),name:'Second Synthetic Client'}];
   return route.fulfill({json:feedbackFeed(kind,{items:items.map(item=>({...item,avatarUrl:`/api/feedback/${item.id}/avatar`,...(kind==='VIDEO'?{videoUrl:`/api/feedback/${item.id}/video`}:{})})),page:pageNumber,total:isEmpty?0:railItemCount || (kind==='REVIEW'?13:2),hasMore:!railItemCount && !isEmpty && kind==='REVIEW' && pageNumber===1,ratingSummary:{average:isEmpty?null:4,count:isEmpty?0:railItemCount || 13}})});
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
 await form.getByRole('radio',{name:'5 Love it',exact:true}).check();
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
 await form.getByRole('radio',{name:'1 Very unhappy',exact:true}).focus();await page.keyboard.press('ArrowRight');await expect(form.getByRole('radio',{name:'2 Neutral',exact:true})).toBeChecked();await form.getByRole('radio',{name:'5 Love it',exact:true}).check();
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
test('desktop/mobile plain text, owner reply, paging and hidden records without disclosure copy',async({page})=>{
 const state=await setup(page);await page.goto('/');const section=page.locator('.native-feedback');
 await expect(page.locator('.native-write-review, .profile-write-review')).toHaveCount(0);await expect(page.getByRole('contentinfo').getByRole('link',{name:'Write a review',exact:true})).toHaveAttribute('href','/write-a-review');
 await expect(section.getByRole('heading',{name:'Reviews',exact:true})).toBeVisible();await expect(section.getByRole('heading',{name:'Testimonials',exact:true})).toBeVisible();await expect(section.getByRole('button',{name:'Refresh reviews'})).toHaveCount(0);await expect(section).not.toContainText('These reviews are selected for publication by the business.');
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
 state.hide();await page.reload();await expect(page.getByRole('contentinfo')).toBeVisible();await expect(section).toHaveCount(0);
});
test('a single short review fits its content without an oversized empty card',async({page})=>{
 await setup(page,{emptyKinds:['VIDEO']});
 await page.route(/\/api\/feedback\?kind=REVIEW/,route=>route.fulfill({json:feedbackFeed('REVIEW',{items:[{...feedbackItem(),name:'Synthetic Reviewer',message:'Helpful advice.',rating:3,response:'',avatarUrl:'/api/feedback/review-1/avatar'}],total:1,hasMore:false,ratingSummary:{average:3,count:1}})}));
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const width of [1440,390,320]) {
  await page.setViewportSize({width,height:900});await page.goto('/');
  const card=page.locator('.native-review-card');await expect(card).toHaveCount(1);await expect(card.locator('blockquote')).toHaveText('Helpful advice.');
  const box=await card.evaluate(el=>{const bounds=el.getBoundingClientRect(),quote=el.querySelector('blockquote').getBoundingClientRect();return {width:bounds.width,height:bounds.height,emptyBelowText:bounds.bottom-quote.bottom};});
  expect(box.width).toBeLessThanOrEqual(400);expect(box.height).toBeLessThan(240);expect(box.emptyBelowText).toBeLessThanOrEqual(25);
  await expect(card.locator('.review-rating-slot')).toHaveCount(3);
  await expect(page.getByRole('heading',{name:'Testimonials',exact:true})).toHaveCount(0);
  await page.locator('.native-feedback').screenshot({path:`.verification/single-review-compact-${width}.png`});
 }
});

test('review cards show published text without expansion and have working scroll controls',async({page})=>{
 await setup(page,{railItemCount:5});await page.route('**/api/feedback/review-2/avatar',route=>route.fulfill({status:404,body:''}));
 await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:390,height:844});await page.goto('/');
 const row=page.getByRole('region',{name:'Scrollable client reviews',exact:true}),cards=row.locator(':scope > article');
 await expect(cards).toHaveCount(5);await expect(row.locator('blockquote')).toHaveCount(5);await expect(row.locator('button[aria-expanded]')).toHaveCount(0);
 await cards.nth(1).scrollIntoViewIfNeeded();
 await expect(cards.nth(1).locator('blockquote')).toContainText('<script>unsafe()</script>');await expect(cards.nth(1).getByText('Business reply',{exact:true})).toBeVisible();
 await expect(cards.nth(1).locator('img')).toHaveCount(0);await expect(cards.nth(1).locator('.review-avatar-initials')).toHaveText('SC');
 const next=page.getByRole('button',{name:'Next reviews',exact:true}),previous=page.getByRole('button',{name:'Previous reviews',exact:true});
 await row.evaluate(el=>el.scrollTo({left:0,behavior:'instant'}));await expect(previous).toBeDisabled();
 for(let step=0;step<4;step++) {
  const before=await row.evaluate(el=>el.scrollLeft);await expect(next).toBeEnabled();await next.click();
  await expect.poll(()=>row.evaluate(el=>el.scrollLeft)).toBeGreaterThan(before);
 }
 await expect(next).toBeDisabled();await expect(previous).toBeEnabled();
 const end=await row.evaluate(el=>el.scrollLeft);await previous.click();await expect.poll(()=>row.evaluate(el=>el.scrollLeft)).toBeLessThan(end);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('review and video rows scroll horizontally from phones through ultrawide screens',async({page})=>{
 await setup(page,{railItemCount:12});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
 const rows=[page.getByRole('region',{name:'Scrollable client reviews',exact:true}),page.getByRole('region',{name:'Scrollable video testimonials',exact:true})];
 for(const [width,height] of [[320,844],[390,844],[844,390],[768,1024],[1024,768],[1440,900],[1920,1080],[2560,1440]]) {
  await page.setViewportSize({width,height});
  for(const row of rows) {
   await expect(row.locator(':scope > article')).toHaveCount(12);
   await row.evaluate(el=>el.scrollTo({left:0,behavior:'instant'}));await row.scrollIntoViewIfNeeded();
   const bounds=await row.evaluate(el=>({overflow:el.scrollWidth>el.clientWidth,oneRow:new Set(Array.from(el.children,card=>card.offsetTop)).size===1,cardFits:el.firstElementChild.getBoundingClientRect().width<=el.clientWidth}));
   expect(bounds,`${width}×${height}: ${await row.getAttribute('aria-label')}`).toEqual({overflow:true,oneRow:true,cardFits:true});
   await row.focus();await page.keyboard.press('ArrowRight');await expect.poll(()=>row.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);
   await row.evaluate(el=>el.scrollTo({left:el.scrollWidth,behavior:'instant'}));
   expect(await row.evaluate(el=>{const last=el.lastElementChild.getBoundingClientRect(),viewport=el.getBoundingClientRect();return last.left>=viewport.left-1 && last.right<=viewport.right+1;})).toBe(true);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});

test('ratings show only earned emojis, animate when visible, and respect reduced motion',async({page})=>{
 await setup(page,{railItemCount:5});await page.emulateMedia({reducedMotion:'no-preference'});await page.setViewportSize({width:390,height:844});await page.goto('/');
 const cards=page.locator('.native-review-card'),faces=[],motions=new Set();
 await expect(cards).toHaveCount(5);
 for(let index=0;index<5;index++) {
  const card=cards.nth(index),emoji=card.locator('.native-emotion').first();await emoji.scrollIntoViewIfNeeded();
  await expect(card.locator('.review-rating-slot')).toHaveCount(index+1);
  await expect(card.locator('.review-rating-slot:empty')).toHaveCount(0);
  await expect(card.locator('.native-emotion-art')).toHaveCount(index+1);
  const drawings=await card.locator('.native-emotion-art').evaluateAll(elements=>elements.map(el=>el.innerHTML));expect(new Set(drawings).size).toBe(1);faces.push(drawings[0]);
  await expect(emoji).toHaveAttribute('data-animated','true');
  expect(await emoji.locator('.native-emotion-glyph').evaluate(el=>getComputedStyle(el).opacity)).toBe('1');
  const motion=await emoji.locator('.native-emotion-glyph').evaluate(el=>({name:getComputedStyle(el).animationName,state:getComputedStyle(el).animationPlayState}));
  expect(motion.state).toBe('running');expect(motion.name).not.toBe('none');motions.add(motion.name);
 }
 expect(motions.size).toBe(5);expect(new Set(faces).size).toBe(5);await expect(cards.first().locator('.native-emotion')).toHaveAttribute('data-animated','false');
 await page.emulateMedia({reducedMotion:'reduce'});
 expect(await cards.last().locator('.native-emotion-glyph').first().evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
 expect(await cards.last().locator('.native-emotion').first().evaluate(el=>getComputedStyle(el,'::before').animationName)).toBe('none');
 for(const width of [1440,390,320]) {
  await page.setViewportSize({width,height:900});const row=page.getByRole('region',{name:'Scrollable client reviews',exact:true});
  await row.evaluate(el=>el.scrollTo({left:0,behavior:'instant'}));await row.scrollIntoViewIfNeeded();
  expect(await cards.evaluateAll(elements=>elements.every(el=>el.scrollWidth<=el.clientWidth))).toBe(true);
  await row.screenshot({path:`.verification/review-cards-redesign-${width}.png`});
 }
 await page.getByRole('contentinfo').getByRole('link',{name:'Write a review',exact:true}).click();
 await expect(page.locator('.native-faces .native-emotion-art')).toHaveCount(5);
 expect(await page.locator('.native-faces .native-emotion-art').evaluateAll(elements=>elements.map(el=>el.innerHTML))).toEqual(faces);
 await page.setViewportSize({width:1440,height:1000});await page.locator('.native-faces').screenshot({path:'.verification/reference-rating-faces.png'});
 await expect(page.getByRole('radio',{name:'5 Love it',exact:true})).toBeEnabled();
 expect(await page.locator('.native-faces .native-emotion-glyph').evaluateAll(elements=>elements.every(el=>getComputedStyle(el).animationName==='none'))).toBe(true);
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

test('empty or unavailable reviews and testimonials hide independently without placeholder space',async({page})=>{
 for(const width of [390,1440]) {
  await page.setViewportSize({width,height:900});
  for(const options of [{empty:true},{failFeed:true},{emptyKinds:['REVIEW']},{emptyKinds:['VIDEO']},{failedKinds:['REVIEW']},{failedKinds:['VIDEO']}]) {
   await page.unroute('**/*');await setup(page,options);
   const responses=['REVIEW','VIDEO'].map(kind=>page.waitForResponse(response=>new URL(response.url()).pathname==='/api/feedback' && new URL(response.url()).searchParams.get('kind')===kind));
   await page.goto('/');await Promise.all(responses);await expect(page.getByRole('contentinfo').getByRole('link',{name:'Write a review',exact:true})).toBeVisible();
   const reviewsVisible=!options.empty && !options.failFeed && !options.emptyKinds?.includes('REVIEW') && !options.failedKinds?.includes('REVIEW');
   const videosVisible=!options.empty && !options.failFeed && !options.emptyKinds?.includes('VIDEO') && !options.failedKinds?.includes('VIDEO');
   await expect(page.getByRole('heading',{name:'Reviews',exact:true})).toHaveCount(reviewsVisible?1:0);
   await expect(page.getByRole('heading',{name:'Testimonials',exact:true})).toHaveCount(videosVisible?1:0);
   await expect(page.locator('.native-review-card')).toHaveCount(reviewsVisible?1:0);await expect(page.locator('.native-video-card')).toHaveCount(videosVisible?2:0);
   await expect(page.locator('.native-feedback')).toHaveCount(reviewsVisible || videosVisible?1:0);
   await expect(page.getByText(/No published .* yet\.|No native rating available\.|Loading client reviews|Loading video testimonials|Published reviews unavailable/)).toHaveCount(0);
   await expect(page.getByRole('button',{name:'Refresh reviews'})).toHaveCount(0);
   if(videosVisible && !reviewsVisible) await expect(page.locator('.native-testimonials')).not.toContainText('These reviews are selected for publication by the business.');
  }
 }
});


test('mobile review form has room to complete and submit at 320px and 390px',async({page})=>{
 const {posts}=await setup(page);
 for(const width of [320,390]) {
  await page.setViewportSize({width,height:844});const form=await openForm(page);await fill(form);
  await expect(form.getByRole('radio',{name:'5 Love it',exact:true})).toBeChecked();
  await form.getByRole('button',{name:'Submit review',exact:true}).scrollIntoViewIfNeeded();
  await expect(form.getByRole('button',{name:'Submit review',exact:true})).toBeInViewport();
  await form.getByRole('button',{name:'Submit review',exact:true}).click();await expect(form.getByRole('status')).toHaveText('Thank you. Your review has been submitted for review.');
 }
 expect(posts).toHaveLength(2);
});
