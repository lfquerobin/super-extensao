/* Public module preferences. Missing keys preserve the existing installation. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SuperModules = api;
})(globalThis, function () {
  const ids = Object.freeze(['cleanup', 'autoplay', 'tabs', 'sync', 'vpn', 'newtab']);
  const key = id => 'superModules:' + id;
  const defaults = () => Object.fromEntries(ids.map(id => [key(id), true]));
  function normalize(values) {
    return Object.fromEntries(ids.map(id => [id, values[key(id)] === undefined || values[key(id)] === true]));
  }
  async function read(api = globalThis.chrome) {
    return normalize(await api.storage.local.get(defaults()));
  }
  return {ids, key, defaults, normalize, read};
});
