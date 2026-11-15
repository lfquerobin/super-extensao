const {test} = require('node:test');
const assert = require('node:assert/strict');
const {createAutoSave} = require('../ui/autosave.js');
const turn = () => new Promise(resolve => setImmediate(resolve));

test('autosave serializes writes, snapshots changes and persists the latest value', async () => {
  const writes = [], states = [];
  let release;
  const saver = createAutoSave({write: async value => {
    writes.push(value);
    if (writes.length === 1) await new Promise(resolve => {release = resolve;});
  }, onState: state => states.push({...state})});
  const value = {password: 'first', enabled: true};
  saver.set(value); await turn();
  value.password = 'second'; saver.set(value);
  value.password = 'last'; saver.set(value);
  value.password = 'unsent';
  assert.deepEqual(writes, [{password: 'first', enabled: true}]);
  assert.equal(states.at(-1).saving, true);
  release(); await saver.flush();
  assert.deepEqual(writes.map(item => item.password), ['first', 'last']);
  assert.equal(states.at(-1).value.password, 'last');
  assert.equal(states.at(-1).saving, false);
});

test('autosave reports a failed write and retry preserves the same configuration', async () => {
  let fail = true, persisted;
  const states = [];
  const saver = createAutoSave({write: async value => {
    if (fail) throw Error('storage unavailable');
    persisted = value;
  }, onState: state => states.push({...state})});
  await saver.set({mode: 'exclude'});
  assert.ok(saver.error);assert.equal(states.at(-1).saving, false);assert.equal(persisted, undefined);
  fail = false; await saver.retry();
  assert.equal(saver.error, null);assert.deepEqual(persisted, {mode: 'exclude'});
});

test('a failed older autosave cannot prevent the newer configuration from being written', async () => {
  let reject, persisted;
  const saver = createAutoSave({write: async value => {
    if (value.version === 1) await new Promise((_resolve, failure) => {reject = failure;});
    else persisted = value;
  }});
  saver.set({version: 1});await turn();
  saver.set({version: 2});reject(Error('old failure'));await saver.flush();
  assert.equal(saver.error, null);assert.deepEqual(persisted, {version: 2});
});

test('autosave preserves an edit queued by its completion callback', async () => {
  const writes = [];let changed = false;
  const saver = createAutoSave({write: async value => {writes.push(value);}, onState: state => {
    if (!state.saving && !changed) {changed = true;saver.set({version: 2});}
  }});
  await saver.set({version: 1});await saver.flush();
  assert.deepEqual(writes, [{version: 1}, {version: 2}]);
});
