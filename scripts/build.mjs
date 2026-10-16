import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import {validate} from './public-data.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>readFile(path.join(root,p),'utf8');
const data=validate(JSON.parse(await read('data/public-instruments.json')));
const css=await read('src/styles.css');
const template=await read('src/widget.js');
if(!template.includes('/*__DATA__*/ null')||!template.includes('/*__CSS__*/ null'))throw Error('Build markers missing');
const js=template.replace('/*__DATA__*/ null',()=>JSON.stringify(data)).replace('/*__CSS__*/ null',()=>JSON.stringify(css));
new vm.Script(js); // Syntax-check the actual browser bundle without executing DOM APIs.
const rows=data.groups.reduce((n,g)=>n+g.items.length,0);
if(process.argv.includes('--check')){console.log(`Valid public snapshot: ${data.groups.length} families, ${rows} entries; bundle syntax OK.`);process.exit(0);}
const dist=path.join(root,'dist');await mkdir(dist,{recursive:true});
await writeFile(path.join(dist,'adventure-instrument-finder.js'),js);
await writeFile(path.join(dist,'public-instruments.json'),JSON.stringify(data,null,2)+'\n');
await writeFile(path.join(dist,'.nojekyll'),'');
const demo=await read('src/demo.html');
await writeFile(path.join(dist,'index.html'),demo);
await writeFile(path.join(dist,'demo.html'),demo);
console.log(`Built standalone Wix JS and public demo: ${data.groups.length} families, ${rows} entries. No pending roster edits applied.`);
