// Explicitly read-only: these client methods make authenticated GET requests.
// Never print the environment, credentials, profile, listings, or raw errors.
import {mkdir,writeFile} from 'node:fs/promises';
import {createBrokerClient} from '../server/brokbuddy.mjs';
try {process.loadEnvFile();} catch(error) {if(error.code!=='ENOENT') throw new Error('Unable to load private server configuration.');}
const client=createBrokerClient();
const report={readOnly:true,productionWrites:0};
try {
  const feed=await client.site();
  report.feedPassed=true;report.inventoryCount=feed.properties.length;
  if(feed.properties.length) {
    const detail=await client.site(feed.properties[0].id);
    report.detailPassed=detail.selectedProperty?.id===feed.properties[0].id;
    if(!report.detailPassed) throw new Error();
  } else report.detailPassed=null;
  const branding=await client.branding();
  report.brandingPassed=typeof branding.name==='string' && branding.name.length>0;
  report.taglineAvailable=Boolean(branding.tagline);
} catch(error) {report.passed=false;report.status=Number.isInteger(error.status) ? error.status : null;process.exitCode=1;}
report.passed=report.passed!==false;
await mkdir('.verification/contact',{recursive:true});
await writeFile('.verification/contact/live-read.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
