import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,cp,readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const source=fileURLToPath(new URL('../',import.meta.url));
async function fixture(){
 const root=await mkdtemp(path.join(tmpdir(),'camp-publication-'));
 await cp(path.join(source,'scripts'),path.join(root,'scripts'),{recursive:true});
 await mkdir(path.join(root,'config'));await mkdir(path.join(root,'data'));
 const config=JSON.parse(await readFile(path.join(source,'config/airtable-publication.example.json'),'utf8'));config.approved=true;
 await writeFile(path.join(root,'config/airtable-publication.json'),JSON.stringify(config));
 await cp(path.join(source,'data/public-instruments.json'),path.join(root,'data/public-instruments.json'));
 return root;
}
const baseFields={'Ready to Publish':true,'Instrument Name':'Fixture instrument','Instrument Family':['recFamilyExample'],'Sort Order':1,'Junior Status':'Open','Junior Blurb':'Junior summary','Senior Status':'Full','Senior Blurb':'Senior summary'};
function run(root,changes={},dryRun=false){
 const fields={...baseFields,...changes};
 const code=`
 ${dryRun?"process.argv.push('--dry-run');":''}
 globalThis.fetch=async(input)=>{
  const url=new URL(input),requested=url.searchParams.getAll('fields[]');
  if(requested.some(f=>/Legacy|Contact/.test(f)))throw Error('Read a disabled/private field');
  const family=url.pathname.endsWith('/tblFamilyExample');
  return {ok:true,json:async()=>({records:family?[{id:'recFamilyExample',fields:{Name:'Fixture family','Sort Order':1}}]:[{id:'recPrivateId',fields:${JSON.stringify(fields)}},{id:'recArchived',fields:{'Ready to Publish':true,'Archived':true,'Instrument Name':'DO_NOT_EXPORT_ARCHIVED'}}]})};
 };
 await import(${JSON.stringify('file://'+path.join(root,'scripts/publish-airtable.mjs'))});`;
 return spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8',env:{...process.env,AIRTABLE_TOKEN:'fixture-credential',AIRTABLE_BASE_ID:'appExample',AIRTABLE_TABLE_ID:'tblExample',AIRTABLE_FAMILY_TABLE_ID:'tblFamilyExample'}});
}
const snapshot=root=>readFile(path.join(root,'data/public-instruments.json'),'utf8');
const item=async root=>JSON.parse(await snapshot(root)).groups[0].items[0];
async function check(body){const root=await fixture();try{await body(root);}finally{await rm(root,{recursive:true,force:true});}}
test('public allowlist excludes raw IDs, disabled details and private fields; unchanged export is a no-op',()=>check(async root=>{
 const extra={'Junior Show Level Details':false,'Junior Level Details':'DO_NOT_EXPORT_DETAILS','Senior Show Level Details':false,'Senior Level Details':'DO_NOT_EXPORT_DETAILS','Legacy Blurb':'DO_NOT_EXPORT_LEGACY','Contact email':'DO_NOT_EXPORT_CONTACT'};
 assert.equal(run(root,extra).status,0);const text=await snapshot(root);assert(!/DO_NOT_EXPORT|recPrivateId|recFamilyExample/.test(text));const out=await item(root);assert.match(out.id,/^instrument-[a-f0-9]{24}$/);assert.deepEqual(out.junior.details,[]);assert.deepEqual(out.senior.details,[]);assert.equal(out.junior.summary,'Junior summary');assert.match(run(root,extra).stdout,/No public content changed/);assert.equal(await snapshot(root),text);
}));
test('blank fields retain published values by stable identity, including after a name change',()=>check(async root=>{
 assert.equal(run(root).status,0);const old=await item(root);
 const result=run(root,{'Instrument Name':'Renamed instrument','Instrument Family':[],'Junior Status':'','Junior Blurb':'  ','Senior Status':null,'Senior Blurb':null});assert.equal(result.status,0,result.stderr);
 const next=await item(root);assert.equal(next.id,old.id);assert.equal(next.name,'Renamed instrument');assert.deepEqual(next.junior,old.junior);assert.deepEqual(next.senior,old.senior);assert.equal(JSON.parse(await snapshot(root)).groups[0].name,'Fixture family');
 assert.equal(run(root,{'Instrument Name':'','Junior Blurb':'Updated Junior only','Senior Blurb':''}).status,0);const changed=await item(root);assert.equal(changed.name,'Renamed instrument');assert.equal(changed.junior.summary,'Updated Junior only');assert.equal(changed.senior.summary,'Senior summary');
}));
test('legacy snapshot migrates by unique instrument name and resolves old profile summaries',()=>check(async root=>{
 const d=JSON.parse(await snapshot(root));d.groups=[{name:'Old family',items:[{name:'Fixture instrument',junior:{profile:'retained',status:'Limited'},senior:{summary:'Keep senior',status:'Closed'}}]}];d.profiles={retained:{summary:'Keep Junior profile',details:['old details suppressed']}};await writeFile(path.join(root,'data/public-instruments.json'),JSON.stringify(d));
 assert.equal(run(root,{'Junior Blurb':'','Junior Status':'','Senior Blurb':'','Senior Status':''}).status,0);const x=await item(root);assert.equal(x.junior.summary,'Keep Junior profile');assert.equal(x.junior.status,'Limited');assert.equal(x.senior.summary,'Keep senior');assert.equal(x.senior.status,'Closed');assert.deepEqual(x.junior.details,[]);
}));
test('new blank record uses honest unconfirmed text and Unverified status, never Open by default',()=>check(async root=>{
 const result=run(root,{'Junior Blurb':'','Junior Status':null,'Senior Blurb':null,'Senior Status':''});assert.equal(result.status,0,result.stderr);const x=await item(root);for(const camp of ['junior','senior']){assert.equal(x[camp].status,'Unverified');assert.match(x[camp].summary,/not yet been confirmed/);}
}));
test('Not Offered suppresses stored requirements without changing the other camp',()=>check(async root=>{
 assert.equal(run(root,{'Junior Status':'Not Offered','Junior Show Level Details':true,'Junior Level Details':'Do not show this'}).status,0);const x=await item(root);assert.deepEqual(x.junior,{status:'Not Offered',summary:'',details:[]});assert.equal(x.senior.status,'Full');assert.equal(x.senior.summary,'Senior summary');
}));
for(const [label,changes]of [['empty',{'Ready to Publish':false}],['invalid status',{'Junior Status':'invented'}],['new unnamed',{'Instrument Name':''}],['new family missing',{'Instrument Family':[]}],['unknown family',{'Instrument Family':['recUnknown']}]])test(`${label} export preserves the previous snapshot`,()=>check(async root=>{
 const before=await snapshot(root);assert.notEqual(run(root,changes).status,0);assert.equal(await snapshot(root),before);
}));
for(const approved of [true,false])test(`dry run with approved=${approved} never changes the snapshot`,()=>check(async root=>{
 const before=await snapshot(root),result=run(root,{'Ready to Publish':approved},true);assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/website unchanged/i);assert.equal(await snapshot(root),before);
}));

test('Junior details toggle publishes guidance, blank text retains prior guidance, false hides it',()=>check(async root=>{
 const first=run(root,{'Junior Show Level Details':true,'Junior Level Details':'Read notes\nKnow simple keys'});assert.equal(first.status,0,first.stderr);assert.deepEqual((await item(root)).junior.details,['Read notes','Know simple keys']);
 assert.equal(run(root,{'Junior Show Level Details':true,'Junior Level Details':'  '}).status,0);assert.deepEqual((await item(root)).junior.details,['Read notes','Know simple keys']);
 assert.equal(run(root,{'Junior Show Level Details':false,'Junior Level Details':'Still stored in Airtable'}).status,0);assert.deepEqual((await item(root)).junior.details,[]);
}));
test('enabled Junior details with no text and no prior details does not block publication',()=>check(async root=>{
 const result=run(root,{'Junior Show Level Details':true,'Junior Level Details':''});assert.equal(result.status,0,result.stderr);assert.deepEqual((await item(root)).junior.details,[]);
}));

test('Senior details follow the same explicit toggle and blank-merge rules independently of Junior',()=>check(async root=>{
 const result=run(root,{'Senior Show Level Details':true,'Senior Level Details':'First/solo parts: Grade 4–5+\nStrong sight-reading','Junior Show Level Details':false});assert.equal(result.status,0,result.stderr);assert.deepEqual((await item(root)).senior.details,['First/solo parts: Grade 4–5+','Strong sight-reading']);assert.deepEqual((await item(root)).junior.details,[]);
 assert.equal(run(root,{'Senior Show Level Details':true,'Senior Level Details':''}).status,0);assert.equal((await item(root)).senior.details.length,2);
 assert.equal(run(root,{'Senior Show Level Details':false,'Senior Level Details':'Keep this in Airtable'}).status,0);assert.deepEqual((await item(root)).senior.details,[]);
}));
