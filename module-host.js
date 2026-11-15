/* Module lifetime belongs to the worker. Preference changes are transactions. */
(() => {
  const api = chrome, modules = SuperModules;
  const eventRoutes = new Map();
  let externalRoute, authRoute;
  const factories = [], stopping = new Set(), stops = new Map(), routes = new Map();
  let values, changing = false, queue = Promise.resolve();
  const internal = sender => sender?.id === api.runtime.id && typeof sender.url === 'string' && sender.url.startsWith(api.runtime.getURL(''));
  const enabled = id => values?.[id] === true && !stopping.has(id);
  function listen(id, event, handler) {
    event.addListener((...args) => {
      void host.ready.then(() => {if (enabled(id)) return handler(...args);}).catch(error => console.warn('Module event failed', id, error));
    });
  }
  async function releaseVpn() {
    // Remove only controls owned by this extension; never clear another VPN.
    if (api.proxy?.settings) {
      const details = await api.proxy.settings.get({incognito: false});
      if (details.levelOfControl === 'controlled_by_this_extension') await api.proxy.settings.clear({scope: 'regular'});
      if ((await api.proxy.settings.get({incognito: false})).levelOfControl === 'controlled_by_this_extension') throw Error('ModuleVpnReleaseFailed');
    }
    const privacy = api.privacy?.network?.webRTCIPHandlingPolicy;
    if (privacy) {
      if ((await privacy.get({})).levelOfControl === 'controlled_by_this_extension') await privacy.clear({scope: 'regular'});
      if ((await privacy.get({})).levelOfControl === 'controlled_by_this_extension') throw Error('ModuleVpnReleaseFailed');
    }
    const dnr = api.declarativeNetRequest;
    if (dnr) {
      const ids = (await dnr.getDynamicRules()).filter(rule => (rule.id >= 880001 && rule.id <= 880005 || rule.id >= 881000 && rule.id <= 884000)).map(rule => rule.id);
      if (ids.length) await dnr.updateDynamicRules({removeRuleIds: ids});
      const session = (await dnr.getSessionRules()).filter(rule => (rule.id >= 880001 && rule.id <= 880005 || rule.id >= 881000 && rule.id <= 884000)).map(rule => rule.id);
      if (session.length) await dnr.updateSessionRules({removeRuleIds: session});
      if ((await dnr.getDynamicRules()).some(rule => (rule.id >= 880001 && rule.id <= 880005 || rule.id >= 881000 && rule.id <= 884000)) ||
          (await dnr.getSessionRules()).some(rule => (rule.id >= 880001 && rule.id <= 880005 || rule.id >= 881000 && rule.id <= 884000))) throw Error('ModuleVpnReleaseFailed');
    }
  }
  async function clearAlarms(id) {
    for (const alarm of await api.alarms.getAll()) {
      if (id === 'sync' ? alarm.name.startsWith('super-sync:') : id === 'vpn' ? alarm.name.startsWith('superVpn:') : alarm.name === 'pause-resume')
        await api.alarms.clear(alarm.name);
    }
  }
  const content = [
    {id:'super-autoplay-main', module:'autoplay', js:['autoplay-main.js'], world:'MAIN', allFrames:true, matchOriginAsFallback:true},
    {id:'super-autoplay-bridge', module:'autoplay', js:['modules.js','navigation-rules.js','autoplay-bridge.js'], allFrames:true, matchOriginAsFallback:true},
    {id:'super-vpn-auth', module:'vpn', js:['vpn-auth-bridge.js'], world:'MAIN'},
    {id:'super-vpn-relay', module:'vpn', js:['vpn/js/browser-polyfill.min.js','vpn/js/transmit.js']},
  ];
  async function updateContent(next) {
    if (!api.scripting?.getRegisteredContentScripts) return;
    const major = Number(/(?:Chrome|Chromium|Edg)\/(\d+)/.exec(globalThis.navigator?.userAgent || '')?.[1] || 0);
    const wanted = content.filter(item => next[item.module]).map(({module, ...item}) => {
      const definition = {...item, runAt:'document_start', persistAcrossSessions:true,
        matches:module === 'vpn' ? ['https://account.proton.me/*','https://account.protonvpn.com/*'] : ['http://*/*','https://*/*']};
      if (major < 119) delete definition.matchOriginAsFallback;
      return definition;
    });
    const existing = await api.scripting.getRegisteredContentScripts();
    const own = new Set(content.map(item => item.id));
    const equal = (a,b) => ['js','matches'].every(key => JSON.stringify(a[key]) === JSON.stringify(b[key])) &&
      (a.world || 'ISOLATED') === (b.world || 'ISOLATED') && a.runAt === b.runAt &&
      !!a.allFrames === !!b.allFrames && !!a.matchOriginAsFallback === !!b.matchOriginAsFallback;
    const remove = existing.filter(item => own.has(item.id) && !wanted.some(next => next.id === item.id && equal(next,item))).map(item => item.id);
    if (remove.length) await api.scripting.unregisterContentScripts({ids:remove});
    const add = wanted.filter(item => !existing.some(old => old.id === item.id && equal(item,old)));
    if (add.length) await api.scripting.registerContentScripts(add);
  }

  async function releasePages(id) {
    if (!api.scripting?.executeScript || !['autoplay','vpn'].includes(id)) return;
    for (const tab of await api.tabs.query({})) {
      if (!Number.isInteger(tab.id) || !/^https?:\/\//.test(tab.url || '')) continue;
      try {
        await api.scripting.executeScript({target:{tabId:tab.id, allFrames:true}, world:'MAIN',
          func: module => document.dispatchEvent(new CustomEvent(module === 'autoplay' ? 'super-extensao:autoplay-config' : 'super-extension:vpn-disabled',
            {detail: JSON.stringify({block:false, disabled:true})})), args:[id]});
      } catch { /* Restricted frames and tabs that closed cannot retain a working bridge. */ }
    }
  }
  async function removeSpareTabs() {
    const state = (await api.storage.session.get({tabGuardSession:{owned:{}}})).tabGuardSession;
    const url = api.runtime.getURL('spare-tab.html');
    for (const tab of await api.tabs.query({})) {
      if (state.owned?.[String(tab.id)] !== tab.windowId || !tab.pinned || tab.url !== url) continue;
      const siblings = await api.tabs.query({windowId:tab.windowId});
      if (siblings.some(other => other.id !== tab.id)) await api.tabs.remove(tab.id);
      else await api.tabs.update(tab.id, {pinned:false});
    }
    await api.storage.session.set({tabGuardSession:{firstWindowId:null,owned:{}}});
  }
  async function change(id, value) {
    if (!modules.ids.includes(id) || typeof value !== 'boolean') throw Error('ModuleInvalidSetting');
    await host.ready;
    if (changing) throw Error('ModuleChanging');
    if (values[id] === value) return values;
    const next = {...values, [id]:value}, undo = [];
    const alarms = await api.alarms.getAll();
    const badge = await api.action.getBadgeText?.({}) || '';
    let clearedBadge = false;
    changing = true;
    modules.ids.forEach(item => stopping.add(item));
    try {
      // Reload stops all workers. Do not interrupt a synchronization or cleanup.
      for (const [item, stop] of stops) if (values[item]) {
        const rollback = await stop(next[item]);
        if (rollback) undo.push(rollback);
      }
      if (!next.vpn) {await releaseVpn();await clearAlarms('vpn');}
      if (!next.sync) await clearAlarms('sync');
      if (!next.cleanup) {await clearAlarms('cleanup');await api.action.setBadgeText({text:''});clearedBadge = true;}
      if (!next.tabs) await removeSpareTabs();
      await updateContent(next);
      await api.storage.local.set({[modules.key(id)]:value});
      values = next;
      if (!value) await releasePages(id);
      // Reply first so the UI knows the change was persisted before it closes.
      setTimeout(() => api.runtime.reload(), 200);
      return {...values};
    } catch (error) {
      for (const alarm of alarms) {
        if (alarm.name === 'pause-resume' || /^(superVpn:|super-sync:)/.test(alarm.name)) {
          const details = {...(alarm.periodInMinutes ? {periodInMinutes:alarm.periodInMinutes} : {}),
            ...(alarm.scheduledTime ? {when:alarm.scheduledTime} : {delayInMinutes:1})};
          await api.alarms.create(alarm.name,details).catch(() => {});
        }
      }
      await updateContent(values).catch(() => {});
      if (clearedBadge) await api.action.setBadgeText({text:badge}).catch(() => {});
      stopping.clear();
      for (const rollback of undo.reverse()) await rollback();
      changing = false;
      throw error;
    }
  }
  const host = globalThis.SuperModuleHost = {
    isEnabled: enabled, listen, releaseVpn,
    register(id, start) {factories.push({id,start});},
    onStop(id, stop) {stops.set(id,stop);},
    message(id, handler) {routes.set(id,handler);},
    external(handler) {externalRoute = handler;},
    auth(handler) {authRoute = handler;},
    event(id, name, handler) {
      const key = id+':'+name;
      if (!eventRoutes.has(key)) eventRoutes.set(key,[]);
      eventRoutes.get(key).push(handler);
    },
    ready: null,
  };
  host.ready = modules.read(api).then(async loaded => {
    values = loaded;
    if (!values.vpn) {await releaseVpn();await clearAlarms('vpn');}
    if (!values.sync) await clearAlarms('sync');
    if (!values.cleanup) {await clearAlarms('cleanup');await api.action.setBadgeText({text:''});}
    for (const {id,start} of factories) if (enabled(id)) start();
    await updateContent(values);
    return {...values};
  });
  host.ready.catch(() => console.warn('Module initialization failed'));
  api.runtime.onMessage.addListener((message, sender, reply) => {
    const control = ['modules:status','modules:set'].includes(message?.action);
    const id = message?.channel === 'super-sync' ? 'sync' : message?.channel === 'super-vpn' ? 'vpn' : null;
    if (!control && (!id || message.respondTo === 'none' || message.type === 'status:update')) return;
    if (control && !internal(sender)) return;
    if (id === 'sync' && !internal(sender)) return;
    const failure = error => reply(control ? {ok:false,error:error.message} : id === 'sync'
      ? {channel:'super-sync',type:message.type+'Response',error:error.message,params:[]}
      : {received:true,success:false,result:{error:{message:error.message}}});
    if (control && message.action === 'modules:set') {
      if (changing) {failure(Error('ModuleChanging'));return;}
      const result = queue.then(() => change(message.id,message.value));
      queue = result.catch(() => {});
      result.then(result => reply({ok:true,modules:result}),failure);
    } else void host.ready.then(() => {
      if (control) reply({ok:true,modules:{...values}});
      else if (!enabled(id)) failure(Error('ModuleDisabled'));
      else if (routes.has(id)) routes.get(id)(message,sender,reply);
      else failure(Error('ModuleUnavailable'));
    }).catch(failure);
    return true;
  });
  // Register wake-up listeners synchronously. Engines attach only after the
  // preference read, but the first bookmark/alarm event must not be lost.
  for (const name of ['tabs.onUpdated','tabs.onRemoved','tabs.onMoved','tabs.onDetached',
    'tabGroups.onCreated','tabGroups.onMoved','tabGroups.onRemoved','tabGroups.onUpdated',
    'bookmarks.onChanged','bookmarks.onMoved','bookmarks.onRemoved','bookmarks.onCreated',
    'alarms.onAlarm','runtime.onStartup']) {
    const [area,event] = name.split('.');
    api[area]?.[event]?.addListener((...args) => {
      void host.ready.then(async () => {
        if (!enabled('sync')) return;
        for (const handler of eventRoutes.get('sync:'+name) || []) await handler(...args);
      }).catch(() => console.warn('Module event failed', 'sync', name));
    });
  }
  api.runtime.onMessageExternal?.addListener((message,sender,reply) => {
    if (message?.type !== 'fork' || !['https://account.proton.me','https://account.protonvpn.com'].some(origin => {
      try {return new URL(sender.url || sender.tab?.url).origin === origin;} catch {return false;}
    })) return;
    void host.ready.then(() => enabled('vpn') && externalRoute ? externalRoute(message,sender) :
      {type:'error',payload:{message:'ModuleDisabled'}}).then(reply,() => reply({type:'error',payload:{message:'ModuleUnavailable'}}));
    return true;
  });
  if (api.webRequest?.onAuthRequired) {
    const receiveAuth = (details,reply) => {
      void host.ready.then(() => {
        if (enabled('vpn') && authRoute) authRoute(details,reply);
        else reply({});
      }).catch(async () => {
        const own = details.isProxy && api.proxy?.settings &&
          (await api.proxy.settings.get({incognito:false}).catch(() => ({}))).levelOfControl === 'controlled_by_this_extension';
        reply(own ? {cancel:true} : {});
      });
    };
    try {api.webRequest.onAuthRequired.addListener(receiveAuth,{urls:['<all_urls>']},['asyncBlocking','extraHeaders']);}
    catch {api.webRequest.onAuthRequired.addListener(receiveAuth,{urls:['<all_urls>']},['asyncBlocking']);}
  }

})();
