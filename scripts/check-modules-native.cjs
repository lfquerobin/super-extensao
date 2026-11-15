// Isolated installed-extension validation. No real accounts or external traffic.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'super-modules-native-'));
const extension=path.join(temp,'extension');fs.mkdirSync(extension);
for(const name of fs.readdirSync(root)) if(['icons','_locales','ui','newtab','sync','vpn'].includes(name)||/\.(js|css|html)$/.test(name)||name==='manifest.json')
  fs.cpSync(path.join(root,name),path.join(extension,name),{recursive:true,filter:file=>!file.split(path.sep).includes('node_modules')});
let context;
async function main(){
  const errors=[];
  context=await chromium.launchPersistentContext(path.join(temp,'profile'),{executablePath:process.env.CHROMIUM_PATH,headless:true,
    ignoreDefaultArgs:['--disable-extensions'],args:[`--disable-extensions-except=${extension}`,`--load-extension=${extension}`]});
  context.on('weberror',event=>errors.push(event.error().message));
  await context.route(/^https?:\/\//,route=>route.request().url()==='https://modules-test.invalid/'
    ? route.fulfill({contentType:'text/html',body:'<!doctype html><video autoplay></video>'}) : route.abort());
  let worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker');
  const origin=worker.url().replace(/\/background\.js$/,'');
  await worker.evaluate(()=>SuperModuleHost.ready);
  let page;
  async function settings(){
    if(page&&!page.isClosed())await page.close();
    page=await context.newPage();await page.goto(origin+'/popup.html#modules');
    await page.locator('[data-module="vpn"]:not([disabled])').waitFor();
  }
  async function change(id,value){
    await settings();
    const reload=context.waitForEvent('serviceworker',{timeout:30000});
    await page.locator(`[data-module="${id}"]`).setChecked(value);
    worker=await reload;await worker.evaluate(()=>SuperModuleHost.ready);
    assert.equal(await worker.evaluate(id=>SuperModuleHost.isEnabled(id),id),value);
  }
  await settings();assert.equal(await page.locator('[data-module]').count(),6);
  const review=path.join(root,'work/ui-review');fs.mkdirSync(review,{recursive:true});
  await page.setViewportSize({width:600,height:760});
  assert.equal(await page.locator('.main-nav').evaluate(el=>el.scrollWidth<=el.clientWidth),true);
  await page.screenshot({path:path.join(review,'modules-enabled-dark.png'),animations:'disabled'});
  await worker.evaluate(async()=>{
    await chrome.proxy.settings.set({scope:'regular',value:{mode:'fixed_servers',rules:{singleProxy:{scheme:'http',host:'localhost',port:12345}}}});
    await chrome.privacy.network.webRTCIPHandlingPolicy.set({value:'disable_non_proxied_udp',scope:'regular'});
    await chrome.declarativeNetRequest.updateDynamicRules({addRules:[{id:880001,priority:1,action:{type:'block'},condition:{urlFilter:'||synthetic-block.invalid',resourceTypes:['main_frame']}}]});
  });
  await change('vpn',false);
  const off=await worker.evaluate(async()=>({
    proxy:(await chrome.proxy.settings.get({incognito:false})).levelOfControl,
    privacy:(await chrome.privacy.network.webRTCIPHandlingPolicy.get({})).levelOfControl,
    rules:(await chrome.declarativeNetRequest.getDynamicRules()).filter(rule=>rule.id===880001),
    diagnostics:typeof globalThis.getVpnDiagnostics,
    scripts:(await chrome.scripting.getRegisteredContentScripts()).map(script=>script.id),
  }));
  assert.notEqual(off.proxy,'controlled_by_this_extension');assert.notEqual(off.privacy,'controlled_by_this_extension');
  assert.equal(off.rules.length,0);assert.equal(off.diagnostics,'undefined');assert.ok(off.scripts.every(id=>!id.startsWith('super-vpn')));
  console.log('PASS disabled VPN releases owned proxy/privacy/rules and does not initialize its engine');
  const site=await context.newPage();await site.goto('https://modules-test.invalid/');
  assert.equal(await site.evaluate(()=>HTMLMediaElement.prototype.play.toString().includes('[native code]')),false);
  await change('autoplay',false);
  assert.equal(await site.evaluate(()=>HTMLMediaElement.prototype.play.toString().includes('[native code]')),true);
  await site.close();
  for(const id of ['cleanup','tabs','sync','newtab'])await change(id,false);
  await settings();
  assert.equal(await page.locator('.main-nav button:visible').count(),1);
  assert.equal(await page.locator('[data-module]:checked').count(),0);
  await page.setViewportSize({width:600,height:760});
  await page.screenshot({path:path.join(root,'work/ui-review/modules-disabled-dark.png'),animations:'disabled'});
  const state=await worker.evaluate(async()=>({
    modules:await SuperModules.read(),alarms:(await chrome.alarms.getAll()).map(alarm=>alarm.name),
    scripts:await chrome.scripting.getRegisteredContentScripts(),
  }));
  assert.ok(Object.values(state.modules).every(value=>value===false));assert.equal(state.scripts.length,0);
  assert.ok(!state.alarms.some(name=>/^(superVpn:|super-sync:|pause-resume$)/.test(name)));
  const replies=await page.evaluate(async()=>({
    cleanup:await chrome.runtime.sendMessage({action:'clearNow',settings:{clearHistory:true,excludedSites:[]}}),
    sync:await chrome.runtime.sendMessage({channel:'super-sync',type:'getUnlocked',params:[]}),
  }));
  assert.equal(replies.cleanup.error,'ModuleDisabled');assert.equal(replies.sync.error,'ModuleDisabled');
  const profile={type:'git',label:'Synthetic retained profile',url:'https://example.invalid/repo.git',username:'synthetic-user',password:'synthetic-password',localRoot:'1',enabled:false};
  await worker.evaluate(async profile=>chrome.storage.local.set({'superSync:accounts':JSON.stringify({saved:profile}),'superSync:oauthClients':{googleClientId:'synthetic-client',googleClientSecret:'synthetic-secret'}}),profile);
  const blank=await context.newPage(),assets=[];
  blank.on('request',request=>assets.push(request.url()));await blank.goto(origin+'/newtab/index.html');
  await blank.locator('#super-settings').waitFor();
  await blank.waitForFunction(()=>document.querySelector('#root').style.minHeight==='100vh');
  assert.equal(await blank.locator('.Dashboard').count(),0);assert.ok(!assets.some(url=>/\/(main\.js|polyfills\.js|main\.css)$/.test(url)));
  await blank.close();console.log('PASS all six modules off; no feature alarms/content scripts/dashboard bundle');
  await change('sync',true);
  await settings();
  const retained=await page.evaluate(async()=>({data:await chrome.storage.local.get(['superSync:accounts','superSync:oauthClients']),
    sync:await chrome.runtime.sendMessage({channel:'super-sync',type:'getUnlocked',params:[]})}));
  assert.equal(retained.sync.params[0],true);assert.deepEqual(JSON.parse(retained.data['superSync:accounts']).saved,profile);
  assert.equal(retained.data['superSync:oauthClients'].googleClientSecret,'synthetic-secret');
  await change('vpn',true);assert.equal(await worker.evaluate(()=>typeof globalThis.getVpnDiagnostics),'function');
  await settings();assert.equal(await page.locator('[data-module="sync"]').isChecked(),true);
  assert.equal(await page.locator('[data-module="vpn"]').isChecked(),true);
  assert.deepEqual(errors,[]);
  console.log('PASS reactivation restores engines without deleting saved profile/OAuth credentials');
  console.log('BROWSER',context.browser()?.version());
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{
  await context?.close();
  if(path.dirname(temp)===path.resolve(os.tmpdir())&&path.basename(temp).startsWith('super-modules-native-'))fs.rmSync(temp,{recursive:true,force:true});
});
