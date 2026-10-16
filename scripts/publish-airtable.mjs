// Run on demand on a trusted machine or GitHub Actions; never in the browser.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';import path from 'node:path';
import {validate} from './public-data.mjs';
const dryRun=process.argv.includes('--dry-run');
const root=fileURLToPath(new URL('../',import.meta.url));
const configPath=path.join(root,'config/airtable-publication.json');
let config;try{config=JSON.parse(await readFile(configPath,'utf8'));}catch{throw Error('Publication is not configured. Confirm the destination and public field mapping before copying the example config.');}
if(config.approved!==true)throw Error('Public-field mapping is not approved. No Airtable request made.');
const {AIRTABLE_TOKEN:token,AIRTABLE_BASE_ID:base,AIRTABLE_TABLE_ID:table,AIRTABLE_FAMILY_TABLE_ID:familyTable}=process.env;
if(!token||!/^app[A-Za-z0-9]+$/.test(base||'')||!/^tbl[A-Za-z0-9]+$/.test(table||'')||!/^tbl[A-Za-z0-9]+$/.test(familyTable||'')||(config.viewId&&!/^viw[A-Za-z0-9]+$/.test(config.viewId)))throw Error('Missing token or valid approved base/table/view IDs.');
const required=['publish','archived','name','family','sortOrder','juniorStatus','juniorSummary','juniorShowDetails','juniorDetails','seniorStatus','seniorSummary','seniorShowDetails','seniorDetails'];
if(!config.fields||required.some(k=>typeof config.fields[k]!=='string'||!config.fields[k].trim())||Object.keys(config.fields).some(k=>!required.includes(k)))throw Error('Public field allowlist is incomplete or contains unknown keys.');
if(typeof config.sampleData!=='boolean')throw Error('Set sampleData explicitly after content review.');
if(!config.familyFields||Object.keys(config.familyFields).sort().join(',')!=='archived,name,sortOrder'||Object.values(config.familyFields).some(v=>typeof v!=='string'||!v.trim()))throw Error('Approve the public family field allowlist.');
const allowlist=[...new Set(Object.values(config.fields))];
async function readTable(tableId,fields,view){const records=[];let offset;do{
 const url=new URL(`https://api.airtable.com/v0/${base}/${tableId}`);if(view)url.searchParams.set('view',view);url.searchParams.set('pageSize','100');if(offset)url.searchParams.set('offset',offset);for(const field of fields)url.searchParams.append('fields[]',field);
 const response=await fetch(url,{headers:{Authorization:`Bearer ${token}`}});
 if(!response.ok)throw Error(`Airtable read failed (HTTP ${response.status}); no snapshot changed.`);
 const result=await response.json();if(!Array.isArray(result.records))throw Error('Invalid Airtable response.');
 records.push(...result.records);offset=result.offset;if(offset)await new Promise(resolve=>setTimeout(resolve,250));
}while(offset);return records;}
const records=await readTable(table,allowlist,config.viewId);
const families=await readTable(familyTable,Object.values(config.familyFields));
const familyMap=new Map(families.filter(record=>record.fields[config.familyFields.archived]!==true).map(record=>[record.id,record.fields]));
const field=config.fields;
const string=(value,label)=>{if(typeof value!=='string'||!value.trim())throw Error(`Missing public ${label}; snapshot unchanged.`);return value.trim();};
const lookupText=(value,label)=>{if(Array.isArray(value)){if(value.length!==1)throw Error(`Expected one public ${label}.`);value=value[0];}const result=string(value,label);if(/^rec[A-Za-z0-9]+$/.test(result))throw Error('Family is a linked-record ID. Configure an approved text lookup/formula instead.');return result;};
const number=value=>{if(Array.isArray(value))value=value[0];const n=Number(value);return Number.isFinite(n)?n:0;};
const status=value=>{const found={open:'Open',limited:'Limited',full:'Full',closed:'Closed','second instruments only':'Second Instruments Only','not offered':'Not Offered',unverified:'Unverified'}[String(value||'').toLowerCase()];if(!found)throw Error('A camp has a missing or unsupported public status; snapshot unchanged.');return found;};
const dest=path.join(root,'data/public-instruments.json');
const previous=validate(JSON.parse(await readFile(dest,'utf8')));
const oldItems=previous.groups.flatMap(group=>group.items.map(item=>({item,family:group.name})));
const oldById=new Map(oldItems.filter(x=>x.item.id).map(x=>[x.item.id,x]));
// Name matching is used only to migrate the original snapshot that had no IDs.
const legacyByName=new Map(oldItems.filter(x=>!x.item.id).map(x=>[x.item.name,x]));
const nonblank=value=>typeof value==='string'&&value.trim()?value.trim():null;
const fallback='Requirements have not yet been confirmed. Please contact the organisers.';
const approvedRecords=records.filter(record=>record.fields?.[field.publish]===true&&record.fields?.[field.archived]!==true);
const rows=approvedRecords.map(record=>{
 const f=record.fields;
 // Opaque, stable public key: raw Airtable record IDs never leave the exporter.
 const id='instrument-'+createHash('sha256').update(record.id).digest('hex').slice(0,24);
 const prior=oldById.get(id)||legacyByName.get(nonblank(f[field.name]));
 const name=nonblank(f[field.name])||prior?.item.name;
 if(!name)throw Error('A new public instrument needs a name; snapshot unchanged.');
 const item={id,name};
 if(prior?.item.note)item.note=prior.item.note;
 for(const camp of ['junior','senior']){
  const old=prior?.item[camp];
  const campStatus=nonblank(f[field[camp+'Status']])?status(f[field[camp+'Status']]):old?.status||'Unverified';
  if(campStatus==='Not Offered'){item[camp]={status:campStatus,summary:'',details:[]};continue;}
  const oldSummary=nonblank(old?.summary)||nonblank(previous.profiles[old?.profile]?.summary);
  let details=[];
  if(f[field[camp+'ShowDetails']]===true){
   const supplied=nonblank(f[field[camp+'Details']]);
   details=supplied?supplied.split(/\r?\n/).map(s=>s.trim()).filter(Boolean):(old?.details||previous.profiles[old?.profile]?.details||[]);
   if(!supplied&&!details.length)console.warn(`${name}: ${field[camp+'Details']} is blank; no ${camp} details published.`);
  }
  item[camp]={status:campStatus,summary:nonblank(f[field[camp+'Summary']])||oldSummary||fallback,details};
 }
 const links=f[field.family];let family,sortOrder;
 if(!links||Array.isArray(links)&&!links.length){
  if(!prior)throw Error(`New public instrument ${name} needs a family; snapshot unchanged.`);
  family=prior.family;sortOrder=previous.groups.findIndex(g=>g.name===family);
 }else{
  if(!Array.isArray(links)||links.length!==1||!familyMap.has(links[0]))throw Error(`Public instrument ${name} must link to one active family; snapshot unchanged.`);
  const sourceFamily=familyMap.get(links[0]);family=nonblank(sourceFamily[config.familyFields.name])||prior?.family;if(!family)throw Error(`New public instrument ${name} needs a family name; snapshot unchanged.`);sortOrder=sourceFamily[config.familyFields.sortOrder]===undefined||sourceFamily[config.familyFields.sortOrder]===null||sourceFamily[config.familyFields.sortOrder]===''?Math.max(0,previous.groups.findIndex(g=>g.name===family)):number(sourceFamily[config.familyFields.sortOrder]);
 }
 return {family,familyOrder:sortOrder,sortOrder:f[field.sortOrder]===undefined||f[field.sortOrder]===null||f[field.sortOrder]===''?oldItems.findIndex(x=>x.item===prior?.item):number(f[field.sortOrder]),item};
});
if(!rows.length){
 if(dryRun){console.log('Connection checked: both source tables read successfully; zero instruments are Ready to Publish. Website unchanged.');process.exit(0);}
 throw Error('Export has zero approved public instruments; refusing to replace the current snapshot.');
}
rows.sort((a,b)=>a.familyOrder-b.familyOrder||a.family.localeCompare(b.family)||a.sortOrder-b.sortOrder||a.item.name.localeCompare(b.item.name));
const groups=[];for(const row of rows){let group=groups.find(g=>g.name===row.family);if(!group){group={name:row.family,items:[]};groups.push(group);}group.items.push(row.item);}
const next=validate({sampleData:config.sampleData,updatedText:previous.updatedText,publicNotice:string(config.publicNotice,'notice'),publicFooter:string(config.publicFooter,'footer'),profiles:{},groups});
if(dryRun){console.log(`Connection and approved content validated: ${groups.length} families, ${rows.length} entries. Dry run: website unchanged.`);process.exit(0);}
if(JSON.stringify(next)===JSON.stringify(previous)){console.log('No public content changed. No snapshot write or deployment needed.');process.exit(0);}
next.updatedText='Updated '+new Intl.DateTimeFormat('en-AU',{dateStyle:'long',timeZone:'Australia/Brisbane'}).format(new Date());
await writeFile(dest,JSON.stringify(next,null,2)+'\n');console.log(`Public snapshot changed: ${groups.length} families, ${rows.length} entries. No private fields or Airtable record IDs exported.`);
