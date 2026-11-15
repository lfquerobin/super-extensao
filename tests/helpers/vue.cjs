const fs = require("node:fs"), path = require("node:path"), ts = require("typescript");
const { JSDOM } = require("jsdom");
module.exports = function fixture() {
  const root = path.resolve(__dirname, "../..");
  const dom = new JSDOM('<button id="opener">Open</button><div id="app"></div>', { runScripts: "outside-only", pretendToBeVisual: true });
  const w = dom.window, modules = new Map(), apps = [];
  w.eval(fs.readFileSync(path.join(root, "sync/node_modules/vue/dist/vue.global.prod.js"), "utf8"));
  function load(file) {
    file = path.resolve(file);
    if (modules.has(file)) return modules.get(file);
    if (file.endsWith(".json")) return require(file);
    const module = { exports: {} }; modules.set(file, module.exports);
    const code = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
    new w.Function("require", "module", "exports", code)(id => id === "vue" ? w.Vue : load(path.resolve(path.dirname(file), path.extname(id) ? id : id + ".js")), module, module.exports);
    return module.exports;
  }
  function mount(component, controls = false) {
    const app = w.Vue.createApp(component); load(path.join(root, "ui/vue.js")).installUi(app);
    if (controls) load(path.join(root, "ui/vue-validated.js")).installEngineUi(app);
    apps.push(app); return app.mount("#app");
  }
  return { dom, w, Vue: w.Vue, load, mount, close() { apps.forEach(app => app.unmount()); dom.window.close(); } };
};
