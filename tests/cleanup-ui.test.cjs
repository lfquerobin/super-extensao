const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..');
const tick=()=>new Promise(resolve=>setTimeout(resolve,30));
async function fixture(initial={},options={}) {
  const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
  const dom=new JSDOM(fs.readFileSync(path.join(root,'popup.html'),'utf8'),{url:'https://extension.test/popup.html',runScripts:'outside-only',virtualConsole:vc});
  const w=dom.window,local={excludedSites:['cookie.example'],...initial},sync={'tabliss/config/locale':'pt-BR'},listeners=[];
  const area=(state,name)=>({
    async get(keys) {const result=Array.isArray(keys)?Object.fromEntries(keys.filter(k=>k in state).map(k=>[k,state[k]])):{...keys,...Object.fromEntries(Object.keys(keys||state).filter(k=>k in state).map(k=>[k,state[k]]))};await options.get?.(keys,name);return result;},
    async set(values) {await options.set?.(values,name);values=JSON.parse(JSON.stringify(values));const changes={};for(const [k,v] of Object.entries(values)){changes[k]={newValue:v,oldValue:state[k]};state[k]=v;}for(const fn of listeners)fn(changes,name);}
  });
  const requests=[];
  w.chrome={storage:{local:area(local,'local'),sync:area(sync,'sync'),onChanged:{addListener:fn=>listeners.push(fn),removeListener:()=>{}}},
    runtime:{sendMessage:async payload=>{requests.push(payload);return {ok:true,cleared:true};}},
    permissions:{request:async()=>true},bookmarks:{getTree:async()=>[{id:'0',title:'',children:[{id:'1',title:'Sites',children:[{url:'https://cookie.example/path'},{url:'https://new.example'}]}]}]}};
  w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});w.confirm=()=>true;
  for(const file of ['ui.js','preferences.js','i18n.js','rules.js','ui/bookmark-preview.js','ui/domain-list.js','ui/async-state.js','ui/confirmation.js','ui/domain-editor.js','ui/bookmark-importer.js','popup.js'])w.eval(fs.readFileSync(path.join(root,file),'utf8'));
  const style=w.document.createElement('style');style.textContent=fs.readFileSync(path.join(root,'popup.css'),'utf8').replace(/@import[^;]+;/g,'');w.document.head.append(style);
  await tick();
  return {w,d:w.document,local,requests,errors,close:()=>w.close()};
}
async function add(f,prefix,value) {f.d.getElementById(prefix+'DomainInput').value=value;f.d.getElementById(prefix+'DomainForm').dispatchEvent(new f.w.Event('submit',{bubbles:true,cancelable:true}));await tick();}
test('novas abas salvam e removem exceções isoladamente, com ações de limpeza só na primeira aba',async()=>{
  const f=await fixture();try{
    assert.deepEqual(f.errors,[]);
    for(const [tab,prefix,key] of [['cache','cache','excludedCacheSites'],['local-storage','localStorage','excludedLocalStorageSites']]) {
      f.d.getElementById('tab-'+tab).click();
      assert.equal(f.d.getElementById('panel-'+tab).hidden,false);
      assert.equal(f.d.getElementById('cleanupActions').hidden,true);
      assert.equal(f.w.getComputedStyle(f.d.getElementById('cleanupFooter')).display,'none');
      assert.equal(f.w.getComputedStyle(f.d.getElementById('cleanupActions')).display,'none');
      await add(f,prefix,'https://keep.example/path');assert.deepEqual(f.local[key],['keep.example']);
      assert.deepEqual(f.local.excludedSites,['cookie.example']);
      assert.equal(f.d.getElementById(prefix+'ListCount').textContent,'1 domínio');
    }
    f.d.querySelector('#cacheDomainList button').click();await tick();
    assert.deepEqual(f.local.excludedCacheSites,[]);assert.deepEqual(f.local.excludedLocalStorageSites,['keep.example']);
    f.d.getElementById('tab-cleanup').click();assert.equal(f.d.getElementById('cleanupActions').hidden,false);
    assert.notEqual(f.w.getComputedStyle(f.d.getElementById('cleanupFooter')).display,'none');
    for(const tab of ['exceptions','bookmarks','autoplay','tabs','sync','vpn']){f.d.getElementById('tab-'+tab).click();assert.equal(f.d.getElementById('cleanupActions').hidden,true);
      assert.equal(f.w.getComputedStyle(f.d.getElementById('cleanupFooter')).display,'none');}
    assert.equal(f.d.getElementById('error').hidden,true);
  }finally{f.close();}
});
test('importação de favoritos pré-seleciona o destino da aba e calcula duplicados por lista',async()=>{
  const f=await fixture();try{
    f.d.getElementById('cacheGoImport').click();await tick();assert.equal(f.d.getElementById('importTarget').value,'cache');
    f.d.getElementById('loadFolders').click();await tick();assert.match(f.d.getElementById('previewCount').textContent,/2/);
    f.d.getElementById('importBookmarks').click();await tick();
    assert.deepEqual(f.local.excludedCacheSites,['cookie.example','new.example']);assert.deepEqual(f.local.excludedSites,['cookie.example']);
    assert.match(f.d.getElementById('popupStatus').textContent,/importados/i);
    f.d.getElementById('tab-cache').click();
    assert.equal(f.d.getElementById('popupStatus').textContent,'');
    f.d.getElementById('tab-bookmarks').click();
    f.d.getElementById('importTarget').value='cookies';f.d.getElementById('importTarget').dispatchEvent(new f.w.Event('change'));await tick();
    assert.match(f.d.getElementById('previewCount').textContent,/1/);
    f.d.getElementById('localStorageGoImport').click();await tick();f.d.getElementById('importBookmarks').click();await tick();
    assert.deepEqual(f.local.excludedLocalStorageSites,['cookie.example','new.example']);assert.deepEqual(f.local.excludedSites,['cookie.example']);
    assert.equal(f.d.getElementById('error').hidden,true);
  }finally{f.close();}
});
test('nova aba é restaurada e traduções não descartam rascunhos nem listas',async()=>{
  const f=await fixture({popupView:{tab:'local-storage',lastCleanupTab:'local-storage'}});try{
    assert.equal(f.d.getElementById('panel-local-storage').hidden,false);
    f.d.getElementById('localStorageDomainInput').value='draft.example';
    await f.w.SuperPreferences.locale.set('en');await tick();
    assert.equal(f.d.getElementById('tab-local-storage').textContent,'Local stor.');
    assert.equal(f.d.getElementById('tab-cleanup').textContent,'General');
    assert.equal(f.d.querySelector('#panel-cache h2').textContent,'Cache by website');
    assert.equal(f.d.getElementById('localStorageDomainInput').value,'draft.example');
    f.d.getElementById('tab-autoplay').click();f.d.getElementById('section-cleanup').click();
    assert.equal(f.d.getElementById('panel-local-storage').hidden,false);
    assert.deepEqual(f.errors,[]);
  }finally{f.close();}
});

async function select(f,id,value) {
  f.d.getElementById(id).value=value;
  f.d.getElementById(id).dispatchEvent(new f.w.Event('change',{bubbles:true}));await tick();
}
test('cada tipo mantém inclusão e exclusão separadas, com gravação automática e sem ativar a limpeza',async()=>{
  const f=await fixture({clearCookies:false,clearCache:false,clearLocalStorage:false});try{
    for(const [prefix,modeKey,includeKey,excludeKey] of [['','cookieCleanupMode','includedSites','excludedSites'],
      ['cache','cacheCleanupMode','includedCacheSites','excludedCacheSites'],['localStorage','localStorageCleanupMode','includedLocalStorageSites','excludedLocalStorageSites']]) {
      const id=name=>prefix?prefix+name[0].toUpperCase()+name.slice(1):name;
      const original=f.local[excludeKey];
      await select(f,id('listMode'),'include');assert.equal(f.local[modeKey],'include');
      assert.match(f.d.getElementById(id('listModeHelp')).textContent,/inclusão vazia/);
      f.d.getElementById(id('domainInput')).value='only.example';
      f.d.getElementById(id('domainForm')).dispatchEvent(new f.w.Event('submit',{bubbles:true,cancelable:true}));await tick();
      assert.deepEqual(f.local[includeKey],['only.example']);assert.deepEqual(f.local[excludeKey],original);
      await select(f,id('listMode'),'exclude');
      assert.equal(f.d.getElementById(id('domainList')).textContent.includes('only.example'),false);
      await select(f,id('listMode'),'include');f.d.querySelector('#'+id('domainList')+' button').click();await tick();
      assert.deepEqual(f.local[includeKey],[]);assert.deepEqual(f.local[excludeKey],original);
    }
    assert.equal(f.local.clearCookies,false);assert.equal(f.local.clearCache,false);assert.equal(f.local.clearLocalStorage,false);
    assert.equal(f.d.getElementById('error').hidden,true);assert.deepEqual(f.errors,[]);
  }finally{f.close();}
});

test('importação respeita tipo e modo e ignora duplicados somente na lista escolhida',async()=>{
  const f=await fixture({cacheCleanupMode:'include',includedCacheSites:['new.example'],excludedCacheSites:['exclude.example']});try{
    f.d.getElementById('cacheGoImport').click();await tick();assert.equal(f.d.getElementById('importMode').value,'include');
    f.d.getElementById('loadFolders').click();await tick();
    assert.match(f.d.getElementById('previewCount').textContent,/1/);
    f.d.getElementById('importBookmarks').click();await tick();
    assert.deepEqual(f.local.includedCacheSites,['cookie.example','new.example']);assert.deepEqual(f.local.excludedCacheSites,['exclude.example']);
    await select(f,'importMode','exclude');assert.equal(f.local.cacheCleanupMode,'exclude');assert.equal(f.d.getElementById('cacheListMode').value,'exclude');
    f.d.getElementById('importBookmarks').click();await tick();
    assert.deepEqual(f.local.excludedCacheSites,['cookie.example','exclude.example','new.example']);
    assert.deepEqual(f.local.includedCacheSites,['cookie.example','new.example']);assert.deepEqual(f.local.excludedSites,['cookie.example']);
    assert.deepEqual(f.errors,[]);
  }finally{f.close();}
});

test('inclusão vazia mostra aviso e não envia limpeza manual quando não há alvos',async()=>{
  const f=await fixture({clearHistory:false,clearCache:true,cacheCleanupMode:'include'});try{
    f.d.getElementById('clearNow').click();await tick();
    assert.ok(!f.requests.some(request=>request.action==='clearNow'));
    assert.match(f.d.getElementById('popupStatus').textContent,/Nenhum site para limpar/);
    assert.equal(f.d.getElementById('error').hidden,true);
  }finally{f.close();}
});

test('falha ao trocar o modo mantém as listas e o modo efetivamente salvo',async()=>{
  let fail=true;
  const f=await fixture({}, {set:async values=>{if(fail&&'cookieCleanupMode' in values)throw Error('simulated storage failure');}});try{
    f.d.getElementById('tab-exceptions').click();
    await select(f,'listMode','include');
    assert.equal(f.local.cookieCleanupMode,undefined);assert.equal(f.d.getElementById('listMode').value,'exclude');
    assert.deepEqual(f.local.excludedSites,['cookie.example']);assert.equal(f.d.getElementById('filterEditor').disabled,false);
    assert.equal(f.d.getElementById('error').hidden,false);
    f.d.getElementById('tab-cleanup').click();
    assert.equal(f.d.getElementById('error').hidden,true);
    f.d.getElementById('tab-exceptions').click();
    fail=false;await select(f,'listMode','include');assert.equal(f.local.cookieCleanupMode,'include');
    assert.deepEqual(f.local.excludedSites,['cookie.example']);assert.deepEqual(f.errors,[]);
  }finally{f.close();}
});

test('falha de leitura após trocar o modo bloqueia a lista antiga até carregar o destino correto',async()=>{
  let failReads=false;
  const f=await fixture({excludedCacheSites:['keep.example'],includedCacheSites:['target.example']},{
    set:async values=>{if(values.cacheCleanupMode==='include')failReads=true;},
    get:async keys=>{if(failReads&&keys?.cacheCleanupMode)throw Error('read failed');}
  });try{
    await select(f,'cacheListMode','include');
    assert.equal(f.local.cacheCleanupMode,'include');assert.equal(f.d.getElementById('cacheFilterEditor').disabled,true);
    assert.equal(f.d.getElementById('cacheFilterRetry').hidden,false);
    f.d.querySelector('#cacheDomainList button').click();await tick();assert.deepEqual(f.local.excludedCacheSites,['keep.example']);
    failReads=false;f.d.getElementById('cacheFilterRetry').click();await tick();
    assert.equal(f.d.getElementById('cacheFilterEditor').disabled,false);assert.equal(f.d.getElementById('cacheFilterRetry').hidden,true);
    assert.match(f.d.getElementById('cacheDomainList').textContent,/target.example/);
    assert.doesNotMatch(f.d.getElementById('cacheDomainList').textContent,/keep.example/);
    assert.equal(f.d.getElementById('error').hidden,true);assert.deepEqual(f.errors,[]);
  }finally{f.close();}
});

test('uma leitura antiga não substitui o modo mais recente',async()=>{
  let armed=false,release;
  const f=await fixture({excludedCacheSites:['old.example'],includedCacheSites:['latest.example']}, {get:async keys=>{
    if(armed&&keys?.cacheCleanupMode){armed=false;await new Promise(resolve=>{release=resolve;});}
  }});try{
    armed=true;await f.w.chrome.storage.local.set({excludedCacheSites:['old-updated.example']});await tick();
    await f.w.chrome.storage.local.set({cacheCleanupMode:'include'});await tick();
    assert.equal(f.d.getElementById('cacheListMode').value,'include');
    release();await tick();
    assert.equal(f.d.getElementById('cacheListMode').value,'include');
    assert.match(f.d.getElementById('cacheDomainList').textContent,/latest.example/);
    assert.doesNotMatch(f.d.getElementById('cacheDomainList').textContent,/old.example/);
  }finally{f.close();}
});

test('trocar o modo durante uma importação pendente não escreve na lista anterior ou na nova',async()=>{
  let armed=false,release;
  const f=await fixture({}, {get:async keys=>{
    if(armed&&Object.keys(keys||{}).length===1&&Array.isArray(keys.excludedCacheSites)) {armed=false;await new Promise(resolve=>{release=resolve;});}
  }});try{
    f.d.getElementById('cacheGoImport').click();await tick();f.d.getElementById('loadFolders').click();await tick();
    armed=true;f.d.getElementById('importBookmarks').click();await tick();
    await select(f,'importMode','include');release();await tick();
    assert.equal(f.local.excludedCacheSites,undefined);assert.equal(f.local.includedCacheSites,undefined);
    f.d.getElementById('importBookmarks').click();await tick();
    assert.deepEqual(f.local.includedCacheSites,['cookie.example','new.example']);assert.equal(f.local.excludedCacheSites,undefined);
    assert.deepEqual(f.errors,[]);
  }finally{f.close();}
});

test('limpar exclusões pede confirmação e altera somente a lista do tipo escolhido',async()=>{
  const f=await fixture({excludedSites:['cookies.example'],excludedCacheSites:['cache.example'],excludedLocalStorageSites:['local.example'],
    includedSites:['include.example'],includedCacheSites:['include-cache.example'],includedLocalStorageSites:['include-local.example'],clearCookies:true});try{
    for(const [button,key,modeKey] of [['clearExclusions','excludedSites','cookieCleanupMode'],['cacheClearExclusions','excludedCacheSites','cacheCleanupMode'],['localStorageClearExclusions','excludedLocalStorageSites','localStorageCleanupMode']]){
      const before=structuredClone(f.local);
      f.d.getElementById(button).click();await tick();assert.ok(f.d.querySelector('dialog[open]'));
      assert.match(f.d.querySelector('dialog').textContent,/próximas limpezas/);
      assert.deepEqual(f.local,before);
      f.d.querySelector('[data-confirm="accept"]').click();await tick();
      assert.deepEqual(f.local[key],[]);assert.equal(f.d.getElementById(button).disabled,true);
      for(const other of Object.keys(before).filter(name=>name!==key))assert.deepEqual(f.local[other],before[other]);
      assert.equal(f.local[modeKey],before[modeKey]);
    }
    assert.equal(f.requests.filter(request=>request.action==='clearNow').length,0);assert.deepEqual(f.errors,[]);
  }finally{f.close();}
});

test('cancelar ou trocar para inclusão durante a confirmação preserva a lista de exclusão',async()=>{
  const f=await fixture({includedSites:['include.example']});try{
    f.d.getElementById('tab-exceptions').click();
    f.d.getElementById('clearExclusions').click();await tick();
    f.d.querySelector('[data-confirm="cancel"]').click();await tick();assert.deepEqual(f.local.excludedSites,['cookie.example']);
    f.d.getElementById('clearExclusions').click();await tick();
    await f.w.chrome.storage.local.set({cookieCleanupMode:'include'});await tick();
    f.d.querySelector('[data-confirm="accept"]').click();await tick();
    assert.deepEqual(f.local.excludedSites,['cookie.example']);assert.deepEqual(f.local.includedSites,['include.example']);
    assert.equal(f.d.getElementById('clearExclusions').hidden,true);assert.match(f.d.getElementById('popupStatus').textContent,/mudou/);
  }finally{f.close();}
});

test('novos sites adicionados durante a confirmação não são apagados sem revisão',async()=>{
  const f=await fixture();try{
    f.d.getElementById('tab-exceptions').click();
    f.d.getElementById('clearExclusions').click();await tick();
    await f.w.chrome.storage.local.set({excludedSites:['cookie.example','new.example']});await tick();
    f.d.querySelector('[data-confirm="accept"]').click();await tick();
    assert.deepEqual(f.local.excludedSites,['cookie.example','new.example']);assert.match(f.d.getElementById('popupStatus').textContent,/mudou/);
    assert.equal(f.d.getElementById('clearExclusions').disabled,false);
  }finally{f.close();}
});

test('falha ao limpar exclusões mantém os sites e permite nova tentativa',async()=>{
  let fail=true;
  const f=await fixture({}, {set:async values=>{if(fail&&values.excludedSites?.length===0)throw Error('write failed');}});try{
    f.d.getElementById('tab-exceptions').click();
    f.d.getElementById('clearExclusions').click();await tick();f.d.querySelector('[data-confirm="accept"]').click();await tick();
    assert.deepEqual(f.local.excludedSites,['cookie.example']);assert.equal(f.d.getElementById('error').hidden,false);
    assert.equal(f.d.getElementById('clearExclusions').disabled,false);
    fail=false;f.d.getElementById('clearExclusions').click();await tick();f.d.querySelector('[data-confirm="accept"]').click();await tick();
    assert.deepEqual(f.local.excludedSites,[]);assert.equal(f.d.getElementById('error').hidden,true);assert.deepEqual(f.errors,[]);
  }finally{f.close();}
});

test('Limpar agora mostra a prévia e só envia o plano depois da confirmação', async () => {
  const f = await fixture({clearCookies: true});
  try {
    f.d.getElementById('clearNow').click();
    await tick();
    const dialog = f.d.querySelector('dialog[open]');
    assert.match(dialog.textContent, /Revisar limpeza/);
    assert.match(dialog.textContent, /https:\/\/cookie\.example/);
    assert.equal(f.requests.length, 0);
    dialog.querySelector('[data-confirm="accept"]').click();
    await tick();
    const request = f.requests.find(item => item.action === 'clearNow');
    assert.match(request.expectedPlan, /cookie\.example/);
    assert.deepEqual(f.errors, []);
  } finally { f.close(); }
});

test('aviso de exclusões fica na aba de origem quando a gravação termina após navegar', async () => {
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  const f = await fixture({}, {set: async values => {
    if (values.excludedCacheSites) await pending;
  }});
  try {
    f.d.getElementById('tab-cache').click();
    await add(f, 'cache', 'keep.example');
    f.d.getElementById('tab-cleanup').click();
    release();
    await tick();
    assert.deepEqual(f.local.excludedCacheSites, ['keep.example']);
    assert.equal(f.d.getElementById('popupStatus').textContent, '');
    f.d.getElementById('tab-cache').click();
    assert.match(f.d.getElementById('popupStatus').textContent, /Domínio adicionado à lista/);
    f.d.getElementById('tab-exceptions').click();
    assert.equal(f.d.getElementById('popupStatus').textContent, '');
  } finally { release(); f.close(); }
});

test('a aba Geral mostra a limpeza mais recente e recolhe os relatórios anteriores ao voltar', async () => {
  const startedAt = Date.now() - 3000;
  const f = await fixture({cleanupReports: [
    {id: 'old', startedAt, status: 'completed', trigger: 'exit', items: [{type: 'cache', status: 'completed'}]},
    {id: 'recent', startedAt: startedAt + 1000, status: 'completed', trigger: 'manual', items: [{type: 'history', status: 'completed'}]}
  ]});
  try {
    const history = f.d.getElementById('cleanupHistory');
    assert.match(f.d.getElementById('reportItems').textContent, /histórico/i);
    assert.equal(history.hidden, false);
    assert.equal(history.open, false);
    assert.match(history.textContent, /cache/i);
    history.open = true;
    f.d.getElementById('tab-cache').click();
    f.d.getElementById('tab-cleanup').click();
    assert.equal(history.open, false);
    assert.equal(f.local.cleanupReports.length, 2);
  } finally { f.close(); }
});
