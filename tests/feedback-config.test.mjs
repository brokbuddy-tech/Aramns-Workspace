import {test} from 'node:test';
import assert from 'node:assert/strict';
import {feedbackConfig} from './feedback-fixtures.mjs';
import {FEEDBACK_UNAVAILABLE,isFeedbackConfigAvailable,readFeedbackJson} from '../src/lib/feedback-config.mjs';

test('review entry requires an enabled, usable form configuration',()=>{
  const config={...feedbackConfig,enabled:true,scope:'broker'};
  assert.equal(isFeedbackConfigAvailable(config),true);
  assert.equal(isFeedbackConfigAvailable({...config,scope:'agency'}),true);
  for(const value of [null,{},false,{...config,enabled:false},{...config,enabled:'true'},{...config,scope:'other'},
    {...config,avatarMimeTypes:[]},{...config,avatarMimeTypes:['image/svg+xml']},{...config,ratingFaces:[]},
    {...config,ratingFaces:['','','','','']},{...config,messageMaxLength:undefined},
    {...config,scope:'agency',brokers:[{id:'',name:'Unknown'}]}]) assert.equal(isFeedbackConfigAvailable(value),false);
});

test('availability reads bypass caches and disabled/server errors never become healthy config',async t=>{
  const calls=[];
  t.mock.method(globalThis,'fetch',async(url,options)=>{calls.push({url,options});return Response.json({enabled:false},{status:404});});
  await assert.rejects(readFeedbackJson('/api/feedback/config'),error=>error.status===404 && error.disabled);
  assert.equal(calls[0].options.cache,'no-store');assert.equal(calls[0].options.credentials,'same-origin');
  globalThis.fetch=async()=>Response.json({message:'Temporarily unavailable'},{status:503});
  await assert.rejects(readFeedbackJson('/api/feedback/config'),error=>error.status===503);
  globalThis.fetch=async()=>new Response('invalid json');
  await assert.rejects(readFeedbackJson('/api/feedback/config'),error=>error.status===503 && error.message===FEEDBACK_UNAVAILABLE);
  globalThis.fetch=async()=>{throw new Error('Network down');};
  await assert.rejects(readFeedbackJson('/api/feedback/config'),error=>error.status===503 && error.message===FEEDBACK_UNAVAILABLE);
});
