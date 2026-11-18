const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), ts = require('typescript');
const root = path.resolve(__dirname, '..');
const loadTs = require('./helpers/load-ts.cjs');
const cache = new Map(), core = name => loadTs(path.join(root, 'newtab/engine', name + '.ts'), { crypto: require('node:crypto').webcrypto }, {}, cache);
const { createCatalog, pluginDefinitions } = core('catalog'), DB = core('database'), { defaults } = core('model'), { editorActions } = core('editor');
function bindings(value = {}) { return new Map(Array.from(pluginDefinitions, entry => [entry.key, value])); }
test('own catalog retains legacy identities, enforces target availability and sorts labels after language changes', () => {
  let translated = false;
  const catalog = createCatalog(bindings({ implementation: true }), text => translated ? ({ Notes: 'AAA', Time: 'ZZZ' }[text] || text) : text);
  assert.equal(catalog.list('widget').length, 15); assert.equal(catalog.list('background').length, 5);
  assert.equal(catalog.find('widget/js'), undefined); assert.throws(() => catalog.get('widget/js'));
  assert.equal(catalog.get('widget/notes').name, 'Notes');
  translated = true; assert.equal(catalog.get('widget/notes').name, 'AAA');
  assert.equal(catalog.list('widget')[0].key, 'widget/notes');
  assert.equal(catalog.list('widget').at(-1).key, 'widget/time');
  assert.equal(catalog.get('background/image').supportsBackdrop, true);
  assert.equal(catalog.get('widget/notes').implementation, true);
  assert.equal(createCatalog(bindings(), x => x, 'web').list('widget').length, 16);
  assert.throws(() => createCatalog(new Map(), x => x), /Missing plugin binding/);
  assert.throws(() => catalog.get('missing'), /Unable to find config/);
});
test('editor validates new selections and rejects stale background edits without damaging imported unknown plugins', () => {
  const db = DB.init(defaults('en')), cacheDb = DB.init(), catalog = createCatalog(bindings(), x => x), actions = editorActions(db, cacheDb, catalog);
  for (const key of ['background/colour', 'widget/js', 'widget/unknown']) assert.throws(() => actions.addWidget(key));
  assert.throws(() => actions.setBackground('widget/time'));
  const old = DB.get(db, 'background'); actions.setBackground('background/image');
  actions.setBackgroundDisplay(old.id, { blur: 50 }); assert.equal(DB.get(db, 'background').display.blur, 0);
  const current = DB.get(db, 'background'); actions.setBackgroundDisplay(current.id, { blur: 12 }); actions.setBackgroundDisplay(current.id, { luminosity: 0.4 });
  assert.equal(DB.get(db, 'background').display.blur, 12);
  actions.importStore({ ...JSON.parse(actions.exportStore()), 'widget/unknown': { id: 'unknown', key: 'widget/unknown', order: 9, display: { position: 'topLeft' } }, 'data/unknown': { keep: true } });
  assert.equal(DB.get(db, 'data/unknown').keep, true);
  actions.removeWidget('unknown'); assert.equal(DB.get(db, 'data/unknown'), undefined);
});

const React = require('../newtab/node_modules/react');
const { act, Simulate } = require('../newtab/node_modules/react-dom/test-utils');
const { createRoot } = require('../newtab/node_modules/react-dom/client');
function fixture() {
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://extension.test' }), w = dom.window;
  const previous = { window: global.window, document: global.document, flag: global.IS_REACT_ACT_ENVIRONMENT };
  global.window = w; global.document = w.document; global.IS_REACT_ACT_ENVIRONMENT = true;
  const modules = new Map();
  function load(file) {
    if (!path.extname(file)) file += fs.existsSync(file + '.ts') ? '.ts' : fs.existsSync(file + '.tsx') ? '.tsx' : '.js';
    if (file.endsWith('.json') || file.endsWith('.js')) return require(file);
    if (modules.has(file)) return modules.get(file);
    const exports = {}; modules.set(file, exports);
    vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true, target: ts.ScriptTarget.ES2020 } }).outputText, {
      exports, console, window: w, document: w.document, localStorage: w.localStorage,
      Blob, URL: w.URL, crypto: require('node:crypto').webcrypto,
      require(name) {
        if (name === 'react') return React;
        if (name === 'react-error-boundary') return require('../newtab/node_modules/react-error-boundary');
        if (/\.(css|sass)$/.test(name)) return {};
        if (name.startsWith('.')) return load(path.resolve(path.dirname(file), name));
        throw Error(name);
      }
    }, { filename: file });
    return exports;
  }
  const dbApi = load(path.join(root, 'newtab/engine/database.ts')), db = dbApi.init(defaults('en')), cacheDb = dbApi.init();
  const Editor = load(path.join(root, 'newtab/editor/Editor.tsx')).default;
  let pending = 0, closed = 0; const captured = [];
  function Panel(api) { captured.push(api); React.useEffect(() => { api.loader.push(); return () => api.loader.pop(); }, [api.loader]); return React.createElement('div', { className: 'provider-settings' }, 'provider settings'); }
  const catalog = load(path.join(root, 'newtab/engine/catalog.ts')).createCatalog(bindings({ dashboardComponent: () => null, settingsComponent: Panel }), text => dbApi.get(db, 'locale') === 'pt-BR' ? ({ Notes: 'Anotações', Background: 'Fundo', Settings: 'Configurações', 'Add a new widget': 'Adicionar widget' }[text] || text) : text);
  const props = { db, cache: cacheDb, catalog,
    t: text => dbApi.get(db, 'locale') === 'pt-BR' ? ({ Background: 'Fundo', Settings: 'Configurações', 'Add a new widget': 'Adicionar widget' }[text] || text) : text,
    ui: load(path.join(root, 'newtab/src/ui/index.tsx')),
    toggleSettings: () => closed++, pushLoader: () => pending++, popLoader: () => pending--,
    confirm: async () => false, Logo: () => React.createElement('h1', null, 'Super Extensão'),
    TimeZoneInput: ({ timeZone, onChange }) => React.createElement('input', { className: 'time-zone', value: timeZone || '', onChange: e => onChange(e.target.value || null) }),
    Failure: () => React.createElement('span', null, 'failed'), Icon: ({ name }) => React.createElement('span', null, name),
    IconButton: ({ primary, children, ...props }) => React.createElement('button', props, children) };
  const renderer = createRoot(w.document.getElementById('root'));
  return { dom, props, db, DB: dbApi, cacheDb, captured, pending: () => pending, closed: () => closed,
    async mount() { await act(async () => renderer.render(React.createElement(React.StrictMode, null, React.createElement(Editor, props)))); },
    async unmount() { await act(async () => renderer.unmount()); },
    async dispose() { await act(async () => renderer.unmount()); dom.window.close(); global.window = previous.window; global.document = previous.document; global.IS_REACT_ACT_ENVIRONMENT = previous.flag; },
  };
}
function button(text, within = document) { const el = Array.from(within.querySelectorAll('button')).find(x => x.textContent === text || x.title === text); assert.ok(el, 'button: ' + text); return el; }
function widgetCards() { return Array.from(document.querySelectorAll('fieldset.ui-editor')); }
function selectWidget() { return Array.from(document.querySelectorAll('select')).find(x => x.querySelector('option[value="widget/notes"]')); }
test('own editor adds, reorders, configures and removes widgets with immediate configuration updates and live language', async () => {
  const f = fixture();
  try {
    await f.mount(); assert.equal(widgetCards().length, 2);
    await act(async () => Simulate.change(selectWidget(), { target: { value: 'widget/notes' } }));
    assert.equal(widgetCards().length, 3);
    const notes = Array.from(f.db.cache.values()).find(x => x?.key === 'widget/notes'); assert.ok(notes);
    let card = widgetCards().find(x => x.getAttribute('aria-label') === 'Notes');
    await act(async () => Simulate.click(button('Edit widget settings', card)));
    assert.match(card.textContent, /provider settings/);
    await act(async () => Simulate.click(button('Move widget up', card)));
    assert.equal(widgetCards()[1].getAttribute('aria-label'), 'Notes');
    await act(async () => { const section = card.querySelectorAll("details")[1]; section.open = true; Simulate.toggle(section); });
    const font = card.querySelector('input[type="text"]');
    await act(async () => Simulate.change(font, { target: { value: 'monospace' } }));
    assert.equal(f.DB.get(f.db, 'widget/' + notes.id).display.fontFamily, 'monospace');
    const oldApi = f.captured.at(-1);
    await act(async () => f.DB.put(f.db, 'locale', 'pt-BR'));
    card = widgetCards().find(x => x.getAttribute('aria-label') === 'Anotações'); assert.ok(card);
    assert.match(document.body.textContent, /Fundo/); assert.match(selectWidget().textContent, /Adicionar widget/);
    await act(async () => Simulate.click(button('Remove widget', card)));
    oldApi.setData({ resurrected: true }); assert.equal(f.DB.get(f.db, 'data/' + notes.id), undefined);
    await act(async () => f.DB.put(f.db, 'widget/unknown', { id: 'unknown', key: 'widget/unknown', order: 10, display: { position: 'topLeft' } }));
    const unknown = widgetCards().find(x => x.getAttribute('aria-label') === 'widget/unknown'); assert.ok(unknown);
    await act(async () => Simulate.click(button('Remove widget', unknown)));
    const background = Array.from(document.querySelectorAll('select')).find(x => x.querySelector('option[value="background/image"]'));
    await act(async () => Simulate.change(background, { target: { value: 'background/image' } }));
    assert.equal(f.DB.get(f.db, 'background').key, 'background/image');
    await act(async () => document.dispatchEvent(new f.dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    assert.equal(f.closed(), 1);
    await f.unmount(); assert.equal(f.pending(), 0); assert.equal(f.db.listeners.size, 0); assert.equal(f.cacheDb.listeners.size, 0);
  } finally { await f.dispose(); }
});

test('closing the editor invalidates pending import and reset confirmation without overwriting current settings', async () => {
  const f = fixture(); let resolveFile, resolveConfirm;
  f.props.confirm = () => new Promise(resolve => { resolveConfirm = resolve; });
  f.dom.window.HTMLInputElement.prototype.click = function() {};
  try {
    await f.mount();
    await act(async () => f.DB.put(f.db, 'data/default-time', { keep: true }));
    await act(async () => Simulate.click(button('reset')));
    await f.unmount(); await act(async () => resolveConfirm(true));
    assert.equal(f.DB.get(f.db, "data/default-time").keep, true);
    // Use a fresh mount for the asynchronous file read.
  } finally { await f.dispose(); }
  const g = fixture(); g.dom.window.HTMLInputElement.prototype.click = function() {};
  try {
    await g.mount(); await act(async () => g.DB.put(g.db, 'data/default-time', { keep: true }));
    await act(async () => Simulate.click(button('Import')));
    const input = document.querySelector('input[type="file"]'); assert.ok(input);
    Object.defineProperty(input, 'files', { value: [{ text: () => new Promise(resolve => { resolveFile = resolve; }) }] });
    await act(async () => input.dispatchEvent(new g.dom.window.Event('change')));
    await g.unmount();
    await act(async () => resolveFile(JSON.stringify({ version: 3, background: { id: 'replaced', key: 'background/colour', display: {} } })));
    assert.equal(g.DB.get(g.db, 'data/default-time').keep, true); assert.equal(g.DB.get(g.db, 'background').id, 'default-gradient');
  } finally { await g.dispose(); }
});

test('editor exports compatible JSON and rejects invalid imports before replacing settings', async () => {
  const f = fixture(); let exported, revoked, download;
  f.dom.window.URL.createObjectURL = blob => { exported = blob; return 'blob:test'; };
  f.dom.window.URL.revokeObjectURL = url => { revoked = url; };
  f.dom.window.HTMLAnchorElement.prototype.click = function() { download = this.download; };
  f.dom.window.HTMLInputElement.prototype.click = function() {};
  async function importFile(value) {
    await act(async () => Simulate.click(button('Import')));
    const input = document.querySelector('input[type="file"]');
    Object.defineProperty(input, 'files', { value: [{ text: async () => JSON.stringify(value) }] });
    await act(async () => input.dispatchEvent(new f.dom.window.Event('change')));
  }
  try {
    await f.mount(); await act(async () => f.DB.put(f.db, 'data/default-time', { keep: true }));
    await act(async () => Simulate.click(button('export')));
    const backup = JSON.parse(await exported.text());
    assert.equal(backup.version, 3); assert.equal(backup['data/default-time'].keep, true);
    assert.equal(download, 'tabliss.json'); assert.equal(revoked, 'blob:test');
    await importFile({ ...backup, version: 999 });
    assert.match(document.querySelector('[role="alert"]').textContent, /Invalid import file/);
    assert.equal(f.DB.get(f.db, 'data/default-time').keep, true);
    const restored = { ...backup, 'data/default-time': { restored: true } };
    await importFile(restored); assert.equal(f.DB.get(f.db, 'data/default-time').restored, true);
    // A declined reset leaves the now-imported configuration intact.
    await act(async () => Simulate.click(button('reset')));
    assert.equal(f.DB.get(f.db, 'data/default-time').restored, true);
  } finally { await f.dispose(); }
});
