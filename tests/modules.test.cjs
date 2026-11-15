const {test} = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const {JSDOM} = require('jsdom');
const modules = require('../modules.js');
const root = path.resolve(__dirname,'..');
const tick = () => new Promise(resolve => setImmediate(resolve));
const plain = value => JSON.parse(JSON.stringify(value));
function worker(initial = {}, options = {}) {
  const state = {...initial}, session = {}, calls = [], events = [], timers = [], wake = {};
  let scripts = [], dynamic = [], rules = [], controlled = options.controlled || false;
  const chrome = {
    runtime:{id:'test',getURL: p => 'chrome-extension://test/'+p,onMessage:{addListener: fn => events.push(fn)},
      onMessageExternal:{addListener:fn=>{wake.external=fn;}},onStartup:{addListener:fn=>{wake.startup=fn;}},reload:()=>calls.push('reload')},
    storage:{local:{get:async defaults => {if(options.readFail) throw Error('storage');return {...defaults,...state};},
      set:async values => {if(options.writeFail) throw Error('storage');Object.assign(state,values);calls.push('write');}},
      session:{get:async defaults=>({...defaults,...session}),set:async values=>Object.assign(session,values)}},
    alarms:{onAlarm:{addListener:fn=>{wake.alarm=fn;}},create:async name=>calls.push('restore:'+name),getAll:async()=>[{name:'superVpn:recovery'},{name:'super-sync:checkSync'},{name:'pause-resume'},{name:'unrelated'}],clear:async name=>calls.push('alarm:'+name)},
    bookmarks:{onCreated:{addListener:fn=>{wake.bookmark=fn;}}},
    webRequest:{onAuthRequired:{addListener:fn=>{wake.auth=fn;}}},
    action:{setBadgeText:async()=>{}},
    proxy:{settings:{get:async()=>({levelOfControl:controlled?'controlled_by_this_extension':'controllable_by_this_extension'}),clear:async()=>{calls.push('proxy-clear');if(!options.releaseFail)controlled=false;}}},
    privacy:{network:{webRTCIPHandlingPolicy:{get:async()=>({levelOfControl:'controllable_by_this_extension'}),clear:async()=>{}}}},
    declarativeNetRequest:{getDynamicRules:async()=>dynamic,getSessionRules:async()=>rules,
      updateDynamicRules:async change=>{dynamic=dynamic.filter(rule=>!change.removeRuleIds.includes(rule.id));},
      updateSessionRules:async change=>{rules=rules.filter(rule=>!change.removeRuleIds.includes(rule.id));}},
    tabs:{query:async()=>[],remove:async()=>{},update:async()=>{}},
    scripting:{getRegisteredContentScripts:async()=>scripts,
      unregisterContentScripts:async ({ids})=>{scripts=scripts.filter(script=>!ids.includes(script.id));},
      registerContentScripts:async list=>{scripts.push(...plain(list));},executeScript:async()=>{}},
  };
  const context = vm.createContext({chrome,console,URL,setTimeout:fn=>{timers.push(fn);return timers.length;},navigator:{userAgent:'Chrome/157.0'}});
  for (const file of ['modules.js','module-host.js']) vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
  const host = context.SuperModuleHost;
  const message = async (data,sender={id:'test',url:'chrome-extension://test/popup.html'}) => {
    return new Promise(resolve => {
      const accepted = events[0](data,sender,response=>resolve(response));
      if (!accepted) resolve(undefined);
    });
  };
  return {host,context,chrome,state,session,calls,timers,wake,message,options,get scripts(){return scripts;},
    setRules: value=>{dynamic=value;},get dynamic(){return dynamic;}};
}

test('module defaults preserve all six features and invalid stored flags fail closed',async()=>{
  assert.deepEqual(modules.normalize({}),Object.fromEntries(modules.ids.map(id=>[id,true])));
  assert.equal(modules.normalize({'superModules:vpn':false}).vpn,false);
  assert.equal(modules.normalize({'superModules:vpn':'true'}).vpn,false);
});

test('legacy document bundle entries respect the module flag when opened directly',async()=>{
  const temp=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'super-module-wrapper-'));
  try {
    const file=path.join(temp,'bundle.js');fs.writeFileSync(file,'globalThis.started = true;');
    require('../scripts/module-bundle.cjs').wrapModule(file,'vpn');
    const source=fs.readFileSync(file,'utf8');
    for(const enabled of [false,true]) {
      const context=vm.createContext({document:{},chrome:{storage:{local:{get:async()=>({'superModules:vpn':enabled})}}}});
      vm.runInContext(source,context);await tick();assert.equal(context.started===true,enabled);
    }
  } finally {fs.rmSync(temp,{recursive:true,force:true});}
});

test('disabled module factories never initialize; cold worker requests wait for registration',async()=>{
  const w = worker({'superModules:vpn':false});let vpn = 0, sync = 0;
  w.host.register('vpn',()=>vpn++);
  w.host.register('sync',()=>{sync++;w.host.message('sync',(_data,_sender,reply)=>reply({ready:true}));});
  const response = await w.message({channel:'super-sync',type:'getUnlocked',params:[]});
  assert.deepEqual(plain(response),{ready:true});assert.equal(vpn,0);assert.equal(sync,1);
  const off = await w.message({channel:'super-vpn',type:'connectionState'});
  assert.equal(off.result.error.message,'ModuleDisabled');
  assert.ok(w.scripts.every(script=>script.id.startsWith('super-autoplay')));
});

test('all modules can be off without initializing any engine or registering content scripts',async()=>{
  const initial = Object.fromEntries(modules.ids.map(id=>[modules.key(id),false]));const w=worker(initial);let starts=0;
  for(const id of modules.ids)w.host.register(id,()=>starts++);
  await w.host.ready;assert.equal(starts,0);assert.deepEqual(w.scripts,[]);
  assert.ok(w.calls.includes('alarm:superVpn:recovery'));assert.ok(w.calls.includes('alarm:super-sync:checkSync'));
  assert.ok(!w.calls.includes('alarm:unrelated'));
});

test('disabling VPN releases owned controls and rules before persisting and reloading',async()=>{
  const w=worker({'superVpn:account':'preserved','superSync:accounts':'preserved'}, {controlled:true});
  await w.host.ready;w.setRules([{id:880001},{id:881001},{id:7}]);let stopped=false;
  w.host.onStop('vpn',async next=>{assert.equal(next,false);stopped=true;});
  const response=await w.message({action:'modules:set',id:'vpn',value:false});
  assert.equal(response.ok,true);assert.equal(stopped,true);assert.equal(w.state['superModules:vpn'],false);
  assert.ok(w.calls.indexOf('proxy-clear')<w.calls.indexOf('write'));
  assert.deepEqual(w.dynamic,[{id:7}]);assert.ok(w.scripts.every(script=>!script.id.startsWith('super-vpn')));
  assert.equal(w.state['superVpn:account'],'preserved');assert.equal(w.state['superSync:accounts'],'preserved');
  assert.ok(!w.calls.includes('reload'));w.timers[0]();assert.ok(w.calls.includes('reload'));
});

test('failed VPN release never marks the module disabled or reloads the extension',async()=>{
  const w=worker({}, {controlled:true,releaseFail:true});await w.host.ready;
  const response=await w.message({action:'modules:set',id:'vpn',value:false});
  assert.equal(response.ok,false);assert.equal(response.error,'ModuleVpnReleaseFailed');
  assert.equal(w.state['superModules:vpn'],undefined);assert.equal(w.host.isEnabled('vpn'),true);assert.equal(w.timers.length,0);
});

test('module changes refuse to interrupt sync and roll back prepared module state',async()=>{
  const w=worker();await w.host.ready;let rolled=false;
  w.host.onStop('cleanup',async()=>()=>{rolled=true;assert.equal(w.host.isEnabled('cleanup'),true);});
  w.host.onStop('sync',async()=>{throw Error('ModuleSyncBusy');});
  const response=await w.message({action:'modules:set',id:'autoplay',value:false});
  assert.equal(response.error,'ModuleSyncBusy');assert.equal(rolled,true);
  assert.equal(w.host.isEnabled('autoplay'),true);assert.equal(w.state['superModules:autoplay'],undefined);
});

test('a disabled module can be enabled without changing its saved settings',async()=>{
  const w=worker({'superModules:sync':false,'superSync:accounts':'original'});await w.host.ready;
  const response=await w.message({action:'modules:set',id:'sync',value:true});
  assert.equal(response.ok,true);assert.equal(w.state['superModules:sync'],true);assert.equal(w.state['superSync:accounts'],'original');
});

test('module settings reject foreign senders and malformed values',async()=>{
  const w=worker();await w.host.ready;
  assert.equal(await w.message({action:'modules:set',id:'vpn',value:false},{id:'test',url:'https://account.proton.me/'}),undefined);
  assert.equal((await w.message({action:'modules:set',id:'vpn',value:'false'})).error,'ModuleInvalidSetting');
  assert.equal((await w.message({action:'modules:set',id:'unknown',value:false})).error,'ModuleInvalidSetting');
  assert.equal(w.calls.filter(call=>call==='write').length,0);
});

test('storage read failure starts no module and provides no editable status',async()=>{
  const w=worker({}, {readFail:true});let starts=0;w.host.register('vpn',()=>starts++);
  await assert.rejects(w.host.ready);assert.equal(starts,0);
  assert.equal((await w.message({action:'modules:status'})).ok,false);
});

test('first bookmark and alarm events on a cold worker wait for engine attachment',async()=>{
  const w=worker(),received=[];
  w.wake.bookmark('7',{title:'first edit'});w.wake.alarm({name:'super-sync:checkSync'});
  w.host.register('sync',()=>{
    w.host.event('sync','bookmarks.onCreated',(id)=>received.push('bookmark:'+id));
    w.host.event('sync','alarms.onAlarm',alarm=>received.push(alarm.name));
  });
  await w.host.ready;await tick();
  assert.deepEqual(received,['bookmark:7','super-sync:checkSync']);
});

test('cold proxy challenges and valid account forks wait for their VPN handlers',async()=>{
  const w=worker();
  const authentication=new Promise(resolve=>w.wake.auth({isProxy:true},resolve));
  const fork=new Promise(resolve=>assert.equal(w.wake.external({type:'fork'},{url:'https://account.proton.me/authorize'},resolve),true));
  w.host.register('vpn',()=>{
    w.host.auth((_details,reply)=>reply({cancel:true}));
    w.host.external(async message=>({type:'handled',original:message.type}));
  });
  assert.deepEqual(plain(await authentication),{cancel:true});
  assert.deepEqual(plain(await fork),{type:'handled',original:'fork'});
  assert.equal(w.wake.external({type:'fork'},{url:'https://account.proton.me.evil.test/'},()=>assert.fail()),undefined);
});

test('disabled VPN does not intercept website/proxy credentials or consume login forks',async()=>{
  const w=worker({'superModules:vpn':false});
  const reply=await new Promise(resolve=>w.wake.auth({isProxy:false},resolve));
  assert.deepEqual(plain(reply),{});
  const fork=await new Promise(resolve=>w.wake.external({type:'fork'},{url:'https://account.proton.me/'},resolve));
  assert.equal(fork.payload.message,'ModuleDisabled');
});

test('failed persistence restores existing alarms and content registration without claiming success',async()=>{
  const w=worker({}, {writeFail:true});await w.host.ready;
  const response=await w.message({action:'modules:set',id:'sync',value:false});
  assert.equal(response.ok,false);assert.equal(w.state['superModules:sync'],undefined);
  assert.equal(w.host.isEnabled('sync'),true);assert.ok(w.calls.includes('restore:super-sync:checkSync'));
  assert.equal(w.scripts.length,4);assert.equal(w.timers.length,0);
});

test('disabled new tab loads neither the dashboard nor provider integrations',async()=>{
  const dom=new JSDOM('<div id="root"></div><button id="super-settings">Settings</button>',{url:'https://extension.test/newtab/index.html',runScripts:'outside-only'});
  try {
    const w=dom.window;let theme=0;
    w.chrome={runtime:{openOptionsPage(){}},storage:{onChanged:{addListener(){}}}};
    w.SuperModules={read:async()=>({newtab:false}),key:modules.key};w.SuperPreferences={bindTheme(){theme++;}};
    w.eval(fs.readFileSync(path.join(root,'newtab/loader.js'),'utf8'));await tick();
    assert.equal(w.document.querySelectorAll('script').length,0);assert.equal(theme,1);
    assert.equal(w.document.querySelector('link[href="main.css"]'),null);
  } finally {dom.window.close();}
});
