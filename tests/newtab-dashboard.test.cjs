const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path'), fs = require('node:fs'), vm = require('node:vm');
const load = require('./helpers/load-ts.cjs');
const root = path.resolve(__dirname, '..'), cache = new Map();
const core = name => load(path.join(root, 'newtab/engine', name + '.ts'), {}, {}, cache);
const DB = core('database'), { defaults } = core('model');
const { dashboardStore } = core('dashboard'), { pluginSession } = core('plugin-session');
test('dashboard projection retains order, positions and stable identity for data-only changes', () => {
  const db = DB.init(defaults('en')), store = dashboardStore(db), initial = store.read();
  let changes = 0; const stop = store.subscribe(() => changes++);
  DB.put(db, 'data/default-time', { format: 'HH:mm' });
  assert.equal(store.read(), initial);
  DB.put(db, 'widget/default-time', { ...DB.get(db, 'widget/default-time'), order: 2, display: { position: 'topRight' } });
  const next = store.read();
  assert.deepEqual(Array.from(next.items, x => x.id), ['default-greeting', 'default-time']);
  assert.equal(next.slots.get('topRight')[0].id, 'default-time');
  DB.put(db, 'focus', true); assert.equal(store.read().focus, true);
  DB.put(db, 'background', { id: 'new', key: 'background/colour', display: { luminosity: 1 } });
  assert.equal(store.read().theme, 'light'); stop();
  DB.put(db, 'focus', false); assert.equal(changes, 4); assert.equal(db.listeners.size, 0);
});
test('removed or disposed providers cannot resurrect data and loaders balance after late completions', () => {
  let current = true, pending = 0; const writes = [];
  const session = pluginSession({ current: () => current, setData: x => writes.push(x), setCache: x => writes.push(x), pushLoader: () => pending++, popLoader: () => pending-- });
  session.loader.pop(); assert.equal(pending, 0);
  session.loader.push(); session.loader.push(); session.setData('initial');
  current = false; session.setCache('late before cleanup'); session.loader.push();
  session.dispose(); session.dispose(); session.loader.pop();
  current = true; session.setData('late after ID reused'); session.loader.push();
  assert.equal(pending, 0); assert.deepEqual(writes, ['initial']);
});

test('own React dashboard handles strict remounts, live data, focus cleanup and missing providers independently', async () => {
  const { JSDOM } = require('jsdom'), ts = require('typescript');
  const React = require('../newtab/node_modules/react');
  const { createRoot } = require('../newtab/node_modules/react-dom/client');
  const { act } = require('../newtab/node_modules/react-dom/test-utils');
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://extension.test' });
  const previous = { window: global.window, document: global.document, flag: global.IS_REACT_ACT_ENVIRONMENT };
  global.window = dom.window; global.document = dom.window.document; global.IS_REACT_ACT_ENVIRONMENT = true;
  const db = DB.init(defaults('en')), cached = DB.init();
  let pending = 0, mounts = 0, cleanups = 0; const apis = [];
  function Probe(api) {
    apis.push(api);
    React.useEffect(() => { mounts++; api.loader.push(); return () => { cleanups++; api.loader.pop(); }; }, [api.loader]);
    return React.createElement('span', { className: 'probe' }, api.data?.text || 'widget');
  }
  function Background() { return React.createElement('span', null, 'background'); }
  const props = { db, cache: cached, resolve: key => {
    if (key === 'missing') throw Error('Missing provider');
    return key.startsWith('background/') ? Background : Probe;
  }, pushLoader: () => pending++, popLoader: () => pending--,
  Overlay: () => React.createElement('button', null, 'controls'), Failure: () => React.createElement('span', { className: 'failure' }, 'failed') };
  const filename = path.join(root, 'newtab/dashboard/Dashboard.tsx'), exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true, target: ts.ScriptTarget.ES2020 } }).outputText, {
    exports, localStorage: dom.window.localStorage, require(name) {
      if (name === 'react') return React;
      if (name === 'react-error-boundary') return require('../newtab/node_modules/react-error-boundary');
      if (name.endsWith('.sass')) return {};
      return core(path.basename(name));
    }
  }, { filename });
  const Dashboard = exports.default, renderer = createRoot(document.getElementById('root'));
  const originalError = console.error; console.error = (...args) => { if (!args.some(x => String(x).includes('Missing provider') || String(x).includes('above error occurred'))) originalError(...args); };
  try {
    await act(async () => renderer.render(React.createElement(React.StrictMode, null, React.createElement(Dashboard, props))));
    assert.equal(document.querySelectorAll('.probe').length, 2); assert.equal(pending, 2);
    const before = mounts;
    await act(async () => DB.put(db, 'data/default-time', { text: 'updated across tabs' }));
    assert.match(document.body.textContent, /updated across tabs/); assert.equal(mounts, before);
    const oldApi = apis[apis.length - 1];
    await act(async () => DB.put(db, 'focus', true));
    assert.equal(pending, 0); assert.equal(document.querySelectorAll('.probe').length, 0);
    const oldData = DB.get(db, 'data/default-greeting');
    oldApi.setData({ text: 'stale' }); oldApi.loader.pop(); assert.equal(pending, 0);
    assert.equal(DB.get(db, 'data/default-greeting'), oldData);
    await act(async () => DB.put(db, 'focus', false)); assert.equal(pending, 2);
    await act(async () => DB.put(db, 'widget/broken', { id: 'broken', key: 'missing', order: 3, display: { position: 'topLeft' } }));
    assert.equal(document.querySelectorAll('.failure').length, 1); assert.equal(document.querySelectorAll('.probe').length, 2);
    await act(async () => DB.put(db, 'widget/broken', { id: 'broken', key: 'widget/notes', order: 3, display: { position: 'topLeft' } }));
    assert.equal(document.querySelectorAll('.failure').length, 0); assert.equal(pending, 3);
    await act(async () => renderer.unmount());
    assert.equal(pending, 0); assert.equal(mounts, cleanups); assert.equal(db.listeners.size, 0); assert.equal(cached.listeners.size, 0);
  } finally {
    console.error = originalError;
    await act(async () => renderer.unmount()); dom.window.close();
    global.window = previous.window; global.document = previous.document; global.IS_REACT_ACT_ENVIRONMENT = previous.flag;
  }
});
