// Explicit schema allowlist. Unknown properties fail instead of being published.
const keys=(value,allowed,label)=>{
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error(`${label}: expected object`);
 for(const key of Object.keys(value))if(!allowed.includes(key))throw Error(`${label}: unexpected field ${key}`);
};
const text=(value,label)=>{if(typeof value!=='string'||value.length>10000)throw Error(`${label}: expected text up to 10000 characters`);};
export function validate(data){
 keys(data,['sampleData','updatedText','publicNotice','publicFooter','profiles','groups'],'snapshot');
 if(typeof data.sampleData!=='boolean')throw Error('sampleData must be boolean');
 for(const k of ['updatedText','publicNotice','publicFooter'])text(data[k],k);
 keys(data.profiles,Object.keys(data.profiles),'profiles');
 for(const [id,profile] of Object.entries(data.profiles)){keys(profile,['summary','details'],`profile ${id}`);text(profile.summary,id);if(!Array.isArray(profile.details))throw Error('Profile details must be an array');profile.details.forEach(t=>text(t,id));}
 if(!Array.isArray(data.groups)||!data.groups.length)throw Error('No instrument groups');
 const names=new Set();
 for(const group of data.groups){
  keys(group,['name','items'],'group');text(group.name,'family');if(!Array.isArray(group.items)||!group.items.length)throw Error('Empty family');
  for(const item of group.items){
   keys(item,['name','note','junior','senior'],'instrument');text(item.name,'instrument name');
   if(names.has(item.name))throw Error(`Duplicate instrument ${item.name}`);names.add(item.name);
   if(item.note!==undefined)text(item.note,'note');
   for(const camp of ['junior','senior']){
    const value=item[camp];keys(value,['profile','status','summary','details'],`${item.name} ${camp}`);
    if(!['Open','Full','Unverified'].includes(value.status))throw Error(`Invalid status: ${item.name} ${camp}`);
    if(value.profile!==undefined&&!data.profiles[value.profile])throw Error(`Unknown profile: ${value.profile}`);
    if(value.summary!==undefined)text(value.summary,'summary');
    if(!value.summary&&!data.profiles[value.profile]?.summary)throw Error(`Missing summary: ${item.name} ${camp}`);
    if(value.details!==undefined){if(!Array.isArray(value.details))throw Error('Details must be an array');value.details.forEach(t=>text(t,'detail'));}
   }
  }
 }
 return data;
}
