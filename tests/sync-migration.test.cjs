const { test } = require("node:test"), assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path");
const root = path.resolve(__dirname, "..");
const json = file => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
test("sync ships Vue 3 and no Vuex, Vuetify or Vue 2 compatibility package", () => {
  const current = json("sync/package.json"), legacy = json("vendor/floccus-source/package.json");
  assert.match(current.dependencies.vue, /^3\./);
  assert.match(current.dependencies["vue-router"], /^4\./);
  assert.equal(current.dependencies.vue, current.devDependencies["@vue/compiler-sfc"]);
  for (const file of ["sync/package-lock.json", "vendor/floccus-source/package-lock.json"]) {
    const packages = json(file).packages;
    for (const [name, data] of Object.entries(packages)) {
      assert.ok(!/(?:^|\/)node_modules\/(?:vuetify|vuex|vue-template-compiler|@vue\/compat)(?:\/|$)/.test(name), name);
      if (name.endsWith("node_modules/vue")) assert.match(data.version, /^3\./);
    }
  }
  for (const name of ["vue", "vuex", "vuetify", "vuelidate", "vuex-router-sync"]) assert.equal(legacy.dependencies[name], undefined);
  const code = fs.readFileSync(path.join(root, "sync/js/options.js"), "utf8");
  assert.ok(code.includes(current.dependencies.vue));
  assert.doesNotMatch(code, /vuetify|vuex|2\.7\.16/i);
});
test("newtab no longer installs or bundles the disabled Sentry client", () => {
  const packages = json("newtab/package-lock.json").packages;
  assert.ok(!Object.keys(packages).some(name => /node_modules\/@sentry\//.test(name)));
  assert.doesNotMatch(fs.readFileSync(path.join(root, "newtab/main.js"), "utf8"), /SENTRY_RELEASE|sentry\.io|captureException/);
  assert.match(fs.readFileSync(path.join(root, "newtab/src/views/shared/Plugin.tsx"), "utf8"), /FallbackComponent: Crashed/);
});
test("sync framework and font notices match the locked dependency versions and preserve full license texts", () => {
  const expected = require("../scripts/sync-licenses.cjs").syncNotices();
  assert.equal(fs.readFileSync(path.join(root, "sync/THIRD-PARTY-NOTICES.txt"), "utf8"), expected);
  assert.match(expected, /vue@3\./); assert.match(expected, /@mdi\/font@7\./);
  assert.match(expected, /Permission is hereby granted/); assert.match(expected, /vue-devtools\/v6\.6\.4\/LICENSE/);
});
