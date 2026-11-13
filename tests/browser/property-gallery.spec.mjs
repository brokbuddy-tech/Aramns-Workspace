import {test, expect} from '@playwright/test';
import {createBrokerClient} from '../../server/brokbuddy.mjs';
import {mockApi, env} from '../fixtures.mjs';

let data;
test.beforeAll(async () => {data = await createBrokerClient({env, fetchImpl:mockApi().fetchImpl}).site();});
test.beforeEach(async ({page}) => {
  await page.route('**/api/visitor', route => route.fulfill({json:{ok:true}}));
  await page.route('**/api/property-views/*', route => route.fulfill({json:{ok:true}}));
  await page.route('https://api.example.test/**', route => route.fulfill({contentType:'image/svg+xml', body:'<svg xmlns="http://www.w3.org/2000/svg" width="960" height="640"><rect width="960" height="640" fill="#ccc7bb"/><path d="M0 0L960 640M960 0L0 640" stroke="#968c79" stroke-width="30"/></svg>'}));
});

async function openListing(page, count = 18) {
  const property = {...data.properties[0],images:Array.from({length:count}, (_, index) => `https://api.example.test/gallery-${index + 1}.jpg`)};
  await page.route('**/api/site*', route => route.fulfill({json:{...data,properties:[property],selectedProperty:property}}));
  await page.goto(`/property/${property.id}`);
  await expect(page.getByRole('heading', {name:property.title, exact:true})).toBeVisible();
  return page.getByRole('region', {name:'Property photos', exact:true});
}

test('long photo collections stay compact and the full gallery supports browsing, grid and zoom', async ({page}) => {
  const gallery = await openListing(page);
  await expect(gallery.locator('.property-photo-preview button')).toHaveCount(4);
  await expect(gallery.locator('img')).toHaveCount(5);
  expect((await gallery.boundingBox()).height).toBeLessThan(600);
  await gallery.getByRole('button', {name:'Preview photo 2', exact:true}).click();
  await expect(gallery.getByText('Photo 2 of 18', {exact:true})).toBeVisible();
  const trigger = gallery.getByRole('button', {name:'View all photos (18)', exact:true});
  const triggerBox = await trigger.boundingBox();
  const galleryBox = await gallery.boundingBox();
  expect(Math.abs(triggerBox.x + triggerBox.width / 2 - galleryBox.x - galleryBox.width / 2)).toBeLessThan(1);
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading')).toHaveText('Property 01 — 2 / 18');
  await expect(dialog.getByRole('button', {name:'Close photo gallery'})).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  await dialog.getByRole('button', {name:'Next photo', exact:true}).click();
  await expect(dialog.getByRole('heading')).toHaveText('Property 01 — 3 / 18');
  await page.keyboard.press('End');
  await expect(dialog.getByRole('heading')).toHaveText('Property 01 — 18 / 18');
  await page.keyboard.press('ArrowRight');
  await expect(dialog.getByRole('heading')).toHaveText('Property 01 — 1 / 18');
  await page.keyboard.press('ArrowLeft');
  await expect(dialog.getByRole('heading')).toHaveText('Property 01 — 18 / 18');
  await page.keyboard.press('Home');
  await dialog.getByRole('button', {name:'Go to photo 12', exact:true}).click();
  await expect(dialog.getByRole('heading')).toHaveText('Property 01 — 12 / 18');
  await dialog.getByRole('button', {name:'Zoom in', exact:true}).click();
  await expect(dialog.getByRole('region', {name:'Zoomed photo, scroll to explore'})).toBeVisible();
  await dialog.getByRole('button', {name:'Next photo', exact:true}).click();
  await expect(dialog.getByRole('button', {name:'Zoom in', exact:true})).toHaveAttribute('aria-pressed', 'false');
  await dialog.getByRole('button', {name:'Photo grid', exact:true}).click();
  await expect(dialog.getByRole('button', {name:/^Open photo \d+$/})).toHaveCount(18);
  const firstGridPhoto = await dialog.getByRole('button', {name:'Open photo 1', exact:true}).boundingBox();
  const nextGridRow = await dialog.getByRole('button', {name:'Open photo 4', exact:true}).boundingBox();
  expect(nextGridRow.y).toBeGreaterThanOrEqual(firstGridPhoto.y + firstGridPhoto.height + 15);
  expect(await dialog.locator('.property-photo-grid').evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
  await dialog.getByRole('button', {name:'Open photo 18', exact:true}).click();
  await expect(dialog.getByRole('heading')).toHaveText('Property 01 — 18 / 18');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
});

test('gallery handles single photos, missing photos and failed image loads', async ({page}) => {
  let gallery = await openListing(page, 1);
  await expect(gallery.locator('.property-photo-preview')).toHaveCount(0);
  await gallery.getByRole('button', {name:'View all photos (1)', exact:true}).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('button', {name:'Next photo', exact:true})).toHaveCount(0);
  await expect(dialog.getByRole('button', {name:'Photo grid', exact:true})).toHaveCount(0);
  await dialog.getByRole('button', {name:'Close photo gallery', exact:true}).click();
  gallery = await openListing(page, 0);
  await expect(gallery.getByText('No photos available', {exact:true})).toBeVisible();
  await expect(gallery.getByRole('button')).toHaveCount(0);
  await expect(gallery.locator('img')).toHaveCount(0);
  await page.route('https://api.example.test/gallery-1.jpg', route => route.fulfill({status:404,body:''}));
  gallery = await openListing(page, 1);
  await expect(gallery.getByText('Photo unavailable', {exact:true})).toBeVisible();
});

test.describe('mobile gallery', () => {
  test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  test('photos swipe in both directions, thumbnails scroll and the modal traps focus', async ({page}) => {
    const gallery = await openListing(page);
    expect((await gallery.boundingBox()).height).toBeLessThan(350);
    await gallery.getByRole('button', {name:'Preview photo 4', exact:true}).tap();
    await gallery.getByRole('button', {name:'View all photos (18)', exact:true}).tap();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading')).toHaveText('Property 01 — 4 / 18');
    const viewer = dialog.locator('.property-photo-viewer');
    const box = await viewer.boundingBox();
    const client = await page.context().newCDPSession(page);
    const swipe = async (startX, endX) => {
      const y = box.y + box.height / 2;
      await client.send('Input.dispatchTouchEvent', {type:'touchStart',touchPoints:[{x:startX,y}]});
      await client.send('Input.dispatchTouchEvent', {type:'touchMove',touchPoints:[{x:endX,y}]});
      await client.send('Input.dispatchTouchEvent', {type:'touchEnd',touchPoints:[]});
    };
    await swipe(280, 100);
    await expect(dialog.getByRole('heading')).toHaveText('Property 01 — 5 / 18');
    await swipe(100, 280);
    await expect(dialog.getByRole('heading')).toHaveText('Property 01 — 4 / 18');
    await page.keyboard.press('End');
    await expect(dialog.getByRole('button', {name:'Go to photo 18', exact:true})).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await dialog.getByRole('button', {name:'Close photo gallery', exact:true}).focus();
    await page.keyboard.press('Shift+Tab');
    await expect(dialog.getByRole('button', {name:'Go to photo 18', exact:true})).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('button', {name:'Close photo gallery', exact:true})).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });
});
