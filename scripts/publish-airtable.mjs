// Run on demand on a trusted machine or GitHub Actions; never in the browser.
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';import path from 'node:path';
import {validate} from './public-data.mjs';
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
const rows=records.filter(record=>record.fields?.[field.publish]===true&&record.fields?.[field.archived]!==true).map(record=>{
 const f=record.fields;const item={name:string(f[field.name],'instrument name')};
 for(const camp of ['junior','senior']){
  const campStatus=status(f[field[camp+'Status']]);
  if(campStatus==='Not Offered'){item[camp]={status:campStatus,summary:'',details:[]};continue;}
  const show=f[field[camp+'ShowDetails']]===true;
  item[camp]={status:campStatus,summary:string(f[field[camp+'Summary']],`${camp} summary`),details:show?string(f[field[camp+'Details']],`${camp} level details`).split(/\r?\n/).map(s=>s.trim()).filter(Boolean):[]};
 }
 const links=f[field.family];if(!Array.isArray(links)||links.length!==1||!familyMap.has(links[0]))throw Error('Public instrument must link to one known family.');
 const family=familyMap.get(links[0]);
 return {family:lookupText(family[config.familyFields.name],'family name'),familyOrder:number(family[config.familyFields.sortOrder]),sortOrder:number(f[field.sortOrder]),item};
});
if(!rows.length)throw Error('Export has zero approved public instruments; refusing to replace the current snapshot.');
rows.sort((a,b)=>a.familyOrder-b.familyOrder||a.family.localeCompare(b.family)||a.sortOrder-b.sortOrder||a.item.name.localeCompare(b.item.name));
const groups=[];for(const row of rows){let group=groups.find(g=>g.name===row.family);if(!group){group={name:row.family,items:[]};groups.push(group);}group.items.push(row.item);}
const dest=path.join(root,'data/public-instruments.json');const previous=JSON.parse(await readFile(dest,'utf8'));
const next=validate({sampleData:config.sampleData,updatedText:previous.updatedText,publicNotice:string(config.publicNotice,'notice'),publicFooter:string(config.publicFooter,'footer'),profiles:{},groups});
if(JSON.stringify(next)===JSON.stringify(previous)){console.log('No public content changed. No snapshot write or deployment needed.');process.exit(0);}
next.updatedText='Updated '+new Intl.DateTimeFormat('en-AU',{dateStyle:'long',timeZone:'Australia/Brisbane'}).format(new Date());
await writeFile(dest,JSON.stringify(next,null,2)+'\n');console.log(`Public snapshot changed: ${groups.length} families, ${rows.length} entries. No private fields or Airtable record IDs exported.`);
