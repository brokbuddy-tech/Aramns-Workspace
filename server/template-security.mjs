import {createHash} from 'node:crypto';

// This module is server/build tooling only. Agency values are checked for leaks,
// but are never used to authenticate this individual broker template.
export function privateTemplateValues(env=process.env) {
  return Object.entries(env).filter(([name,value]) => /(?:BROKBUDDY|TEMPLATE|BROKER|AGENCY).*?(?:CODE|HASH)$/i.test(name) && typeof value === 'string' && value.length >= 16).map(([,value])=>value);
}

export function createCredentialGuard(env=process.env) {
  const fingerprints = new Set();
  for(const value of privateTemplateValues(env)) {
    for(const fingerprint of [value,createHash('sha256').update(value).digest('hex'),Buffer.from(value).toString('base64'),Buffer.from(value).toString('base64url')]) fingerprints.add(fingerprint.toLowerCase());
  }
  return value => {
    const pending=[value];
    while(pending.length) {
      const next=pending.pop();
      if(next && typeof next==='object') {pending.push(...Object.keys(next),...Object.values(next));continue;}
      if(typeof next!=='string') continue;
      let text=next;
      for(let pass=0;pass<3;pass++) {
        const normalized=text.toLowerCase();
        if([...fingerprints].some(fingerprint=>normalized.includes(fingerprint))) return true;
        // Catch URL-encoded and JSON unicode-escaped copies without logging them.
        text=text.replace(/%([\da-f]{2})/giu,(_,hex)=>String.fromCharCode(parseInt(hex,16))).replace(/\\u00([\da-f]{2})/giu,(_,hex)=>String.fromCharCode(parseInt(hex,16)));
      }
    }
    return false;
  };
}

export function assertPrivateTemplateConfiguration(env) {
  const publicEntries=Object.entries(env).filter(([name])=>/^(VITE_|NEXT_PUBLIC_|PUBLIC_)/u.test(name));
  if(publicEntries.some(([name])=>/(?:BROKBUDDY|TEMPLATE|BROKER|AGENCY).*?(?:CODE|HASH)$/iu.test(name)) || createCredentialGuard(env)(publicEntries)) {
    throw new Error('Template credentials must use private server environment variables.');
  }
}
