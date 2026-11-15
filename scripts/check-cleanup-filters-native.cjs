// Destructive API validation only in a disposable profile, on two local fixtures.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'super-cleanup-filters-'));
const extension=path.join(temp,'extension');fs.mkdirSync(extension);
for(const name of fs.readdirSync(root))if(['icons','_locales','ui','newtab','sync','vpn'].includes(name)||/\.(js|css|html)$/.test(name)||name==='manifest.json')
  fs.cpSync(path.join(root,name),path.join(extension,name),{recursive:true,filter:file=>!file.split(path.sep).includes('node_modules')});
let context,server;
async function main(){
  const hits={},errors=[];
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jkZkAAAAASUVORK5CYII=','base64');
  server=http.createServer((request,response)=>{
    const host=request.headers.host.split(':')[0],url=new URL(request.url,'http://fixture');
    if(url.pathname==='/asset.png'){
      hits[host]=(hits[host]||0)+1;
      response.writeHead(200,{'Content-Type':'image/png','Cache-Control':'public, max-age=31536000'});response.end(png);
    }else if(url.pathname==='/seed'){
      response.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store','Set-Cookie':'cleanup_probe=present; Path=/; SameSite=Lax'});
      response.end('<!doctype html><title>Disposable cleanup fixture</title><script>localStorage.setItem("cleanup_probe","present")</script><img src="/asset.png">');
    }else{response.writeHead(404,{'Cache-Control':'no-store'});response.end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port,a=`http://alpha.test:${port}`,b=`http://bravo.test:${port}`,domain=`alpha.test:${port}`;
  context=await chromium.launchPersistentContext(path.join(temp,'profile'),{executablePath:process.env.CHROMIUM_PATH,headless:true,
    ignoreDefaultArgs:['--disable-extensions'],args:[`--disable-extensions-except=${extension}`,`--load-extension=${extension}`,
      '--no-proxy-server','--host-resolver-rules=MAP alpha.test 127.0.0.1,MAP bravo.test 127.0.0.1']});
  context.on('weberror',event=>errors.push(event.error().message));
  let worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker');
  const origin=worker.url().replace(/\/background\.js$/,'');await worker.evaluate(()=>SuperModuleHost.ready);
  await worker.evaluate(async domain=>{
    await chrome.storage.local.set({theme:'dark',enabled:false,clearHistory:false,clearDownloads:false,clearFormData:false,
      clearCookies:true,clearCache:true,clearLocalStorage:true,excludedSites:[domain],excludedCacheSites:[domain],excludedLocalStorageSites:[domain],
      'superModules:autoplay':false,'superModules:tabs':false,'superModules:sync':false,'superModules:vpn':false,'superModules:newtab':false});
  },domain);
  const reload=context.waitForEvent('serviceworker');await worker.evaluate(()=>{setTimeout(()=>chrome.runtime.reload(),0);});
  worker=await reload;await worker.evaluate(()=>SuperModuleHost.ready);
  const pages=[await context.newPage(),await context.newPage()];
  async function seed(){await pages[0].goto(a+'/seed');await pages[1].goto(b+'/seed');}
  async function cacheRead(){for(const page of pages)await page.evaluate(async()=>{const r=await fetch('/asset.png',{cache:'force-cache'});if(!r.ok)throw Error('Fixture cache failed');await r.arrayBuffer();});}
  async function data(){return {
    local:await Promise.all(pages.map(page=>page.evaluate(()=>localStorage.getItem('cleanup_probe')))),
    cookies:(await context.cookies([a,b])).filter(cookie=>cookie.name==='cleanup_probe').map(cookie=>cookie.domain).sort(),
  };}
  await seed();const initialHits={...hits};await cacheRead();assert.deepEqual(hits,initialHits,'fixtures must actually be cached');
  const page=await context.newPage();await page.setViewportSize({width:600,height:760});await page.goto(origin+'/popup.html');
  await page.locator('#clearNow').waitFor();
  const editors=[{tab:'exceptions',mode:'listMode',input:'domainInput',form:'domainForm',list:'domainList',key:'includedSites'},
    {tab:'cache',mode:'cacheListMode',input:'cacheDomainInput',form:'cacheDomainForm',list:'cacheDomainList',key:'includedCacheSites'},
    {tab:'local-storage',mode:'localStorageListMode',input:'localStorageDomainInput',form:'localStorageDomainForm',list:'localStorageDomainList',key:'includedLocalStorageSites'}];
  for(const editor of editors){
    await page.locator('#tab-'+editor.tab).click();await page.locator('#'+editor.mode).selectOption('include');
    await page.locator('#'+editor.input).fill(domain);await page.locator('#'+editor.form+' [data-domain-add]').click();
    await page.waitForFunction(async ({key,domain})=>(await chrome.storage.local.get(key))[key]?.includes(domain),{key:editor.key,domain});
  }
  const review=path.join(root,'work/ui-review');fs.mkdirSync(review,{recursive:true});
  await page.screenshot({path:path.join(review,'cleanup-inclusion-dark.png'),animations:'disabled'});
  async function clear(){
    await page.locator('#tab-cleanup').click();await page.locator('#clearNow').click();
    await page.locator('dialog [data-confirm="accept"]').click();
    await page.waitForFunction(()=>document.getElementById('popupStatus').textContent.includes('Limpeza concluída'));
  }
  await clear();
  const included=await data();assert.deepEqual(included.local,[null,'present']);assert.deepEqual(included.cookies,['bravo.test']);
  const beforeIncluded={...hits};await cacheRead();
  assert.equal(hits['alpha.test'],beforeIncluded['alpha.test']+1);assert.equal(hits['bravo.test'],beforeIncluded['bravo.test']);
  console.log('PASS inclusion clears real cookies/localStorage/cache only for the listed origin');
  await seed();
  for(const editor of editors){await page.locator('#tab-'+editor.tab).click();await page.locator('#'+editor.mode).selectOption('exclude');}
  await clear();
  const excluded=await data();assert.deepEqual(excluded.local,['present',null]);assert.deepEqual(excluded.cookies,['alpha.test']);
  const beforeExcluded={...hits};await cacheRead();
  assert.equal(hits['alpha.test'],beforeExcluded['alpha.test']);assert.equal(hits['bravo.test'],beforeExcluded['bravo.test']+1);
  console.log('PASS exclusion preserves real cookies/localStorage/cache for the listed origin');
  await seed();
  for(const editor of editors){
    await page.locator('#tab-'+editor.tab).click();await page.locator('#'+editor.mode).selectOption('include');
    await page.locator('#'+editor.list+' button').click();
    await page.waitForFunction(async key=>(await chrome.storage.local.get(key))[key]?.length===0,editor.key);
  }
  await page.screenshot({path:path.join(review,'cleanup-empty-inclusion-dark.png'),animations:'disabled'});
  const beforeReceipt=await worker.evaluate(()=>chrome.storage.local.get(['lastClearTime','successfulClearCount']));
  await page.locator('#tab-cleanup').click();await page.locator('#clearNow').click();
  await page.waitForFunction(()=>document.getElementById('popupStatus').textContent.includes('Nenhum site para limpar'));
  const result=await page.evaluate(async()=>chrome.runtime.sendMessage({action:'clearNow',settings:await chrome.storage.local.get(null)}));
  assert.equal(result.cleared,false);
  assert.deepEqual(await worker.evaluate(()=>chrome.storage.local.get(['lastClearTime','successfulClearCount'])),beforeReceipt);
  assert.deepEqual((await data()).local,['present','present']);assert.deepEqual((await data()).cookies,['alpha.test','bravo.test']);
  const emptyHits={...hits};await cacheRead();assert.deepEqual(hits,emptyHits);
  const retained=await worker.evaluate(()=>chrome.storage.local.get(['excludedSites','excludedCacheSites','excludedLocalStorageSites']));
  assert.ok(Object.values(retained).every(list=>list.length===1&&list[0]===domain));
  await worker.evaluate(()=>chrome.storage.local.set({includedCacheSites:['keep-inclusion.example']}));
  await page.locator('#tab-cache').click();await page.locator('#cacheListMode').selectOption('exclude');
  await page.locator('#cacheClearExclusions').click();await page.locator('dialog [data-confirm="cancel"]').click();
  assert.deepEqual((await worker.evaluate(()=>chrome.storage.local.get('excludedCacheSites'))).excludedCacheSites,[domain]);
  await page.locator('#cacheClearExclusions').click();
  await page.screenshot({path:path.join(review,'cleanup-clear-exclusions-confirm.png'),animations:'disabled'});
  await page.locator('dialog [data-confirm="accept"]').click();
  await page.waitForFunction(async()=>(await chrome.storage.local.get('excludedCacheSites')).excludedCacheSites?.length===0);
  const clearedList=await worker.evaluate(()=>chrome.storage.local.get(['excludedSites','excludedCacheSites','excludedLocalStorageSites','includedCacheSites']));
  assert.deepEqual(clearedList.excludedCacheSites,[]);assert.deepEqual(clearedList.excludedSites,[domain]);
  assert.deepEqual(clearedList.excludedLocalStorageSites,[domain]);assert.deepEqual(clearedList.includedCacheSites,['keep-inclusion.example']);
  assert.deepEqual((await data()).local,['present','present']);assert.deepEqual((await data()).cookies,['alpha.test','bravo.test']);
  assert.deepEqual(await worker.evaluate(()=>chrome.storage.local.get(['lastClearTime','successfulClearCount'])),beforeReceipt);
  console.log('PASS clear-exclusions button confirms, preserves inclusion/other types and deletes no website data');
  assert.deepEqual(errors,[]);
  console.log('PASS empty inclusion deletes nothing, keeps both lists independent and records no false success');
  console.log('BROWSER',context.browser()?.version());
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{
  await context?.close();if(server)await new Promise(resolve=>server.close(resolve));
  if(path.dirname(temp)===path.resolve(os.tmpdir())&&path.basename(temp).startsWith('super-cleanup-filters-'))fs.rmSync(temp,{recursive:true,force:true});
});
