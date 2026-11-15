/* The dashboard bundle is never evaluated when the module is off. */
(() => {
  function script(src) {
    return new Promise((resolve,reject) => {
      const element = document.createElement('script');element.src = src;
      element.onload = resolve;element.onerror = reject;document.head.append(element);
    });
  }
  function css(href) {const element = document.createElement('link');element.rel='stylesheet';element.href=href;document.head.append(element);}
  async function load() {
    const button = document.getElementById('super-settings');
    button.addEventListener('click', () => chrome.runtime.openOptionsPage());
    const state = await SuperModules.read();
    if (!state.newtab) {
      css('../ui-theme.css');css('../ui-components.css');css('integration.css');
      document.body.style.margin = '0';
      document.documentElement.style.background = 'var(--bg)';
      const root = document.getElementById('root');
      root.style.cssText='min-height:100vh;background:var(--bg);color:var(--text)';
      document.documentElement.dataset.superTheme = 'dark';
      SuperPreferences.bindTheme(document.documentElement);
      return;
    }
    // Integration installs the normal settings button handler when enabled.
    const copy = button.cloneNode(true);button.replaceWith(copy);
    css('main.css');css('integration.css');
    await script('polyfills.js');await script('main.js');await script('integration.js');
  }
  chrome.storage.onChanged.addListener((changes,area) => {
    if (area === 'local' && changes[SuperModules.key('newtab')]) location.reload();
  });
  load().catch(() => {
    document.getElementById('root').textContent = 'Não foi possível carregar a Nova guia. Recarregue a página.';
  });
})();
