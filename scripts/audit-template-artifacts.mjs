import {opendir} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import {createCredentialGuard,privateTemplateValues} from '../server/template-security.mjs';

export async function auditTemplateArtifacts(directory,env=process.env) {
  const containsCredential=createCredentialGuard(env);
  const overlap=Math.max(1024,...privateTemplateValues(env).map(value=>Math.max(value.length,64)*12));
  let checked=0;
  async function walk(folder) {
    for await(const entry of await opendir(folder)) {
      const target=path.join(folder,entry.name);
      if(containsCredential(path.relative(directory,target))) throw new Error('Private template credential detected in a public artifact filename. Publication is blocked.');
      if(entry.isSymbolicLink()) throw new Error('Public build output must not contain symbolic links.');
      if(entry.isDirectory()) {await walk(target);continue;}
      if(!entry.isFile()) continue;
      let previous='';
      for await(const chunk of createReadStream(target)) {
        const text=previous+chunk.toString('utf8');
        if(containsCredential(text)) throw new Error('Private template credential detected in public build output. Publication is blocked.');
        previous=text.slice(-overlap);
      }
      checked++;
    }
  }
  await walk(directory);
  return {checked,credentialExposed:false};
}
