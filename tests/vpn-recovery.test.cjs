const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
function load(file,mocks={}) {
 const exports={};const filename=path.resolve(__dirname,'..',file);
 const code=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 vm.runInNewContext(code,{exports,console:{warn(){}},require:id=>{
  if(id in mocks)return mocks[id];
  if(file.startsWith('vpn/engine/'))return load(path.relative(path.resolve(__dirname,'..'),path.resolve(path.dirname(filename),id+'.ts')));
  return {};
 }},{filename});return exports;
}
const selection=load('vpn/engine/selection.ts');
function fixture({enabled=true,catalog=[],locationError,healthError}={}) {
 let ports;
 const errors = [], connections = [];
 let current = true;
 const active = {name: 'on', proxyEnabled: false, data: {get server() { return server; }}};
 const state = load('vpn/runtime/state.ts',{
  '../engine/state':{ConnectionMachine:class {
   constructor(value) { ports = value; this.lifecycle = {guard: () => () => current}; }
   get() { ports.changed(active); }
   async connect(data, priorName) { connections.push({data, priorName}); }
  }},
  '../engine/selection':selection,
  '../engine/diagnostics':{createConnectionDiagnostics:()=>({})},
  './log/log':{bind:()=>()=>{}},
  './tools/storage':{storage:{getItem:async()=>({value:enabled})}},
  './account/user/getUser':{getUser:async()=>({VPN:{}})},
  './account/user/getUserMaxTier':{getUserMaxTier:()=>0},
  './account/getLocation':{getCountryAndCoordinates:async()=>{if(locationError)throw locationError;return {country:'BR',coordinates:{}};}},
  './vpn/getLogicals':{getSortedLogicals:async()=>catalog,isLogicalUp:item=>item.Status!==0,shouldStayOnLogical:async()=>{if(healthError)throw healthError;return true;}},
  './vpn/Feature':{Feature:{SECURE_CORE:1}},
  './vpn/pickServerInLogical':{pickServerInLogical:item=>item.Servers?.[0]},
  './vpn/assertServerAccess':{assertServerAccess(){}},
  './config':{proxyPort:443,singleProxyPort:true},
  './tools/sentry':{handleError:error=>errors.push(error)},
 });
 return {ports, errors, connections, state, cancel: () => { current = false; }};
}
const candidate=(ID,Score,Features=0,Tier=0)=>({ID,Score,Name:ID,Features,Tier,Status:1,EntryCountry:'BR',ExitCountry:'BR',Servers:[{Domain:ID+'.test',Status:1}]});
const server={id:'old',name:'old',secureCore:false,splitTunneling:{mode:'include',value:['example.org']}};
test('failure recovery uses best eligible alternative, skipping failed, paid and special servers',async()=>{
 const f=fixture({catalog:[candidate('old',0),candidate('paid',0,0,2),candidate('core',0,1),candidate('tor',0,2),{...candidate('down',0),Status:0},candidate('slow',4),candidate('fast',1)]});
 const next=await f.ports.recoverServer(server,()=>true);
 assert.equal(next.id,'fast');assert.equal(next.proxyHost,'fast.test');assert.equal(next.proxyPort,443);
 assert.equal(next.splitTunneling,server.splitTunneling);assert.equal(next.secureCore,false);
});
test('fastest recovery preserves Secure Core and does not downgrade when no matching server exists',async()=>{
 const f=fixture({catalog:[candidate('regular',0),candidate('core',1,1)]});
 assert.equal((await f.ports.recoverServer({...server,secureCore:true},()=>true)).id,'core');
 const none=fixture({catalog:[candidate('regular',0)]});
 assert.equal(await none.ports.recoverServer({...server,secureCore:true},()=>true),undefined);
});
test('disabled preference, cancellation and catalog errors keep current-server fallback',async()=>{
 for(const enabled of [true,false]) {
  const f=fixture({enabled,catalog:[candidate('fast',1)]});
  assert.equal(await f.ports.recoverServer(server,()=>false),undefined);
  if(!enabled)assert.equal(await f.ports.recoverServer(server,()=>true),undefined);
 }
 const f=fixture({locationError:Error('API unavailable')});
 assert.equal(await f.ports.recoverServer(server,()=>true),undefined);assert.equal(f.errors.length,1);
});
test('location and health API errors do not interrupt a working tunnel',async()=>{
 for(const error of [{locationError:Error('location timeout')},{healthError:Error('status timeout')}]) {
  const f=fixture(error);await f.ports.probe(server,()=>true);assert.equal(f.errors.length,1);
 }
});

test('manual fastest recovery selects another eligible server with the preference off', async () => {
 const f = fixture({enabled: false, catalog: [candidate('old', 0), candidate('alternative', 2)]});
 await f.state.requestConnectionRecovery('fastest');
 assert.equal(f.connections.length, 1);
 assert.equal(f.connections[0].data.server.id, 'alternative');
 assert.equal(f.connections[0].data.server.splitTunneling, server.splitTunneling);
 assert.equal(f.connections[0].priorName, 'old');
});

test('manual fastest recovery keeps the current intent when no alternative exists or the action is cancelled', async () => {
 const none = fixture({enabled: false, catalog: [candidate('old', 0)]});
 await assert.rejects(none.state.requestConnectionRecovery('fastest'), /VpnNoRecoveryServer/);
 assert.equal(none.connections.length, 0);

 const cancelled = fixture({enabled: false, catalog: [candidate('alternative', 2)]});
 const operation = cancelled.state.requestConnectionRecovery('fastest');
 cancelled.cancel();
 await operation;
 assert.equal(cancelled.connections.length, 0);
});
