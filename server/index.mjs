import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createBrokerClient} from './brokbuddy.mjs';
import {createApiHandler} from './http.mjs';
try {process.loadEnvFile();} catch(error) {if(error.code!=='ENOENT') throw new Error('Unable to load server environment.');}
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dev=process.argv.includes('--dev');
const api=createApiHandler(createBrokerClient());
const vite=dev ? await (await import('vite')).createServer({root,server:{middlewareMode:true},appType:'spa'}) : null;
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.mp4':'video/mp4','.woff2':'font/woff2'};
const server=http.createServer(async (req,res)=>{
  let pathname;
  try {pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);} catch {res.writeHead(400);res.end('Invalid request.');return;}
  if(pathname.startsWith('/api/')) return api(req,res);
  // Private dotfiles are denied in development and production.
  if(/(?:^|\/)\./.test(pathname) && !(dev && pathname.startsWith('/node_modules/.vite/deps/'))) {res.writeHead(404);res.end();return;}
  if(vite) return vite.middlewares(req,res);
  if(!['GET','HEAD'].includes(req.method)) {res.writeHead(405);res.end();return;}
  try {
    const target=path.resolve(root,'dist','.'+pathname), dist=path.join(root,'dist');
    if(!target.startsWith(dist+path.sep) && target!==dist) throw Error();
    let file=target;
    try {if(!(await stat(file)).isFile()) throw Error();} catch {
      // Asset misses are never rewritten into successful HTML responses.
      if(path.extname(pathname)) throw Error();
      file=path.join(dist,'index.html');
    }
    const data=await readFile(file);
    res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin'});
    res.end(req.method==='HEAD' ? undefined : data);
  } catch {res.writeHead(404);res.end('Not found.');}
});
server.requestTimeout=15000;
server.headersTimeout=10000;
server.listen(Number(process.env.PORT||3000),process.env.HOST||'127.0.0.1',()=>console.log(`Novalux server listening on port ${server.address().port}`));
for(const signal of ['SIGTERM','SIGINT']) process.on(signal,()=>server.close(async()=>{await vite?.close();process.exit(0);}));
