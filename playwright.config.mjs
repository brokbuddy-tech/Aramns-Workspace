import {defineConfig} from '@playwright/test';
const baseURL=process.env.BROWSER_BASE_URL || 'http://127.0.0.1:3000';
export default defineConfig({
  testDir:'./tests/browser',fullyParallel:false,workers:1,timeout:30000,
  outputDir:'.verification/browser-results',reporter:[['list'],['json',{outputFile:'.verification/browser-results.json'}]],
  use:{baseURL,viewport:{width:1440,height:1000},headless:true,screenshot:'only-on-failure'},
  webServer:process.env.BROWSER_BASE_URL ? undefined : {command:'npm run dev',url:'http://127.0.0.1:3000',reuseExistingServer:true,timeout:30000},
});
