const { test } = require("node:test");
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const { JSDOM, VirtualConsole } = require("jsdom");
const root = path.resolve(__dirname, "..");
const tick = () => new Promise((resolve) => setTimeout(resolve, 30));
async function boot(initial = {}) {
  const warnings = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", (e) => warnings.push(e.message));
  vc.on("error", (e) => warnings.push(String(e)));
  const dom = new JSDOM(
    '<!doctype html><html><body><div id="syncPanel"><div id="syncApp"></div></div></body></html>',
    {
      url: "https://extension.test/popup.html",
      runScripts: "outside-only",
      pretendToBeVisual: true,
      virtualConsole: vc,
    }
  );
  const w = dom.window;
  const events = () => {
    const listeners = new Set();
    return {
      addListener(fn) {
        listeners.add(fn);
      },
      removeListener(fn) {
        listeners.delete(fn);
      },
      emit(...args) {
        listeners.forEach((fn) => fn(...args));
      },
    };
  };
  const changed = events(),
    messages = events();
  const local = { ...initial.local },
    sync = { ...initial.sync };
  const calls = [];
  const area = (state, name) => ({
    get(keys, cb) {
      let r;
      if (keys == null) r = { ...state };
      else if (typeof keys === "string") r = { [keys]: state[keys] };
      else if (Array.isArray(keys))
        r = Object.fromEntries(
          keys.filter((k) => k in state).map((k) => [k, state[k]])
        );
      else
        r = {
          ...keys,
          ...Object.fromEntries(
            Object.keys(keys)
              .filter((k) => k in state)
              .map((k) => [k, state[k]])
          ),
        };
      cb?.(r);
      return Promise.resolve(r);
    },
    set(data, cb) {
      const changes = {};
      for (const [k, v] of Object.entries(data)) {
        changes[k] = { oldValue: state[k], newValue: v };
        state[k] = v;
      }
      changed.emit(changes, name);
      cb?.();
      return Promise.resolve();
    },
    remove(keys, cb) {
      for (const k of [].concat(keys)) delete state[k];
      cb?.();
      return Promise.resolve();
    },
  });
  w.chrome = {
    runtime: {
      id: "test",
      getURL: (p) => "https://extension.test/" + p,
      onMessage: messages,
      sendMessage(data, cb) {
        calls.push(data);
        const response = {
          channel: "super-sync",
          type: data.type + "Response",
          params: [!initial.locked],
        };
        cb?.(response);
        return Promise.resolve(response);
      },
    },
    storage: {
      local: area(local, "local"),
      sync: area(sync, "sync"),
      onChanged: changed,
    },
    identity: { getRedirectURL: () => "https://test.chromiumapp.org/", launchWebAuthFlow(request, callback) { callback(initial.oauthFlow?.(request)); } },
    bookmarks: {
      get(ids, cb) {
        cb(
          []
            .concat(ids)
            .map((id) => ({
              id,
              title: id === "0" ? "" : "Favoritos",
              parentId: id === "0" ? undefined : "0",
              children: [],
            }))
        );
      },
      getTree(cb) {
        cb([
          {
            id: "0",
            title: "",
            children: [
              { id: "1", title: "Favoritos", parentId: "0", children: [] },
            ],
          },
        ]);
      },
    },
    tabs: {query(_options, callback) {callback([]);}},
    i18n: { getUILanguage: () => "pt-BR" },
    permissions: {
      contains(_options, callback) { callback(initial.permissionsGranted !== false); },
      request(_p, cb) {
        cb(true);
      },
    },
  };
  w.matchMedia = () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  });
  w.fetch = async () => ({ status: 207, ok: true, text: async () => "" });
  w.alert = (message) => warnings.push("alert: " + message);
  w.confirm = () => true;
  w.TextEncoder = TextEncoder;
  w.TextDecoder = TextDecoder;
  w.eval(fs.readFileSync(path.join(root, "preferences.js"), "utf8"));
  w.eval(fs.readFileSync(path.join(root, "sync/js/options.js"), "utf8"));

  await tick();
  const app = w.superSyncApp;
  const route = async (path) => {
    await app.$router.push(path);
    await tick();
  };
  const component = (name) => {
    function vnode(node) {
      if (!node) return;
      if (node.component) {
        if (node.component.type.name === name) return node.component.proxy;
        const child = vnode(node.component.subTree); if (child) return child;
      }
      if (Array.isArray(node.children)) for (const child of node.children) { const found = vnode(child); if (found) return found; }
    }
    return vnode(app.$.subTree);
  };
  return {
    w,
    local,
    sync,
    calls,
    warnings,
    app,
    route,
    component,
    close() {
      w.superSyncUnmount();
      w.close();
    },
  };
}
const profile = {
  type: "git",
  label: "Trabalho",
  url: "https://example.test/dav/",
  username: "test",
  password: "private-test",
  localRoot: "1",
  rootPath: "/Favoritos",
  bookmark_file: "bookmarks.xbel",
  bookmark_file_type: "xbel",
  enabled: true,
  failsafe: true,
  strategy: "default",
  syncInterval: 15,
  nestedSync: true,
};
test("sync interface navigates internally, switches language and isolates OAuth settings", async () => {
  const ui = await boot({
    local: { theme: "dark", excludedSites: ["example.com"] },
  });
  try {
    assert.match(ui.w.document.body.textContent, /Leve seus favoritos/);
    assert.equal(
      ui.w.document.querySelectorAll(".sync-navigation a").length,
      4
    );
    assert.equal(
      ui.w.document.querySelectorAll('a[target="_blank"]').length,
      0
    );
    await ui.route("/connections");
    const form = ui.component("Connections");
    form.oauth.googleClientId = "test-client";
    await form.save();
    assert.equal(
      ui.local["superSync:oauthClients"].googleClientId,
      "test-client"
    );
    assert.equal(ui.local.theme, "dark");
    assert.deepEqual(ui.local.excludedSites, ["example.com"]);
    await ui.route("/");
    await ui.route("/connections");
    assert.equal(
      ui.component("Connections").oauth.googleClientId,
      "test-client"
    );
    await ui.w.SuperPreferences.locale.set("en");
    await tick();
    assert.match(
      ui.w.document.body.textContent,
      /Save connection settings/
    );
    await ui.route("/new");
    assert.equal(ui.w.document.querySelectorAll(".sync-service").length, 2);
    const git = [...ui.w.document.querySelectorAll(".sync-service")].find(
      (el) => el.textContent.includes("Git")
    );
    git.click();
    await tick();
    assert.equal(ui.component("NewAccount").adapter, "git");
    assert.equal(git.getAttribute("aria-pressed"), "true");
    assert.deepEqual(ui.warnings, []);
  } finally {
    ui.close();
  }
});
test("existing profiles retain data, edits are drafts, backup selects profiles and directional sync confirms", async () => {
  const ui = await boot({
    local: { "superSync:accounts": JSON.stringify({ saved: profile }) },
  });
  try {
    assert.equal(ui.w.document.querySelectorAll(".sync-profile").length, 1);
    assert.match(ui.w.document.body.textContent, /Trabalho/);
    const card = ui.component("AccountCard");
    card.confirmDirection = "up";
    await tick();
    assert.ok(!ui.calls.some((c) => c.type === "syncAccount"));
    await card.runDirection();
    await tick();
    assert.ok(
      ui.calls.some(
        (c) =>
          c.type === "syncAccount" &&
          c.params[0] === "saved" &&
          c.params[1] === "overwrite"
      )
    );
    await ui.route("/options/saved");
    const options = ui.component("AccountOptions");
    options.data.label = "Rascunho";
    await tick();
    assert.equal(ui.app.$store.state.accounts.saved.data.label, "Trabalho");
    await ui.route("/");
    assert.match(ui.w.document.body.textContent, /Trabalho/);
    await ui.route("/options/saved");
    const second = ui.component("AccountOptions");
    second.data.label = "Atualizado";
    await second.onSave();
    assert.equal(
      JSON.parse(ui.local["superSync:accounts"]).saved.label,
      "Atualizado"
    );
    second.data.label = "Outro rascunho";
    await tick();
    assert.equal(ui.app.$store.state.accounts.saved.data.label, "Atualizado");
    await ui.route("/importexport");
    assert.equal(ui.component("ImportExport").selected.saved, true);
    assert.match(ui.w.document.body.textContent, /credenciais/);
    assert.deepEqual(ui.warnings, []);
  } finally {
    ui.close();
  }
});
test("Git wizard creates an engine-compatible profile", async () => {
  const ui = await boot();
  try {
    await ui.route("/new");
    const wizard = ui.component("NewAccount");
    Object.assign(wizard, {
      adapter: "git",
      label: "Pessoal",
      server: "https://example.test/dav/",
      username: "test",
      password: "test",
      localRoot: "1",
      currentStep: 2,
    });
    wizard.currentStep = 4;
    await wizard.onCreate();
    await tick();
    assert.equal(wizard.currentStep, 5);
    const profiles = JSON.parse(ui.local["superSync:accounts"]);
    const data = Object.values(profiles)[0];
    assert.equal(data.type, "git");
    assert.equal(data.localRoot, "1");
    assert.equal(data.label, "Pessoal");
    await ui.route("/");
    assert.equal(ui.w.document.querySelectorAll(".sync-profile").length, 1);
    assert.deepEqual(ui.warnings, []);
  } finally {
    ui.close();
  }
});
test("locked engine keeps profile and credential views hidden", async () => {
  const ui = await boot({
    locked: true,
    local: { "superSync:accounts": JSON.stringify({ saved: profile }) },
  });
  try {
    await ui.route("/connections");
    assert.ok(ui.w.document.querySelector(".sync-unlock"));
    assert.equal(ui.w.document.querySelector(".sync-connections"), null);
    assert.equal(ui.w.document.querySelector(".sync-profile"), null);
    assert.deepEqual(ui.warnings, []);
  } finally {
    ui.close();
  }
});

test("shared folder dialog preserves the current scope on cancel and saves only the selected folder", async () => {
  const ui = await boot({local:{"superSync:accounts":JSON.stringify({saved:profile})}});
  try {
    await ui.route("/options/saved");
    const folder = ui.component("OptionSyncFolder");
    assert.ok(folder);
    await folder.onTriggerFinder();await tick();
    const dialog = ui.w.document.querySelector('dialog[open]');
    assert.ok(dialog);assert.ok(dialog.querySelector('.ui-folder-tree'));
    assert.equal(dialog.querySelectorAll('input[type=radio]').length,2);
    folder.selectedLocalRoot='0';
    dialog.dispatchEvent(new ui.w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));await tick();
    assert.equal(folder.value,'1');assert.equal(dialog.open,false);
    await folder.onTriggerFinder();await tick();
    assert.equal(folder.selectedLocalRoot,'1');
    folder.selectedLocalRoot='0';folder.onSave();await tick();
    assert.equal(folder.finder,false);assert.equal(folder.value,'0');
    assert.deepEqual(ui.warnings,[]);
  } finally {ui.close();}
});

test("Google Drive options keep normal synchronization controls without the comparison panel", async () => {
  const google = { ...profile, type: "google-drive", password: "", refreshToken: "private-refresh" };
  const ui = await boot({ local: { "superSync:accounts": JSON.stringify({ saved: google }) } });
  try {
    await ui.route("/options/saved");
    assert.equal(ui.component("GoogleDriveComparison"), undefined);
    assert.equal(ui.w.document.querySelector(".sync-comparison"), null);
    assert.ok(!ui.w.document.body.textContent.includes("Comparar com Google Drive"));
    assert.ok(ui.component("OptionsGoogleDrive"));
    await ui.route("/");
    await ui.component("AccountCard").onTriggerSync();
    assert.ok(ui.calls.some(call => call.type === "syncAccount" && call.params[0] === "saved"));
  } finally { ui.close(); }
});


test("removed providers stay readable for backup but cannot be created, imported, edited or synced", async () => {
  const old = { ...profile, type: "webdav" };
  const ui = await boot({ local: { "superSync:accounts": JSON.stringify({ saved: old }), "superSync:oauthClients": { dropboxClientId: "preserve-old-key" } } });
  try {
    const card = ui.component("AccountCard");
    assert.equal(card.supported, false);
    assert.equal(card.status, "disabled");
    assert.match(ui.w.document.body.textContent, /serviço foi desativado/);
    assert.equal(ui.w.document.querySelector(".sync-advanced"), null);
    assert.equal(ui.w.document.querySelector(".sync-profile button[disabled]").disabled, true);
    await ui.route("/options/saved");
    assert.equal(ui.component("OptionsWebdav"), undefined);
    assert.equal(ui.w.document.querySelector(".sync-save-row"), null);
    assert.match(ui.w.document.body.textContent, /exportação ou remoção/);
    const before = ui.local["superSync:accounts"];
    await assert.rejects(() => ui.app.$store.dispatch("CREATE_ACCOUNT", old), /SyncProviderDisabled/);
    await assert.rejects(() => ui.app.$store.dispatch("IMPORT_ACCOUNTS", [profile, old]), /SyncProviderDisabled/);
    await assert.rejects(() => ui.app.$store.dispatch("STORE_ACCOUNT", { id: "saved", data: profile }), /SyncProviderDisabled/);
    assert.equal(ui.local["superSync:accounts"], before);
    await ui.route("/importexport");
    assert.equal(ui.component("ImportExport").selected.saved, true);
    await ui.route("/connections");
    assert.ok(!ui.w.document.body.textContent.includes("Dropbox"));
    await ui.component("Connections").save();
    assert.equal(ui.local["superSync:oauthClients"].dropboxClientId, "preserve-old-key");
    assert.equal(ui.local["superSync:accounts"], before);
    assert.deepEqual(ui.warnings, []);
  } finally { ui.close(); }
});


test("Vue 3 native fields keep string/boolean values and save Git credentials only after confirmation", async () => {
  const ui = await boot({ local: { "superSync:accounts": JSON.stringify({ saved: { ...profile, branch: "main", syncIntervalEnabled: true } }) } });
  try {
    await ui.route("/options/saved");
    const options = ui.component("AccountOptions");
    const secret = ui.w.document.querySelector('input[type="password"]');
    assert.equal(secret.value, profile.password);
    secret.value = "updated-private-test";secret.dispatchEvent(new ui.w.Event("input", { bubbles: true }));await tick();
    assert.equal(options.data.password, "updated-private-test");
    assert.equal(JSON.parse(ui.local["superSync:accounts"]).saved.password, profile.password);
    const auto = ui.component("OptionAutoSync").$el.querySelector('input[type="checkbox"]');
    auto.click();await tick();assert.equal(options.data.enabled, false);
    const failsafe = ui.component("OptionFailsafe").$el.querySelector('input[value="false"]');
    failsafe.click();await tick();assert.equal(options.data.failsafe, false);
    const direction = ui.component("OptionSyncStrategy").$el.querySelector('input[value="slave"]');
    direction.click();await tick();assert.equal(options.data.strategy, "slave");
    const interval = ui.component("OptionSyncInterval").$el.querySelector('input[type="range"]');
    interval.value="1";interval.dispatchEvent(new ui.w.Event("input", { bubbles:true }));await tick();assert.equal(options.data.syncInterval,10);
    await options.onSave();
    const saved=JSON.parse(ui.local["superSync:accounts"]).saved;
    assert.equal(saved.password,"updated-private-test");assert.equal(saved.enabled,false);assert.equal(saved.failsafe,false);assert.equal(saved.strategy,"slave");assert.equal(saved.syncInterval,10);
    assert.deepEqual(ui.warnings,[]);
  } finally { ui.close(); }
});

test("Google Drive encryption edits can be canceled without changing the stored profile or retaining the canceled draft", async () => {
  const original={...profile,type:"google-drive",password:"original-encryption",refreshToken:"private-refresh"};
  const ui=await boot({local:{"superSync:accounts":JSON.stringify({saved:original})}});
  try {
    await ui.route("/options/saved");const editor=ui.component("OptionPassphrase"),options=ui.component("AccountOptions");
    const click=text=>[...editor.$el.querySelectorAll("button")].find(button=>button.textContent.includes(editor.t(text))).click();
    click("LabelChange");await tick();let input=editor.$el.querySelector("input");input.value="discard-secret";input.dispatchEvent(new ui.w.Event("input",{bubbles:true}));await tick();
    click("LabelCancel");await tick();assert.equal(options.data.password,"original-encryption");assert.equal(editor.passphrase,"");
    click("LabelChange");await tick();input=editor.$el.querySelector("input");assert.equal(input.value,"");input.value="new-encryption";input.dispatchEvent(new ui.w.Event("input",{bubbles:true}));await tick();
    click("LabelSave");await tick();assert.equal(options.data.password,"new-encryption");assert.equal(editor.passphrase,"");
    assert.equal(JSON.parse(ui.local["superSync:accounts"]).saved.password,"original-encryption");
    await options.onSave();assert.equal(JSON.parse(ui.local["superSync:accounts"]).saved.password,"new-encryption");assert.deepEqual(ui.warnings,[]);
  } finally {ui.close();}
});


test("the migrated wizard keeps hash navigation and its backup shortcut", async () => {
 const ui=await boot();
 try {
  await ui.route("/new");
  const link=ui.w.document.querySelector('.form-buttons a[href="#/importexport"]');
  assert.ok(link);link.click();await tick();
  assert.equal(ui.app.$route.path,"/importexport");assert.ok(ui.component("ImportExport"));
  assert.deepEqual(ui.warnings,[]);
 } finally {ui.close();}
});


test("the Vue 3 backup view exports compatible profiles and imports Git without modifying existing credentials", async () => {
 const google={...profile,type:"google-drive",password:"encryption-secret",refreshToken:"private-refresh"};
 const ui=await boot({local:{"superSync:accounts":JSON.stringify({saved:profile,google})}});
 try {
  let blob,download;
  ui.w.URL.createObjectURL=value=>{blob=value;return "blob:test-backup";};ui.w.URL.revokeObjectURL=()=>{};
  ui.w.HTMLAnchorElement.prototype.click=function(){download=this.download;};
  await ui.route("/importexport");const backup=ui.component("ImportExport");
  await backup.onTriggerExport();
  const text=await new Promise((resolve,reject)=>{const reader=new ui.w.FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsText(blob);});
  const exported=JSON.parse(text);
  assert.equal(download,"super-extensao-sync.json");assert.equal(exported.length,2);
  assert.equal(exported.find(data=>data.type==="git").password,profile.password);
  assert.equal(exported.find(data=>data.type==="google-drive").refreshToken,null);
  assert.equal(JSON.parse(ui.local["superSync:accounts"]).google.refreshToken,"private-refresh");
  Object.defineProperty(backup.$refs.filePicker,"files",{configurable:true,value:[{text:async()=>JSON.stringify(exported.filter(data=>data.type==="git"))}]});
  await backup.onFileSelect();await tick();
  const current=JSON.parse(ui.local["superSync:accounts"]);
  assert.equal(Object.keys(current).length,3);assert.equal(current.saved.password,profile.password);assert.equal(current.google.refreshToken,"private-refresh");
  const imported=Object.entries(current).find(([id])=>id!=="saved"&&id!=="google")[1];assert.equal(imported.type,"git");assert.equal(imported.password,profile.password);
  assert.equal(ui.warnings.filter(message=>!message.startsWith("alert:")).length,0);
 } finally {ui.close();}
});


test("Google Drive login in the migrated view handles denial and applies synthetic OAuth credentials only to the draft", async () => {
 const original={...profile,type:"google-drive",password:"encryption-secret",refreshToken:"old-private-refresh"};
 const config={permissionsGranted:false,local:{"superSync:accounts":JSON.stringify({saved:original}),"superSync:oauthClients":{googleClientId:"test-client",googleClientSecret:"test-secret"}}};
 const ui=await boot(config);
 try {
  await ui.route("/options/saved");const drive=ui.component("OptionsGoogleDrive"),options=ui.component("AccountOptions");
  await drive.authenticate();await tick();assert.ok(drive.authError);assert.equal(drive.authenticating,false);assert.equal(options.data.refreshToken,"old-private-refresh");
  config.permissionsGranted=true;
  Object.defineProperty(ui.w.crypto,"subtle",{value:require("node:crypto").webcrypto.subtle});
  config.oauthFlow=request=>{const url=new URL(request.url);assert.equal(url.hostname,"accounts.google.com");assert.equal(url.searchParams.get("client_id"),"test-client");return "https://test.chromiumapp.org/?state="+url.searchParams.get("state")+"&code=synthetic-code";};
  const requests=[];ui.w.fetch=async url=>{requests.push(url);return {status:200,ok:true,json:async()=>url.includes("oauth2.googleapis.com")?{access_token:"synthetic-access",refresh_token:"new-private-refresh"}:{user:{displayName:"Synthetic Account"}}};};
  await drive.authenticate();await tick();
  assert.equal(drive.authError,"");assert.equal(drive.authenticating,false);assert.equal(requests.length,2);
  assert.equal(options.data.refreshToken,"new-private-refresh");assert.equal(options.data.username,"Synthetic Account");assert.equal(options.data.password,"encryption-secret");
  assert.equal(JSON.parse(ui.local["superSync:accounts"]).saved.refreshToken,"old-private-refresh");
  await options.onSave();const saved=JSON.parse(ui.local["superSync:accounts"]).saved;assert.equal(saved.refreshToken,"new-private-refresh");assert.equal(saved.password,"encryption-secret");assert.ok(!JSON.stringify(saved).includes("synthetic-access"));
  assert.deepEqual(ui.warnings,[]);
 } finally {ui.close();}
});
