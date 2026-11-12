import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {env, mockApi} from './fixtures.mjs';

test('Vercel entry serves scoped API reads and raw enquiry streams without a listener', async (t) => {
  const previous = Object.fromEntries(Object.keys(env).map(key => [key, process.env[key]]));
  Object.assign(process.env, env);
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  const upstream = mockApi({count: 2});
  t.mock.method(globalThis, 'fetch', upstream.fetchImpl);
  const {default: handler} = await import('../api/index.mjs');
  async function call(url, {method = 'GET', payload, headers = {}} = {}) {
    const req = Readable.from(payload === undefined ? [] : [Buffer.from(payload)]);
    Object.assign(req, {url, method, headers: {
      host: 'novalux.example', origin: 'https://novalux.example',
      'content-type': 'application/json', 'idempotency-key': 'vercel-enquiry-test-key',
      ...headers,
    }});
    let status, responseHeaders, body;
    await handler(req, {
      writeHead(code, values) { status = code; responseHeaders = values; },
      end(data) { body = JSON.parse(data); },
    });
    return {status, headers: responseHeaders, body};
  }

  const site = await call('/api/site');
  assert.equal(site.status, 200);
  assert.equal(site.body.properties.length, 2);
  assert.equal(site.headers['cache-control'], 'no-store');
  assert.ok(!JSON.stringify(site.body).includes(env.BROKBUDDY_BROKER_CODE));
  const detail = await call('/api/site?listingId=listing-2');
  assert.equal(detail.status, 200);
  assert.ok(upstream.calls.some(({url}) => url.pathname.endsWith('/listings/listing-2')));
  assert.equal((await call('/api/site?slug=another-broker')).status, 400);
  assert.equal((await call('/api/unknown')).status, 404);

  const payload = JSON.stringify({name: 'Test Visitor', email: 'visitor@example.test',
    message: 'Please arrange a viewing of this property.', listingId: 'listing-1'});
  assert.equal((await call('/api/inquiries', {method: 'POST', payload})).status, 200);
  const post = upstream.calls.find(({options}) => options.method === 'POST');
  assert.equal(post.options.headers['idempotency-key'], 'vercel-enquiry-test-key');
  assert.equal(post.options.headers['X-BrokBuddy-Broker-Code'], undefined);
  assert.equal((await call('/api/inquiries', {method: 'POST', payload,
    headers: {origin: 'https://other.example'}})).status, 403);
  assert.equal((await call('/api/inquiries', {method: 'POST', payload: '{'})).status, 400);
  assert.equal((await call('/api/inquiries', {method: 'POST', payload: 'x'.repeat(17000)})).status, 413);
});
