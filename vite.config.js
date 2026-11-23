import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {assertPrivateTemplateConfiguration,createCredentialGuard} from './server/template-security.mjs';
import {auditTemplateArtifacts} from './scripts/audit-template-artifacts.mjs';

export default defineConfig(({mode,command}) => {
  const env={...loadEnv(mode,process.cwd(),''),...process.env};
  assertPrivateTemplateConfiguration(env);
  const containsCredential=createCredentialGuard(env);
  let config;
  return {
  plugins: [react(),{
    name:'private-template-boundary',
    configResolved(resolved) {config=resolved;},
    transform(_source,id) {
      const filename=id.split('?')[0];
      if(['server','api','scripts'].some(folder=>filename.startsWith(path.join(config.root,folder)+path.sep))) throw new Error('Private server modules must not be imported into browser code.');
    },
    generateBundle(_options,bundle) {
      for(const output of Object.values(bundle)) {
        const text=output.type==='chunk' ? output.code : typeof output.source==='string' ? output.source : Buffer.from(output.source).toString('utf8');
        if(containsCredential(text)) throw new Error('Private template credential detected in browser bundle. Publication is blocked.');
      }
    },
    async closeBundle() {
      if(command==='build') await auditTemplateArtifacts(path.resolve(config.root,config.build.outDir),env);
    },
  }],
  envPrefix:'VITE_',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: false,
  },
  };
});
