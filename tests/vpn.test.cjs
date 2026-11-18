const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = path.resolve(__dirname, '../vpn/runtime');

function load(file, mocks = {}, globals = {}) {
  const filename = path.join(source, file + '.ts');
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020}
  }).outputText;
  vm.runInNewContext(code, {
    exports, URL, setTimeout, clearTimeout, ...globals,
    require(spec) {
      if (spec in mocks) return mocks[spec];
      return load(path.relative(source, path.resolve(path.dirname(filename), spec)), mocks, globals);
    }
  }, {filename});
  return exports;
}
const plain = value => JSON.parse(JSON.stringify(value));

test('split tunneling works for Free and paid accounts, with separate include/exclude lists', () => {
  const {getSplitTunnelingConfig: config} = load('vpn/getSplitTunnelingConfig');
  const value = [
    {domain: 'example.com', withSubDomains: true, mode: 'exclude'},
    {domain: 'private.example', withSubDomains: false, mode: 'include'}
  ];
  for (const tier of [0, 2]) {
    assert.deepEqual(plain(config(tier, {value})), {
      mode: 'exclude', filteredDomains: ['example.com', '.example.com']
    });
    assert.deepEqual(plain(config(tier, {value, mode: 'include'})), {
      mode: 'include', filteredDomains: ['private.example']
    });
    assert.deepEqual(plain(config(tier, {value, enabled: false})).filteredDomains, []);
  }
});

test('account relay accepts only session forks from exact account origins', () => {
  let listener;
  const sent = [];
  const window = {addEventListener(_, fn) {listener = fn;}};
  load('tools/relayMessagesToExtension').relayMessagesToExtension(window, {
    sendMessage: async value => sent.push(value)
  });
  const data = {type: 'fork', payload: {state: 'pending-state', selector: 'selector'}};
  const event = {source: window, origin: 'https://account.proton.me', data};
  listener({...event, origin: 'https://evil.proton.me'});
  listener({...event, source: {}});
  listener({...event, data: {type: 'connect'}});
  listener({...event, data: {type: 'fork'}});
  assert.equal(sent.length, 0);
  listener(event);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].channel, 'super-vpn');
});

test('VPN background ignores other modules and page requests to connect', async () => {
  let listener, external;
  const calls = [];
  const runtime = {
    id: 'test', getURL: p => 'chrome-extension://test/' + p,
    onMessage: {addListener: fn => {listener = fn;}},
    onMessageExternal: {addListener: fn => {external = fn;}}
  };
  load('vpn/initMessaging', {
    '../messaging/messaging': {routeMessage: async m => {calls.push(m); return 'done';}},
    '../account/RefreshTokenError': {RefreshTokenError: class extends Error {}},
    '../state': {logOut() {}}, '../account/createSession': {createSession() {}},
    '../messaging/forkSession': {forkSession: async m => {calls.push(m); return {type: 'success'};}},
    '../tools/executeOnTab': {executeOnTab() {}},
    '../account/partner/partners': {getPartnerById() {}},
    '../tools/delay': {delay() {}},
    '../tools/getRuntime': {getRuntime: () => runtime},
    './handleAccountFork': {handleAccountFork: async () => ({handled: true})}
  }).initMessaging();
  const internal = {url: 'chrome-extension://test/vpn/interface.html'};
  assert.equal(listener({type: 'clearNow'}, internal), undefined);
  assert.equal(listener({channel: 'super-sync', type: 'state'}, internal), undefined);
  assert.equal(listener({channel: 'super-vpn', type: 'connect'}, {url: 'https://account.proton.me/'}), undefined);
  assert.equal(listener({channel: 'super-vpn', type: 'fork'}, internal), undefined);
  assert.equal(listener({channel: 'super-vpn', type: 'changeState', respondTo: 'none'}, internal), undefined);
  assert.equal(calls.length, 0);
  const response = await new Promise(resolve => {
    assert.equal(listener({channel: 'super-vpn', type: 'state'}, internal, resolve), true);
  });
  assert.equal(response.success, true);
  assert.equal(calls.length, 1);
  assert.equal(listener({channel:'super-vpn',type:'beginLogin'}, {url:'https://account.proton.me/'}), undefined);
  assert.equal(listener({channel:'super-vpn',type:'setWebRTC'}, {url:'https://account.proton.me/'}), undefined);
  assert.equal(await external({type:'fork'}, {url:'https://account.proton.me.evil.test/'}), undefined);
  assert.equal(await external({type:'fork'}, {url:'https://evil.test/'}), undefined);
  assert.equal(calls.length,1);
  assert.equal((await external({type:'fork'}, {url:'https://account.proton.me/authorize'})).type, 'success');
  assert.equal(calls.length,2);
});

test('VPN popup uses a direct reply and rejects when the receiver disappears', async () => {
  const runtime = {
    async sendMessage(...args) {
      assert.deepEqual(plain(args), [{channel: 'super-vpn', type: 'state'}]);
      return {received: true, result: 'connected'};
    }
  };
  const {sendMessageTo} = load('tools/sendMessageTo', {'./getRuntime': {getRuntime: () => runtime}});
  assert.equal(await sendMessageTo('state'), 'connected');

  runtime.sendMessage = async () => {throw new Error('Receiving end does not exist.');};
  await assert.rejects(sendMessageTo('state'), /VpnWorkerUnavailable/);
  runtime.sendMessage = async () => undefined;
  await assert.rejects(sendMessageTo('state'), /VpnWorkerUnavailable/);
});

test('VPN storage cannot overwrite or delete host settings', async () => {
  const data = {theme: 'light', 'superSync:accounts': {id: 1}};
  const local = {
    get: (key, callback) => callback({[key]: data[key]}),
    set: async values => Object.assign(data, values),
    remove: async key => {delete data[key];}
  };
  const {storage} = load('tools/storage', {}, {chrome: {storage: {local}}});
  await storage.setItem('theme', {value: 'dark'});
  assert.equal(data.theme, 'light');
  assert.deepEqual(data['superSync:accounts'], {id: 1});
  assert.equal(data['superVpn:theme'].value, 'dark');
  await storage.removeItem('theme');
  assert.equal(data.theme, 'light');
});


test('Free server selection keeps paid tiers restricted in the worker', () => {
  const {assertServerAccess: check} = load('vpn/assertServerAccess');
  assert.doesNotThrow(() => check({VPN: {MaxTier: 0}}, {Tier: 0}));
  assert.throws(() => check({VPN: {MaxTier: 0}}, {Tier: 2}), /not available/);
  assert.throws(() => check(undefined, {Tier: 0}), /not available/);
  assert.throws(() => check({VPN: {MaxTier: 0}}, {Tier: NaN}), /not available/);
  assert.doesNotThrow(() => check({VPN: {MaxTier: 2}}, {Tier: 2}));
});

test('account forks are consumed only when their state belongs to this extension', async () => {
  const calls = [];
  const {handleAccountFork} = load('vpn/handleAccountFork', {
    '../account/loginFlow': {loginFlow: {owns: async state => state === 'A'.repeat(43)}},
    '../config': {appId: 'ours'},
    '../messaging/forkSession': {forkSession: async message => {calls.push(message); return {type: 'success'};}}
  });
  assert.equal((await handleAccountFork({payload: {state: 'other', selector: 'selector'}})).handled, false);
  assert.equal((await handleAccountFork({payload: {state: 'A'.repeat(43)}})).handled, false);
  assert.equal(calls.length, 0);
  const result = await handleAccountFork({payload: {state: 'A'.repeat(43), selector: 'selector'}});
  assert.equal(result.handled, true); assert.equal(result.response.type, 'success'); assert.equal(calls.length, 1);
});

test('Chromium auth adapter supports callback and Promise replies and preserves other extension logins', async () => {
  let listener, serial = 0;
  const requests = [], originalCalls = [];
  const origin = 'https://account.proton.me';
  const runtime = {sendMessage(...args) {
    originalCalls.push(args);
    const callback = args.at(-1);
    if (typeof callback === 'function') callback({type: 'official'});
    else return Promise.resolve({type: 'official'});
  }};
  const window = {addEventListener(type, fn) {if(type === 'message') listener = fn;}, removeEventListener() {}, postMessage(data) {requests.push(data);}};
  vm.runInNewContext(fs.readFileSync(path.resolve(source, '../../vpn-auth-bridge.js'), 'utf8'), {
    window, location: {origin}, chrome: {runtime}, crypto: {randomUUID: () => 'id-' + ++serial}, setTimeout, clearTimeout
  });
  const message = {type: 'fork', payload: {state: 'owned', selector: 'selector', persistent: true, keyPassword: 'must-not-relay'}};
  const id = 'jplgfhpmjnbigmhklmmbgecoobifkmpa';
  let reply;
  runtime.sendMessage(id, message, value => {reply = value;});
  assert.equal(requests.length, 1); assert.equal(requests[0].message.payload.keyPassword, undefined);
  const respond = (request, result, eventOrigin = origin) => listener({source: window, origin: eventOrigin, data: {
    channel: 'super-vpn-auth', direction: 'response', id: request.id, result
  }});
  respond(requests[0], {handled: true, response: {type: 'success'}}, 'https://evil.example');
  await Promise.resolve(); assert.equal(reply, undefined);
  respond(requests[0], {handled: true, response: {type: 'success'}});
  await Promise.resolve(); await Promise.resolve();
  assert.equal(reply.type, 'success'); assert.equal(originalCalls.length, 0);
  const promise = runtime.sendMessage(id, message);
  respond(requests[1], {handled: true, response: {type: 'success'}});
  assert.equal((await promise).type, 'success');
  const foreignLogin = runtime.sendMessage(id, message);
  respond(requests[2], {handled: false});
  assert.equal((await foreignLogin).type, 'official');
  await runtime.sendMessage('another-extension', {type: 'state'});
  assert.equal(originalCalls.length, 2);
});

test('proxy ownership watcher registers exactly once and reacts when another extension takes control', async () => {
  const listeners = new Set(), disconnected = [];
  const watcher = load('vpn/initProxySettingsWatcher', {
    '../state': {getCurrentStateIfDefined:()=>({name:'on',proxyEnabled:true}),connectionLifecycle:{guard:()=>()=>true},privacyFault:()=>disconnected.push('network blocked')},
    '../tools/proxy': {hasProxy:async()=>true},
    './connectedServer': { isConnected: async () => true },
    '../tools/translate': { c: () => ({ t: (parts, ...values) => parts.reduce((text, part, i) => text + part + (values[i] || ''), '') }) },
  }, { browser: { proxy: { settings: { onChange: { addListener: fn => listeners.add(fn), removeListener: fn => listeners.delete(fn) } } } } });
  watcher.initProxySettingsWatcher(); watcher.initProxySettingsWatcher();
  assert.equal(listeners.size, 1);
  const listener = [...listeners][0];
  await listener({ levelOfControl: 'controlled_by_this_extension' });
  assert.equal(disconnected.length, 0);
  await listener({ levelOfControl: 'controlled_by_other_extensions', value: { rules: { singleProxy: { host: 'other.proxy', port: 8888 } } } });
  assert.equal(disconnected.length, 1);
  assert.match(disconnected[0], /blocked/);
  watcher.removeProxySettingsWatcher(); assert.equal(listeners.size, 0);
  watcher.initProxySettingsWatcher(); assert.equal(listeners.size, 1);
});

test('the VPN service loads the polyfill first and defers the compiled worker to the host', () => {
  const vpn = path.resolve(source, '..');
  const imported = [];
  const registrations = [];
  const engine = fs.readFileSync(path.join(vpn, 'js/background.js'), 'utf8');
  const context = vm.createContext({
    importScripts(...urls) {
      imported.push(...urls);
      vm.runInContext(engine, context, { filename: 'vpn/js/background.js' });
    },
    SuperModuleHost: {
      register(id, start) { registrations.push({ id, start }); },
    },
  });
  vm.runInContext(fs.readFileSync(path.join(vpn, 'js/service.js'), 'utf8'), context);
  assert.deepEqual(imported, ['/vpn/js/browser-polyfill.min.js', '/vpn/js/background.js']);
  assert.equal(registrations.length, 1);
  assert.equal(registrations[0].id, 'vpn');
  assert.equal(typeof registrations[0].start, 'function');
});

test('worker installs its listeners and restores the traffic guard before the saved proxy', async () => {
  const events = [];
  const pending = [];
  let resumeRestore, stop, indicator;
  const guard = new Promise(resolve => { resumeRestore = resolve; });
  const mark = (name) => () => { events.push(name); };

  load('worker', {
    './notifications/privacyWarning': { emitPrivacyWarning: mark('notify') },
    './state': {
      connectionLifecycle: { guard: () => () => true, capture: () => 17 },
      disconnect: async () => mark('disconnect')(),
      getCurrentStateIfDefined: () => undefined,
      isCurrentStateConnected: () => false,
      privacyFault: mark('privacy-fault'),
    },
    './tools/nativeStorage': { nativeStorage: {
      watchFailures: mark('storage-watch'),
      remove: async () => mark('clear-login')(),
    } },
    './tools/proxy': {
      getFixedServerConfig: () => ({ rules: { bypassList: [] } }),
      setProxyToWaiterHost: async () => mark('temporary-proxy')(),
    },
    './tools/sentry': { initSentry: mark('diagnostics') },
    './tools/setupHandleProxyRequest': { setupHandleProxyRequest: mark('requests') },
    './tools/translate': { fetchTranslations: async () => mark('locale')() },
    './tools/triggerPromise': { triggerPromise: promise => pending.push(promise) },
    './vpn/connectedServer': { connectedServer: { get: async () => ({ value: true }) } },
    './vpn/initAuthInterceptor': { initAuthInterceptor: mark('auth') },
    './vpn/initFocusWatcher': { initFocusWatcher: mark('focus') },
    './vpn/initIdleWatcher': { initIdleWatcher: mark('idle') },
    './vpn/initMessaging': { initMessaging: mark('messages') },
    './vpn/initPrivacyWatchers': { initPrivacyWatchers: mark('privacy') },
    './vpn/initProxySettingsWatcher': { initProxySettingsWatcher: mark('proxy-watch') },
    './vpn/initState': {
      initState: async () => mark('restore')(),
      initStateRecovery: mark('recovery-listener'),
    },
    './vpn/networkGuard': {
      bootstrapNetworkGuard: () => guard,
      networkBlocked: () => true,
      networkGuard: { status: async () => ({ blocked: true }) },
    },
    './webrtc/privacyController': {
      privacyController: { apply: async () => mark('clear-webrtc')() },
    },
    './webrtc/state': { WebRTCState: { CLEAR: 'clear' } },
  }, {
    SuperModuleHost: { onStop(id, handler) { assert.equal(id, 'vpn'); stop = handler; } },
    SuperVpnIndicator: { attach(reader) { indicator = reader; } },
  });

  assert.deepEqual(events.slice(0, 6), ['diagnostics', 'recovery-listener', 'auth', 'messages', 'storage-watch', 'privacy']);
  assert.equal(events.includes('temporary-proxy'), false);
  assert.equal(indicator().blocked, true);
  assert.equal(indicator().connectionRevision, 17);

  resumeRestore();
  await Promise.all(pending);
  assert.deepEqual(events.slice(-3), ['notify', 'temporary-proxy', 'restore']);

  await stop(true);
  assert.equal(events.includes('disconnect'), false);
  await stop(false);
  assert.deepEqual(events.slice(-3), ['disconnect', 'clear-webrtc', 'clear-login']);
});
