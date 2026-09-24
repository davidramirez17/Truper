// Isolated visual test harness. Never imported by Next.js or deployed.
// Auth and mutations are stubbed only in this esbuild bundle on 127.0.0.1:3101.
import { build } from 'esbuild';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const modules = {
  'next/navigation': `export const usePathname=()=>location.pathname; export const useSearchParams=()=>new URLSearchParams(location.search); export const useRouter=()=>({push:url=>location.assign(url),refresh:()=>location.reload()});`,
  'next/link': `import React from 'react'; export default function Link({href,children,...props}) { return React.createElement('a',{href,...props},children); }`,
  'next/image': `import React from 'react'; export default function Image({priority,fill,...props}) { return React.createElement('img',props); }`,
  actions: `const action=async()=>({ok:false,error:'Prueba visual aislada: no se ejecutan cambios de datos.'}); export const createProject=action,importSales=action,manageUser=action,assignMember=action;`,
};
const output = await build({
  stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import {Workspace} from './src/modules/workspace/Workspace'; import {Providers} from './src/components/Providers';
  const owner={id:'10000000-0000-4000-8000-000000000001',email:'qa@example.invalid',full_name:'Revisión de interfaz',role:'superadmin',status:'active',created_at:'2026-09-23T12:00:00Z'};
  const project={id:'10000000-0000-4000-8000-000000000002',name:'Proyecto de prueba visual',description:'Entorno aislado para verificar interfaz y estados vacíos. Sin operaciones reales.',initials:'QA',color:'orange',status:'unconfigured',source:'Sin archivo',owner:owner.full_name,updatedAt:null,canEdit:true,activeBatchId:null};
  const data={mode:'real',asOf:'2026-09-23',projects:location.search.includes('empty')?[]:[project],records:[],alerts:[],profile:owner,users:[owner,{...owner,id:'10000000-0000-4000-8000-000000000003',email:'pendiente@example.invalid',full_name:'Cuenta de prueba visual',role:'viewer',status:'pending'}],members:[],imports:[],activity:[]};
  const routes={'/':'overview','/proyectos':'projects','/fuentes':'sources','/reportes':'reports','/usuarios':'users','/cargas':'history','/actividad':'activity','/diseno':'design','/configuracion':'settings','/alertas':'alerts'};
  createRoot(document.getElementById('root')).render(<Providers><Workspace data={data} view={routes[location.pathname]||'detail'} projectId={routes[location.pathname]?undefined:project.id}/></Providers>);`, resolveDir: root, loader: 'tsx' },
  bundle: true, write: false, format: 'esm', platform: 'browser', alias: { '@': resolve(root,'src') },
  define: { 'process.env.NODE_ENV':'"development"' },
  plugins: [{ name:'isolated-ui-stubs',setup(api) {
    api.onResolve({filter:/^next\/(navigation|link|image)$/},args=>({path:args.path,namespace:'qa'}));
    api.onResolve({filter:/(^|\/)actions$/},args=>({path:'actions',namespace:'qa'}));
    api.onLoad({filter:/.*/,namespace:'qa'},args=>({contents:modules[args.path],resolveDir:root,loader:'js'}));
  } }],
});
// The upload worker is the same parser as production, bundled separately for UI checks.
const worker = await build({entryPoints:['src/modules/sources/validation.worker.ts'],bundle:true,write:false,format:'iife',platform:'browser'});
const html = '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/styles.css"><title>QA aislado · Truper</title></head><body><div id="root"></div><script type="module" src="/test-ui.js"></script></body></html>';
createServer(async(req,res)=>{
  const path=new URL(req.url,'http://localhost').pathname;
  try {
    if(path==='/test-ui.js'){res.setHeader('Content-Type','application/javascript');res.end(output.outputFiles[0].text);return;}
    if(path.endsWith('/validation.worker.ts')){res.setHeader('Content-Type','application/javascript');res.end(worker.outputFiles[0].text);return;}
    if(path==='/styles.css'){res.setHeader('Content-Type','text/css');res.end(await readFile(resolve(root,'.next/static/css/app/layout.css')));return;}
    if(path==='/brand/truper.svg'){res.setHeader('Content-Type','image/svg+xml');res.end(await readFile(resolve(root,'public/brand/truper.svg')));return;}
    if(path.startsWith('/_next/static/media/')&&!path.includes('..')){res.setHeader('Content-Type','font/woff2');res.end(await readFile(resolve(root,'.next/static/media',path.split('/').at(-1))));return;}
    res.setHeader('Content-Type','text/html');res.end(html);
  }catch{res.statusCode=404;res.end('Not found');}
}).listen(3101,'127.0.0.1',()=>console.log('Isolated visual harness: http://localhost:3101 (no remote mutations)'));
