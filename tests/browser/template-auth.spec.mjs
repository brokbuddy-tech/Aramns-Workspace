import {test,expect} from '@playwright/test';
import http from 'node:http';
import {spawn,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {agent,listing,profile} from '../fixtures.mjs';
import {validateInquiry} from '../../server/http.mjs';
import {createCredentialGuard} from '../../server/template-security.mjs';
import {auditTemplateArtifacts} from '../../scripts/audit-template-artifacts.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const canaries={BROKBUDDY_BROKER_CODE:'31'.repeat(16),BROKBUDDY_OTHER_BROKER_CODE:'42'.repeat(16),BROKBUDDY_AGENCY_CODE:'53'.repeat(16)};
const containsCredential=createCredentialGuard(canaries);
let upstream,website,websiteOrigin,upstreamOrigin,folder,inventory;
const calls=[],submissions=[],logs=[],failures=[];
let denied=false;
let dropNextConfirmation=false;
const intakeRecords=new Map();

async function listen(server) {await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});return `http://127.0.0.1:${server.address().port}`;}

test.beforeAll(async()=>{
  test.setTimeout(60000);
  folder=await mkdtemp(path.join(tmpdir(),'novalux-auth-runtime-'));
  upstream=http.createServer(async(req,res)=>{
    try {
      const url=new URL(req.url,upstreamOrigin);
      if(url.pathname.startsWith('/assets/')) {res.writeHead(200,{'content-type':'image/svg+xml'});res.end('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"><rect width="640" height="400" fill="#dfd5c5"/></svg>');return;}
      let raw='';for await(const chunk of req) raw+=chunk;
      calls.push({url:req.url,method:req.method,headers:req.headers,body:raw});
      if(denied || req.headers['x-brokbuddy-broker-code']!==canaries.BROKBUDDY_BROKER_CODE || req.headers['x-brokbuddy-agency-code']) {res.writeHead(404);res.end('{}');return;}
      const send=data=>{res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify(data));};
      const base='/api/public/broker-template/test-broker';
      if(req.method==='POST' && url.pathname==='/api/public/broker/test-broker/inquiry') {
        const body=validateInquiry(JSON.parse(raw));submissions.push(body);
        const key=req.headers['idempotency-key'];
        const existing=intakeRecords.has(key);
        if(existing && intakeRecords.get(key)!==JSON.stringify(body)) throw new Error('Idempotency payload changed');
        intakeRecords.set(key,JSON.stringify(body));
        if(dropNextConfirmation) {dropNextConfirmation=false;res.writeHead(502);res.end('{}');return;}
        res.writeHead(201,{'content-type':'application/json'});res.end(JSON.stringify({inquiry:null,intake:{submissionId:'synthetic-submission',leadId:'private-lead-id',outcome:existing ? 'idempotent' : 'created',ownershipPreserved:existing}}));return;
      }
      if(req.method==='POST' && (url.pathname===`${base}/quick-link-clicks` || /^\/api\/public\/broker-template\/test-broker\/listings\/[^/]+\/views$/u.test(url.pathname))) {res.writeHead(204);res.end();return;}
      if(req.method==='GET' && url.pathname===base) {send({...profile(inventory),agent:{...agent(),avatarUrl:`${upstreamOrigin}/assets/avatar.svg`}});return;}
      if(req.method==='GET' && url.pathname===`${base}/listings`) {const page=Number(url.searchParams.get('page')),limit=Number(url.searchParams.get('limit'));send({listings:inventory.slice((page-1)*limit,page*limit),page,total:inventory.length,totalPages:Math.ceil(inventory.length/limit)});return;}
      if(req.method==='GET' && url.pathname.startsWith(`${base}/listings/`)) {const item=inventory.find(item=>url.pathname.endsWith('/'+item.id));if(item) {send(item);return;}}
      res.writeHead(404);res.end('{}');
    } catch {failures.push('Synthetic upstream request failed');res.writeHead(500);res.end('{}');}
  });
  upstreamOrigin=await listen(upstream);
  inventory=Array.from({length:127},(_,index)=>listing(index+1,{images:[{id:'photo-1',url:`${upstreamOrigin}/assets/photo.svg`,category:'EXTERIOR',isHero:true}]}));
  const env={...process.env,...canaries,BROKBUDDY_API_BASE_URL:upstreamOrigin,BROKBUDDY_BROKER_PROFILE_SLUG:'test-broker',NODE_ENV:'production',HOST:'127.0.0.1',PORT:'0',GOOGLE_MAPS_BROWSER_API_KEY:'',GOOGLE_MAPS_MAP_ID:''};
  // Build with canary credentials, then use the real production Node entry.
  // An empty runtime cwd prevents loading any operator's real .env file.
  await promisify(execFile)(process.execPath,[path.join(root,'node_modules/vite/bin/vite.js'),'build'],{cwd:root,env,maxBuffer:4*1024*1024});
  const artifactReport=await auditTemplateArtifacts(path.join(root,'dist'),canaries);
  website=spawn(process.execPath,[path.join(root,'server/index.mjs')],{cwd:folder,env,stdio:['ignore','pipe','pipe']});
  websiteOrigin=await new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>reject(new Error('Isolated template server did not start.')),15000);
    website.on('exit',()=>{clearTimeout(timeout);reject(new Error('Isolated template server exited.'));});
    website.stderr.on('data',data=>logs.push(data.toString()));
    website.stdout.on('data',data=>{const text=data.toString();logs.push(text);const match=text.match(/port (\d+)/u);if(match) {clearTimeout(timeout);resolve(`http://127.0.0.1:${match[1]}`);}});
  });
  await mkdir(path.join(root,'.verification/template-auth'),{recursive:true});
  await writeFile(path.join(root,'.verification/template-auth/artifacts.json'),JSON.stringify(artifactReport));
});

test('all contact branches cross the production template proxy, including a lost-confirmation retry',async({page})=>{
  await page.route('**/*',route=>[websiteOrigin,upstreamOrigin].includes(new URL(route.request().url()).origin) ? route.continue() : route.abort());
  const initialRecords=intakeRecords.size,initialSubmissions=submissions.length;
  for(const [service,sector] of [['buy','residential'],['buy','commercial'],['rent','residential'],['rent','commercial']]) {
    await page.goto(websiteOrigin+'/contact');
    const form=page.getByRole('form',{name:'Contact enquiry'});
    await form.getByLabel('Nationality').fill('Indian');await form.getByRole('radio',{name:'Customer',exact:true}).check();
    await form.getByRole('button',{name:'Continue',exact:true}).click();
    await form.getByLabel('Full name').fill('Zoë O’Connor-Smith');await form.getByLabel('Phone number').fill('+971 50 000 0000');
    await form.getByRole('radio',{name:service==='buy' ? 'Buy property' : 'Rent property',exact:true}).check();
    await form.getByRole('button',{name:'Continue',exact:true}).click();
    await form.getByRole('radio',{name:sector==='residential' ? 'Residential' : 'Commercial',exact:true}).check();
    await form.getByLabel('Property type').selectOption(sector==='residential' ? 'Villa' : 'Office');
    if(service==='buy') await form.getByLabel(sector==='residential' ? 'Completion status' : 'Purpose').selectOption(sector==='residential' ? 'Off-plan' : 'Investment');
    else if(sector==='residential') await form.getByLabel('Who will live here?').selectOption('Mixed-gender group');
    await form.getByRole('button',{name:'Continue',exact:true}).click();
    if(service==='buy' && sector==='residential') dropNextConfirmation=true;
    await form.getByRole('button',{name:'Send enquiry',exact:true}).click();
    if(service==='buy' && sector==='residential') {
      await expect(page.getByRole('alert')).toBeVisible();
      await expect(form).toContainText('Zoë O’Connor-Smith');
      await form.getByRole('button',{name:'Send enquiry',exact:true}).click();
    }
    await expect(page.getByRole('heading',{name:'Enquiry received',exact:true})).toBeVisible();
    const submitted=submissions.at(-1);
    expect(submitted).toMatchObject({nationality:'Indian',transactionType:service});
    expect(submitted.specialNotes.find(answer=>answer.key==='sector').value).toBe(sector==='residential' ? 'Residential' : 'Commercial');
    expect(submitted.specialNotes.some(answer=>answer.key==='occupants')).toBe(service==='rent' && sector==='residential');
    expect(submitted.specialNotes.some(answer=>answer.key==='readiness')).toBe(service==='buy' && sector==='residential');
    expect(submitted.specialNotes.some(answer=>answer.key==='purpose')).toBe(service==='buy' && sector==='commercial');
  }
  expect(submissions.length-initialSubmissions).toBe(5);
  expect(intakeRecords.size-initialRecords).toBe(4);
  expect(containsCredential(submissions)).toBe(false);
  expect(failures).toHaveLength(0);
});

test.afterAll(async()=>{
  if(website && website.exitCode===null) {website.kill('SIGTERM');await new Promise(resolve=>{website.once('exit',resolve);setTimeout(resolve,2000);});}
  if(upstream) await new Promise(resolve=>upstream.close(resolve));
  if(folder) await rm(folder,{recursive:true,force:true});
});

test('production browser → same-origin proxy → authenticated broker flow exposes no credentials',async({page})=>{
  test.setTimeout(60000);
  const initialSubmissionCount=submissions.length;
  const browserTraffic=[],responses=[],browserLogs=[];
  const feedHeaders=[];
  const responseChecks=[];
  await page.route('**/*',route=>[websiteOrigin,upstreamOrigin].includes(new URL(route.request().url()).origin) ? route.continue() : route.abort());
  page.on('request',request=>browserTraffic.push({url:request.url(),headers:request.headers(),body:request.postData()}));
  page.on('response',response=>{
    if(new URL(response.url()).pathname==='/api/site') feedHeaders.push(response.headers());
  });
  page.on('requestfinished',request=>{
    if(['document','script','stylesheet','xhr','fetch'].includes(request.resourceType())) responseChecks.push((async()=>{const response=await request.response();if(response) responses.push((await response.body()).toString('utf8'));})().catch(()=>{}));
  });
  page.on('console',message=>browserLogs.push(message.text()));
  page.on('pageerror',error=>browserLogs.push(error.message));

  await page.goto(websiteOrigin+'/properties');
  await expect(page.getByRole('search',{name:'Property search'})).toBeVisible();
  expect(calls.some(call=>call.url.includes('page=2&limit=100'))).toBe(true);
  await page.getByLabel('Search properties',{exact:true}).fill('Property 127');
  await expect(page.getByRole('heading',{name:'Property 127',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'View property details',exact:true}).click();
  await expect(page).toHaveURL(/\/property\/listing-127$/);await expect(page.getByRole('heading',{name:'Property 127',exact:true})).toBeVisible();

  await page.goto(websiteOrigin+'/contact');const form=page.getByRole('form',{name:'Contact enquiry'});
  await form.getByLabel('Nationality').fill('Emirati');await form.getByRole('radio',{name:'Customer',exact:true}).check();await form.getByRole('button',{name:'Continue'}).click();
  await form.getByLabel('Full name').fill('Synthetic Visitor');await form.getByLabel('Phone number').fill('+971500000000');await form.getByRole('radio',{name:'Rent property',exact:true}).check();await form.getByRole('button',{name:'Continue'}).click();
  await form.getByRole('radio',{name:'Commercial',exact:true}).check();await form.getByLabel('Property type').selectOption('Office');await form.getByRole('button',{name:'Continue'}).click();
  await form.getByRole('button',{name:'Send enquiry'}).click();await expect(page.getByRole('heading',{name:'Enquiry received'})).toBeVisible();
  expect(submissions).toHaveLength(initialSubmissionCount+1);expect(submissions.at(-1).propertyType).toBe('Office');expect(containsCredential(submissions)).toBe(false);
  await page.evaluate(async()=>{
    await fetch('/api/visitor',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});
    await fetch('/api/property-views/listing-1',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({visibleDurationMs:2000})});
    await fetch('/api/quick-link-clicks',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({areaId:'synthetic-area',eventId:crypto.randomUUID()})});
  });
  const storage=await page.evaluate(()=>({cookies:document.cookie,local:{...localStorage},session:{...sessionStorage},html:document.documentElement.outerHTML}));
  await Promise.all(responseChecks);
  expect(containsCredential({browserTraffic,responses,browserLogs,storage,logs})).toBe(false);
  expect(calls.every(call=>call.headers['x-brokbuddy-broker-code']===canaries.BROKBUDDY_BROKER_CODE)).toBe(true);
  expect(calls.every(call=>!containsCredential({url:call.url,body:call.body}))).toBe(true);
  expect(failures).toHaveLength(0);
  expect(calls.some(call=>call.url.endsWith('/views'))).toBe(true);expect(calls.some(call=>call.url.endsWith('/quick-link-clicks'))).toBe(true);
  expect(feedHeaders.length).toBeGreaterThan(0);
  expect(feedHeaders.every(headers=>headers['cache-control']==='no-store' && headers['vercel-cdn-cache-control']==='no-store')).toBe(true);
  denied=true;
  await page.reload();await expect(page.getByRole('heading',{name:'Website unavailable',exact:true})).toBeVisible();
  expect(containsCredential(await page.content())).toBe(false);denied=false;
  await writeFile(path.join(root,'.verification/template-auth/production-browser.json'),JSON.stringify({browserRequests:browserTraffic.length,upstreamRequests:calls.length,submissions:submissions.length,credentialExposed:false,productionEntry:true,syntheticUpstream:true},null,2));
});
