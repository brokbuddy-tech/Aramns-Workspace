import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createCredentialGuard} from '../server/template-security.mjs';
import {auditTemplateArtifacts} from './audit-template-artifacts.mjs';

// Read-only audit. It reports object/file counts, never secret values, hashes,
// credential-bearing URLs, matching source lines, or historical blob contents.
try {process.loadEnvFile();} catch(error) {if(error.code!=='ENOENT') throw new Error('Unable to load private audit configuration.');}
const exec=promisify(execFile);
const guard=createCredentialGuard(process.env);
const {stdout:objects}=await exec('git',['rev-list','--objects','--all'],{maxBuffer:16*1024*1024});
const candidates=new Map();
let environmentPaths=0;
for(const line of objects.trim().split('\n')) {
  const [object,...parts]=line.split(' '),filename=parts.join(' ');
  if(!filename) continue;
  if(/(?:^|\/)\.env(?:\.|$)/u.test(filename) && !filename.endsWith('.env.example')) environmentPaths++;
  if(/\.(?:[cm]?js|jsx|tsx?|json|html|css|map|md|txt|ya?ml|sh)$/iu.test(filename) || /(?:^|\/)\.env(?:\.|$)/u.test(filename)) candidates.set(object,filename);
}
let knownCredentialObjects=0,credentialLiteralObjects=0;
for(const [object] of candidates) {
  const {stdout:body}=await exec('git',['cat-file','blob',object],{maxBuffer:32*1024*1024});
  if(guard(body)) knownCredentialObjects++;
  if(/(?:templateHexCode|publicTemplateCodeHash|(?:VITE_|NEXT_PUBLIC_)?(?:BROKBUDDY_)?(?:BROKER_CODE|AGENCY_CODE|TEMPLATE_CODE|TEMPLATE_HEX_CODE))\s*[:=]\s*["'`]?([\da-f]{32,64})\b/iu.test(body) || /(?:[?&](?:hex|code|templateHexCode)=|\/templates\/[^/]+\/)[\da-f]{32}\b/iu.test(body)) credentialLiteralObjects++;
}
const {stdout:tracked}=await exec('git',['ls-files','-z']);
let trackedCredentialFiles=0;
for(const filename of tracked.split('\0').filter(Boolean)) {
  if(!/\.(?:[cm]?js|jsx|tsx?|json|html|css|map|md|txt|ya?ml|sh)$/iu.test(filename)) continue;
  try {if(guard(await readFile(filename,'utf8'))) trackedCredentialFiles++;} catch(error) {if(error.code!=='ENOENT') throw error;}
}
const artifactReport=await auditTemplateArtifacts('dist');
const report={scope:'Novalux checkout and reachable local Git history only',historyTextObjectsChecked:candidates.size,knownCredentialObjects,credentialLiteralObjects,historicalEnvironmentPaths:environmentPaths,trackedCredentialFiles,productionArtifacts:artifactReport,limitations:['Unknown previously rotated credentials cannot be exhaustively identified.','Hosted logs, exports, remote-only history, backups and deployed CDN caches require operator review.'],changesToHistoricalData:false};
await mkdir('.verification/template-auth',{recursive:true});
await writeFile('.verification/template-auth/history.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
