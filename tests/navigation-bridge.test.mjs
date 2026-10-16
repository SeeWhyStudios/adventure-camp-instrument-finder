import test from 'node:test';import assert from 'node:assert/strict';
import {setupCustomHeaderNavigation} from '../wix/custom-header-navigation.js';
const menu={instruments:'1. Instruments',program:'2. Program',venue:'3. Venue',schedule:'4. Schedule',pricing:'5. Fees'};
function fixture(){const handlers=new Map(),attrs=new Map();const nav={on:(type,handler)=>{assert(!handlers.has(type),'duplicate handler');handlers.set(type,handler);},setAttribute:(key,value)=>attrs.set(key,value)};return{nav,attrs,handlers,$w:()=>nav};}
test('bridge configures exact supplied IDs once and host sync does not trigger navigation',async()=>{const f=fixture();let calls=0;const options={headerTabsId:'#headerTabs',defaultStateId:'instruments',tabMenu:menu,getCurrentStateId:()=> 'instruments',onChange:async id=>{calls++;return id;}};await setupCustomHeaderNavigation(f.$w,options);await setupCustomHeaderNavigation(f.$w,options);assert.equal(f.handlers.size,3);assert.deepEqual(JSON.parse(f.attrs.get('config')).tabs.map(t=>t.id),Object.keys(menu));assert.equal(calls,0);await f.handlers.get('nl-nav-change')({detail:{stateId:'pricing'}});assert.equal(calls,1);assert.equal(f.attrs.get('selected-state'),'pricing');await f.handlers.get('nl-nav-change')({detail:{stateId:'not-a-tab'}});assert.equal(calls,1);});
test('queued older completion cannot overwrite latest selection; failure restores current section',async()=>{const f=fixture(),pending={};let current='instruments';await setupCustomHeaderNavigation(f.$w,{headerTabsId:'#headerTabs',defaultStateId:'instruments',tabMenu:menu,getCurrentStateId:()=>current,onChange:id=>new Promise((resolve,reject)=>pending[id]={resolve,reject})});const first=f.handlers.get('nl-nav-change')({detail:{stateId:'program'}}),second=f.handlers.get('nl-nav-change')({detail:{stateId:'venue'}});current='program';pending.program.resolve('program');await first;assert.equal(f.attrs.get('selected-state'),'instruments');current='venue';pending.venue.resolve('venue');await second;assert.equal(f.attrs.get('selected-state'),'venue');const failed=f.handlers.get('nl-nav-change')({detail:{stateId:'pricing'}});const old=console.error;console.error=()=>{};try{pending.pricing.reject(new Error('fixture failure'));await failed;}finally{console.error=old;}assert.equal(f.attrs.get('selected-state'),'venue');});
test('ready after attribute writes settles instead of feeding a reconnect loop',async()=>{
  const f=fixture();let writes=0;
  f.nav.setAttribute=(name,value)=>{
    assert(++writes<10,'configuration feedback loop');f.attrs.set(name,value);
    f.handlers.get('nl-nav-ready')?.({detail:{configValue:f.attrs.get('config')??null,selectedState:f.attrs.get('selected-state')??null}});
  };
  await setupCustomHeaderNavigation(f.$w,{tabMenu:menu,getCurrentStateId:()=> 'instruments',onChange:async id=>id});
  assert.equal(writes,2);
  for(let i=0;i<5;i++)f.handlers.get('nl-nav-ready')({detail:{configValue:f.attrs.get('config'),selectedState:f.attrs.get('selected-state')}});
  assert.equal(writes,2);
  // A replacement host without attributes must still receive configuration.
  f.attrs.clear();f.handlers.get('nl-nav-ready')({detail:{configValue:null,selectedState:null}});
  assert.equal(writes,4);assert.equal(f.attrs.get('selected-state'),'instruments');
});
