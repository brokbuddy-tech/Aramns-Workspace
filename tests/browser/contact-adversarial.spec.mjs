import {test,expect} from '@playwright/test';
import {createBrokerClient} from '../../server/brokbuddy.mjs';
import {mockApi,env} from '../fixtures.mjs';

let data;
const failures=new WeakMap();
const form=page=>page.getByRole('form',{name:'Contact enquiry'});
const next=page=>form(page).getByRole('button',{name:'Continue',exact:true}).click();
test.beforeAll(async()=>{data=await createBrokerClient({env,fetchImpl:mockApi().fetchImpl}).site();});
test.beforeEach(async({page})=>{
  const errors=[];failures.set(page,errors);
  page.on('pageerror',error=>errors.push(error.message));
  page.on('dialog',async dialog=>{errors.push('Unexpected script dialog');await dialog.dismiss();});
  await page.route('**/api/site*',route=>route.fulfill({json:data}));
  await page.route('**/api/branding',route=>route.fulfill({json:{name:'Test Broker',tagline:'Property Consultant'}}));
  await page.route('**/api/inquiries',route=>route.fulfill({status:503,json:{message:'Synthetic test failure'}}));
  for(const path of ['visitor','property-views/*','quick-link-clicks']) await page.route(`**/api/${path}`,route=>route.fulfill({json:{ok:true}}));
  await page.route('https://api.example.test/**',route=>route.fulfill({status:204}));
});
test.afterEach(async({page})=>{expect(failures.get(page)).toEqual([]);});

async function identity(page,{nationality='Emirati',name='Test Person',phone='+971500000000',service='Rent property'}={}) {
  await form(page).getByLabel('Nationality').fill(nationality);
  await form(page).getByRole('radio',{name:'Customer',exact:true}).check();await next(page);
  await form(page).getByLabel('Full name').fill(name);await form(page).getByLabel('Phone number').fill(phone);
  await form(page).getByRole('radio',{name:service,exact:true}).check();await next(page);
}
async function review(page,values) {
  await page.goto('/contact');await identity(page,values);
  await form(page).getByRole('radio',{name:'Commercial',exact:true}).check();
  await form(page).getByLabel('Property type').selectOption('Office');await next(page);
  await expect(page.getByRole('heading',{name:'Review your enquiry',exact:true})).toBeVisible();
}

test('repeated same-tick submit events cannot skip unanswered forms',async({page})=>{
  await page.goto('/contact');await form(page).getByLabel('Nationality').fill('Emirati');
  await form(page).getByRole('radio',{name:'Customer',exact:true}).check();
  await form(page).evaluate(element=>{for(let i=0;i<8;i++) element.requestSubmit();});
  await expect(page.getByRole('heading',{name:'Your details',exact:true})).toBeVisible();
  await expect(form(page).getByLabel('Full name')).toBeVisible();
  await next(page);await expect(form(page).getByLabel('Full name')).toBeVisible();
});

test('programmatic submit and oversized autofill cannot bypass earlier validation',async({page})=>{
  await page.goto('/contact');
  await form(page).evaluate(element=>{element.noValidate=true;element.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});
  await expect(form(page).getByLabel('Nationality')).toBeVisible();
  const nationality=form(page).getByLabel('Nationality');
  await nationality.evaluate(element=>element.removeAttribute('maxlength'));
  await nationality.fill('a'.repeat(81));
  await nationality.evaluate(element=>element.setAttribute('maxlength','80'));
  await form(page).getByRole('radio',{name:'Customer',exact:true}).check();await next(page);
  await expect(form(page).getByLabel('Nationality')).toBeVisible();
});

for(const [label,body] of [['null','null'],['array','[]'],['HTML','<html>upstream proxy error</html>'],['empty',''],['object message','{"message":{"private":"unexpected"}}']]) {
  test(`malformed ${label} responses show a friendly error and retain a retryable draft`,async({page})=>{
    const attempts=[];
    await page.route('**/api/inquiries',route=>{
      attempts.push({body:route.request().postDataJSON(),key:route.request().headers()['idempotency-key']});
      return attempts.length===1 ? route.fulfill({status:502,contentType:'application/json',body}) : route.fulfill({json:{ok:true}});
    });
    await review(page);await form(page).getByRole('button',{name:'Send enquiry',exact:true}).click();
    await expect(page.getByRole('alert')).toHaveText(/could not|couldn.t|retry|try again/i);
    await expect(page.getByRole('alert')).not.toContainText(/TypeError|Unexpected token|Cannot read|JSON|\[object Object\]/);
    await expect(form(page)).toContainText('Test Person');
    await form(page).getByRole('button',{name:'Send enquiry',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Enquiry received',exact:true})).toBeVisible();
    expect(attempts).toHaveLength(2);expect(attempts[0]).toEqual(attempts[1]);
  });
}

test('rapid sends remain one request, disable editing, and a new enquiry gets a fresh key',async({page})=>{
  const attempts=[];let release;
  const pending=new Promise(resolve=>{release=resolve;});
  await page.route('**/api/inquiries',async route=>{
    attempts.push({body:route.request().postDataJSON(),key:route.request().headers()['idempotency-key']});
    if(attempts.length===1) await pending;
    await route.fulfill({json:{ok:true}});
  });
  try {
    await review(page);
    await form(page).evaluate(element=>{for(let i=0;i<10;i++) element.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});
    await expect.poll(()=>attempts.length).toBe(1);
    await expect(form(page).getByRole('button',{name:'Sending enquiry…',exact:true})).toBeDisabled();
    await expect(form(page).getByRole('button',{name:'Back',exact:true})).toBeDisabled();
    await expect(form(page).getByRole('button',{name:'Edit requirements',exact:true})).toBeDisabled();
    release();await expect(page.getByRole('heading',{name:'Enquiry received',exact:true})).toBeVisible();
    await page.getByRole('button',{name:'Start a new enquiry',exact:true}).click();
    await identity(page);await form(page).getByRole('radio',{name:'Commercial',exact:true}).check();
    await form(page).getByLabel('Property type').selectOption('Office');await next(page);
    await form(page).getByRole('button',{name:'Send enquiry',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Enquiry received',exact:true})).toBeVisible();
    expect(attempts).toHaveLength(2);expect(attempts[0].key).not.toBe(attempts[1].key);
  } finally {release();}
});

test('all error statuses and unconfirmed successes retain the draft and retry key',async({page})=>{
  const attempts=[];
  const responses=[...[400,401,403,404,409,413,429,500,502,503,504].map(status=>({status,json:{message:'Synthetic service failure. Please retry.'}})),...[{}, {ok:false},{ok:'true'},{ok:1},null,[]].map(json=>({status:200,json}))];
  await page.route('**/api/inquiries',route=>{
    attempts.push({body:route.request().postDataJSON(),key:route.request().headers()['idempotency-key']});
    return route.fulfill(responses[attempts.length-1] || {json:{ok:true}});
  });
  await review(page);
  for(let i=0;i<responses.length;i++) {
    await form(page).getByRole('button',{name:'Send enquiry',exact:true}).click();
    await expect(page.getByRole('alert')).toContainText(/retry|try again/i);
    await expect(form(page)).toContainText('Test Person');
    await expect(page.getByRole('heading',{name:'Enquiry received',exact:true})).toHaveCount(0);
  }
  await form(page).getByRole('button',{name:'Send enquiry',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Enquiry received',exact:true})).toBeVisible();
  expect(attempts).toHaveLength(responses.length+1);
  expect(new Set(attempts.map(attempt=>attempt.key)).size).toBe(1);
});

test('offline failures and timeouts remain retryable without technical error text',async({page})=>{
  const attempts=[];
  await page.route('**/api/inquiries',route=>{
    attempts.push(route.request().headers()['idempotency-key']);
    return attempts.length===1 ? route.abort('internetdisconnected') : route.fulfill({json:{ok:true}});
  });
  await review(page);await form(page).getByRole('button',{name:'Send enquiry',exact:true}).click();
  await expect(page.getByRole('alert')).toHaveText('We could not send your enquiry. Please try again.');
  await page.evaluate(()=>{window.originalTimeout=AbortSignal.timeout;AbortSignal.timeout=()=>AbortSignal.abort(new DOMException('Synthetic timeout','TimeoutError'));});
  await form(page).getByRole('button',{name:'Send enquiry',exact:true}).click();
  await expect(page.getByRole('alert')).toHaveText('Delivery could not be confirmed. Please retry.');
  await page.evaluate(()=>{AbortSignal.timeout=window.originalTimeout;});
  await form(page).getByRole('button',{name:'Send enquiry',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Enquiry received',exact:true})).toBeVisible();
  expect(attempts).toHaveLength(2);expect(attempts[0]).toBe(attempts[1]);
});

test('editing a failed enquiry changes its key and keeps the newly selected branch only',async({page})=>{
  const attempts=[];
  await page.route('**/api/inquiries',route=>{
    attempts.push({body:route.request().postDataJSON(),key:route.request().headers()['idempotency-key']});
    return route.fulfill(attempts.length===1 ? {status:503,json:{message:'Please retry.'}} : {json:{ok:true}});
  });
  await review(page);await form(page).getByRole('button',{name:'Send enquiry',exact:true}).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await form(page).getByRole('button',{name:'Back',exact:true}).click();
  await form(page).getByRole('button',{name:'Back',exact:true}).click();
  await form(page).getByLabel('Full name').fill('أحمد بن علي');
  await form(page).getByRole('radio',{name:'Buy property',exact:true}).check();await next(page);
  await form(page).getByRole('radio',{name:'Residential',exact:true}).check();
  await form(page).getByLabel('Property type').selectOption('Penthouse');
  await form(page).getByLabel('Completion status').selectOption('Off-plan');await next(page);
  await form(page).getByRole('button',{name:'Send enquiry',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Enquiry received',exact:true})).toBeVisible();
  expect(attempts).toHaveLength(2);expect(attempts[0].key).not.toBe(attempts[1].key);
  expect(attempts[1].body).toMatchObject({name:'أحمد بن علي',transactionType:'buy',nationality:'Emirati',propertyType:'Penthouse'});
  expect(attempts[1].body.message).toContain('Completion status: Off-plan');
  expect(attempts[1].body.message).not.toMatch(/Office|Occupants:|Purpose:/);
});

test('long and injection-shaped user input stays literal and fits a 320px screen',async({page})=>{
  await page.setViewportSize({width:320,height:700});
  await page.route('**/api/inquiries',route=>route.fulfill({json:{ok:true}}));
  const name='<img src=x onerror=alert(1)>'.padEnd(120,'X');
  await review(page,{nationality:'ا'.repeat(80),name});
  await expect(form(page)).toContainText(name);
  await expect(form(page).locator('img,script,iframe')).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await form(page).getByRole('button',{name:'Send enquiry',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Enquiry received',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('forged property options cannot advance and a healthy feed refresh preserves the draft',async({page})=>{
  let reads=0;
  await page.route('**/api/site*',route=>{reads++;return route.fulfill({json:data});});
  await page.goto('/contact');await identity(page);
  await form(page).getByRole('radio',{name:'Residential',exact:true}).check();
  const type=form(page).getByLabel('Property type');
  await type.evaluate(element=>element.add(new Option('Forged type','__forged__')));
  await type.selectOption('__forged__');await form(page).getByLabel('Who will live here?').selectOption('Family');
  await next(page);await expect(type).toBeVisible();
  await type.selectOption('Villa');await next(page);
  const previousReads=reads;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await expect.poll(()=>reads).toBeGreaterThan(previousReads);
  await expect(page.getByRole('heading',{name:'Review your enquiry',exact:true})).toBeVisible();
  await expect(form(page)).toContainText('Test Person');await expect(form(page)).toContainText('Villa');
});
