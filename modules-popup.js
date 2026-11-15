(() => {
  let values = {}, failed = false;
  const controls = () => [...document.querySelectorAll('[data-module]')];
  const status = document.getElementById('modulesStatus');
  const isEnabled = id => values[id] === true;
  function render() {
    for (const control of controls()) control.checked = isEnabled(control.dataset.module);
    for (const id of ['autoplay','tabs','sync','vpn']) document.getElementById('tab-'+id).hidden = !isEnabled(id);
    document.getElementById('section-cleanup').hidden = !isEnabled('cleanup');
  }
  function notice(key, kind = 'success') {
    status.textContent = SuperI18n.t(key);
    document.getElementById('modulesRetry').hidden = key !== 'uiModulesReadFailed';
    status.dataset.kind = kind;
    status.setAttribute('role',kind === 'error' ? 'alert' : 'status');
  }
  async function load() {
    controls().forEach(input => {input.disabled = true;});
    try {values = await SuperModules.read();failed = false;render();}
    catch {failed = true;render();notice('uiModulesReadFailed','error');}
    finally {controls().forEach(input => {input.disabled = failed;});}
  }
  const ui = globalThis.SuperModulesUI = {isEnabled, ready:load()};
  for (const input of controls()) input.addEventListener('change', async () => {
    const id = input.dataset.module, value = input.checked;
    controls().forEach(item => {item.disabled = true;});
    notice('uiModulesChanging','loading');
    try {
      const response = await chrome.runtime.sendMessage({action:'modules:set', id, value});
      if (!response?.ok) throw Error(response?.error);
      values = response.modules;render();notice('uiModulesApplied');
    } catch (error) {
      notice(error.message === 'ModuleSyncBusy' ? 'uiModulesSyncBusy' : 'uiModulesWriteFailed','error');
      render();controls().forEach(item => {item.disabled = false;});
    }
  });
  document.getElementById('modulesRetry').addEventListener('click', () => {ui.ready = load();});
  SuperI18n.ready.then(() => {
    if (!status.textContent) notice('uiModulesAutoSaved');
  });
  SuperI18n.watch(() => {if (!failed) notice('uiModulesAutoSaved');});
})();
