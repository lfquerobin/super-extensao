// Native UI-only audit. Fictitious profiles, mocked extension APIs, no account access.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..'), output = path.join(root,'work/ui-review');
fs.mkdirSync(output,{recursive:true});
let server, browser;
async function main() {
  server=http.createServer((req,res)=>{
    if(req.url==="/ui-audit"){res.setHeader("Content-Type","text/html; charset=utf-8");res.end("<!doctype html><html><head><meta charset=utf-8></head><body></body></html>");return;}
    const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
    res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,headless:true});
  const page=await browser.newPage({viewport:{width:600,height:700}}),errors=[];
  page.on('pageerror',error=>{errors.push(error.message);console.error('PAGE',error.message);});
  page.on('console',message=>{if(message.type()==='error')console.error('CONSOLE',message.text());});
  await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  await page.goto(origin+'/ui-audit');
  await page.evaluate(()=>{
    const listeners=new Set(),event={addListener(fn){listeners.add(fn);},removeListener(fn){listeners.delete(fn);}};
    const local={theme:'dark','superSync:accounts':JSON.stringify({saved:{type:'git',label:'Perfil de teste',url:'https://example.test/dav/',username:'audit',password:'fictitious',localRoot:'1',rootPath:'/Favoritos',bookmark_file:'bookmarks.xbel',enabled:true,failsafe:true,strategy:'default',syncInterval:15}})};
    const area=(data,name)=>({
      get(keys,callback){let result=typeof keys==='string'?{[keys]:data[keys]}:Array.isArray(keys)?Object.fromEntries(keys.map(key=>[key,data[key]])):{...keys,...data};callback?.(result);return Promise.resolve(result);},
      set(values,callback){const changes={};for(const [key,value]of Object.entries(values)){changes[key]={oldValue:data[key],newValue:value};data[key]=value;}listeners.forEach(fn=>fn(changes,name));callback?.();return Promise.resolve();},
      remove(keys,callback){[].concat(keys).forEach(key=>delete data[key]);callback?.();return Promise.resolve();},
    });
    window.chrome={runtime:{id:'audit',getURL:p=>location.origin+'/'+p,onMessage:event,sendMessage(data,cb){const value={channel:'super-sync',type:data.type+'Response',params:[true]};cb?.(value);return Promise.resolve(value);}},storage:{local:area(local,'local'),sync:area({'tabliss/config/locale':'en'},'sync'),onChanged:event},identity:{getRedirectURL:()=>location.origin+'/oauth'},permissions:{request(_value,cb){cb(true);}},i18n:{getUILanguage:()=> 'en'},tabs:{query(_value,cb){cb([]);}},bookmarks:{get(ids,cb){cb([].concat(ids).map(id=>({id,title:id==='0'?'':'Favorites',parentId:id==='0'?undefined:'0',children:[]})));},getTree(cb){cb([{id:'0',title:'Root',children:[{id:'1',title:'Favorites',children:[{id:'2',title:'A long nested folder name used to verify wrapping and selection',children:[]}]}]}]);}}};
    document.body.innerHTML='<div id="syncPanel"><div id="syncApp"></div></div>';
  });
  for(const file of ['ui-theme.css','popup-panels.css']) await page.addStyleTag({url:origin+'/'+file});
  for(const file of ['preferences.js','sync/js/options.js']) await page.addScriptTag({url:origin+'/'+file});
  await page.evaluate(()=>{window.SuperPreferences.bindTheme(document.documentElement);});
  await page.waitForFunction(()=>window.superSyncApp,null,{timeout:10000});
  await page.evaluate(async()=>{await window.superSyncApp.$router.push('/options/saved');});
  const folder=page.locator('input[readonly]').first();await folder.waitFor();await folder.click();
  await page.locator('dialog[open] .ui-folder-tree').waitFor();
  await page.locator('.ui-folder-tree summary').last().click();
  await page.screenshot({animations:"disabled",path:path.join(output,'sync-folders-dark.png')});
  await page.evaluate(()=>window.SuperPreferences.theme.set('light'));
  await page.screenshot({animations:"disabled",path:path.join(output,'sync-folders-light.png')});
  await page.setViewportSize({width:520,height:360});
  const box = await page.locator('dialog[open]').boundingBox();
  assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= 520 && box.y + box.height <= 360);
  assert.equal(await page.locator('dialog[open]').evaluate(el=>el.scrollWidth<=el.clientWidth),true);
  await page.setViewportSize({width:600,height:700});
  await page.locator('.ui-folder-tree input').last().check();
  await page.keyboard.press('Escape');assert.equal(await page.locator('dialog[open]').count(),0);
  assert.equal(await folder.evaluate(el=>el===document.activeElement),true);
  await folder.click();await page.locator('dialog[open] .ui-folder-tree').waitFor();
  assert.equal(await page.locator('.ui-folder-tree input:checked').getAttribute('aria-label'),'Favorites');
  await page.keyboard.press('Escape');
  await page.evaluate(async()=>{await window.superSyncApp.$router.push('/new');});
  await page.locator('.ui-steps').waitFor();
  assert.equal(await page.locator('.sync-service').count(),2);
  const services=await page.locator('.sync-service').allTextContents();
  assert.ok(services[0].includes('Google Drive') && services[1].includes('Git'));
  await page.screenshot({animations:'disabled',path:path.join(output,'sync-providers-light.png')});
  assert.equal(await page.locator('.ui-wizard-step:not([hidden])').count(),1);
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.ui-steps [aria-current=step]')?.textContent.includes('Name'));
  assert.equal(await page.locator('.ui-wizard-step:not([hidden])').count(),1);
  assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('role')),'heading');
  await page.screenshot({animations:"disabled",path:path.join(output,'sync-wizard-light.png')});
  assert.deepEqual(errors,[]);
  console.log('PASS native folder hierarchy, exact selection, cancellation, Escape and focus restoration');
  console.log('PASS native wizard progression, lazy panels, heading focus and light/dark layouts');
  console.log('BROWSER',browser.version());
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{await browser?.close();if(server)await new Promise(resolve=>server.close(resolve));});
