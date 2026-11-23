import {test,expect} from '@playwright/test';
import {createBrokerClient} from '../../server/brokbuddy.mjs';
import {validateInquiry} from '../../server/http.mjs';
import {mockApi,env} from '../fixtures.mjs';

let data;
test.beforeAll(async()=>{data=await createBrokerClient({env,fetchImpl:mockApi().fetchImpl}).site();});
test.beforeEach(async({page})=>{
  await page.route('**/api/site*',route=>route.fulfill({json:data}));
  await page.route('**/api/inquiries',route=>route.fulfill({status:503,json:{message:'Mock submission unavailable.'}}));
  await page.route('https://api.example.test/**',route=>route.fulfill({status:204}));
});
const form=page=>page.getByRole('form',{name:'Contact enquiry'});
const next=page=>form(page).getByRole('button',{name:'Continue'}).click();
async function contactDetails(page,service='Buy property',visitorType='Customer') {
  await form(page).getByLabel('Nationality').fill('Emirati');await form(page).getByRole('radio',{name:visitorType,exact:true}).check();await next(page);
  await form(page).getByLabel('Full name').fill('Test Person');
  await form(page).getByLabel('Phone number').fill('+971 50 000 0000');
  await form(page).getByRole('radio',{name:service,exact:true}).check();await next(page);
}
async function requirements(page,{buy=true,residential=true}={}) {
  await form(page).getByRole('radio',{name:residential ? 'Residential' : 'Commercial',exact:true}).check();
  await form(page).getByLabel('Property type').selectOption(residential ? 'Villa' : 'Office');
  if(buy) {
    await form(page).getByLabel(residential ? 'Completion status' : 'Purpose').selectOption(residential ? 'Ready' : 'Own business');
    return;
  }
  if(residential) {
    await form(page).getByLabel('Who will live here?').selectOption('Family');
    return;
  }
}

for(const buy of [true,false]) for(const residential of [true,false]) {
  const title=`${buy ? 'Buy' : 'Rent'} ${residential ? 'residential' : 'commercial'}`;
  test(`${title} follows its own questions and sends all details without requiring email`,async({page})=>{
    const submissions=[];
    await page.route('**/api/inquiries',route=>{submissions.push(route.request().postDataJSON());return route.fulfill({json:{ok:true}});});
    const visitorType=buy && !residential ? 'Broker' : !buy && residential ? 'Below 18' : 'Customer';
    await page.goto('/contact');await contactDetails(page,buy ? 'Buy property' : 'Rent property',visitorType);
    await requirements(page,{buy,residential});
    if(buy && residential) await page.locator('.contact-card').screenshot({path:'.verification/contact-workflow/desktop-buy-residential.png'});
    await expect(form(page).getByLabel('Bedrooms')).toHaveCount(0);
    await expect(form(page).getByLabel('How will you finance the purchase?')).toHaveCount(0);
    await expect(form(page).locator('.contact-workflow select')).toHaveCount(buy || residential ? 2 : 1);
    await expect(form(page).locator('.contact-workflow input, .contact-workflow textarea')).toHaveCount(0);
    if(!buy && residential) {
      const occupants=form(page).getByLabel('Who will live here?');
      expect(await occupants.getByRole('option').allTextContents()).toEqual(['Select an option','Married couple','Family','Unmarried couple','Solo male','Solo female','Group of men','Group of women','Mixed-gender group']);
      await occupants.selectOption('');await next(page);await expect(occupants).toBeVisible();
      await occupants.selectOption('Family');
    }
    await next(page);await expect(page.getByRole('heading',{name:'Review your enquiry'})).toBeVisible();
    expect(submissions).toHaveLength(0);
    await expect(form(page)).toContainText(title);await expect(form(page)).toContainText('Emirati');
    await form(page).getByRole('button',{name:'Send enquiry'}).click();await expect(page.getByRole('heading',{name:'Enquiry received'})).toBeVisible();
    expect(submissions).toHaveLength(1);const payload=submissions[0];expect(validateInquiry(payload)).toEqual(payload);
    expect(payload).toMatchObject({name:'Test Person',phone:'+971 50 000 0000',propertyType:residential ? 'Villa' : 'Office'});
    expect(payload.message).toContain(`Contact enquiry: ${title}`);expect(payload.message).toContain(`You are: ${visitorType}`);expect(payload.message).toContain('Nationality: Emirati');
    if(buy) {
      expect(payload).not.toHaveProperty('budget');expect(payload.message).toContain(residential ? 'Completion status: Ready' : 'Purpose: Own business');
      expect(payload.message).not.toMatch(/Preferred area:|budget:|timeline:|Financing:|Minimum floor area:|Bedrooms:|Additional requirements:/);
    } else if(residential) {
      expect(payload).not.toHaveProperty('budget');expect(payload.message).toContain('Occupants: Family');
      expect(payload.message).not.toMatch(/Preferred area:|budget:|timeline:|Bedrooms:|Furnishing:|Minimum floor area:|Lease duration:|Additional requirements:/);
    } else {
      expect(payload).not.toHaveProperty('budget');expect(payload.message).toContain('Property type: Office');
      expect(payload.message).not.toMatch(/Preferred area:|budget:|timeline:|Minimum floor area:|Lease duration:|Additional requirements:|Bedrooms:|Occupants:|Completion status:|Purpose:/);
    }
    await page.getByRole('button',{name:'Start a new enquiry'}).click();await expect(form(page).getByLabel('Nationality')).toHaveValue('');await expect(form(page).getByRole('radio',{checked:true})).toHaveCount(0);
  });
}

test('nationality, contact details, service and requirements are required before advancing',async({page})=>{
  await page.goto('/contact');await next(page);await expect(form(page).getByLabel('Nationality')).toBeVisible();
  await expect(form(page).getByLabel('Full name')).toHaveCount(0);
  await form(page).getByLabel('Nationality').fill('   ');await next(page);await expect(form(page).getByLabel('Nationality')).toBeVisible();
  await form(page).getByLabel('Nationality').fill('Indian');await next(page);await expect(form(page).getByLabel('Nationality')).toBeVisible();
  await form(page).getByRole('radio',{name:'Customer',exact:true}).check();await next(page);await next(page);await expect(form(page).getByLabel('Full name')).toBeVisible();
  await form(page).getByLabel('Full name').fill('Test Person');await form(page).getByLabel('Phone number').fill('invalid');await form(page).getByRole('radio',{name:'Buy property'}).check();await next(page);await expect(form(page).getByLabel('Phone number')).toBeVisible();
  await form(page).getByLabel('Phone number').fill('+971500000000');await next(page);await next(page);await expect(form(page).getByRole('radio',{name:'Residential',exact:true})).toBeVisible();
  await form(page).getByRole('radio',{name:'Residential',exact:true}).check();await next(page);await expect(form(page).getByLabel('Property type')).toBeVisible();
});

test('changing service or sector keeps separate drafts and excludes stale branch answers',async({page})=>{
  await page.goto('/contact');await contactDetails(page);await requirements(page);
  await form(page).getByRole('radio',{name:'Commercial',exact:true}).check();await expect(form(page).getByLabel('Property type')).toHaveValue('');
  await form(page).getByRole('radio',{name:'Residential',exact:true}).check();await expect(form(page).getByLabel('Property type')).toHaveValue('Villa');
  await form(page).getByRole('button',{name:'Back',exact:true}).click();await form(page).getByRole('radio',{name:'Rent property'}).check();await next(page);
  await expect(form(page).getByRole('radio',{name:'Residential',exact:true})).not.toBeChecked();
  await requirements(page,{buy:false,residential:false});await next(page);
  await expect(form(page)).toContainText('Rent commercial');await expect(form(page)).not.toContainText('Financing');await expect(form(page)).not.toContainText('Bedrooms');
  await form(page).getByRole('button',{name:'Edit requirements'}).click();await expect(form(page).getByLabel('Property type')).toHaveValue('Office');
});

test('mobile contact entry and every step fit the viewport',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/properties');
  await page.getByRole('button',{name:'Open menu'}).click();await page.getByRole('button',{name:'Contact Us',exact:true}).click();
  await expect(page).toHaveURL(/\/contact$/);await expect(form(page).getByLabel('Nationality')).toBeVisible();
  const fits=async()=>expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await fits();await page.locator('.contact-card').screenshot({path:'.verification/contact-workflow/mobile-nationality.png'});
  await contactDetails(page,'Rent property');await requirements(page,{buy:false,residential:true});await fits();
  await page.locator('.contact-card').screenshot({path:'.verification/contact-workflow/mobile-rent-residential.png'});
  await requirements(page,{buy:false,residential:false});await fits();
  await page.locator('.contact-card').screenshot({path:'.verification/contact-workflow/mobile-rent-commercial.png'});
  await next(page);await fits();await page.locator('.contact-card').screenshot({path:'.verification/contact-workflow/mobile-review.png'});
});
