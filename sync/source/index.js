/* SPDX-License-Identifier: MPL-2.0 */
import {read} from "../../modules.js";
import { createApp } from "vue";
import capacitor from "./plugins/capacitor";
import App from "./App";
import { router } from "./router";
import store from "./store";
import i18nPlugin, { setupDirection } from "./plugins/i18n";
import { i18n } from "@sync-engine/native/I18n";
import "@mdi/font/css/materialdesignicons.css";
import { installUi } from "../../ui/vue";
import { installEngineUi } from "./components/ui/engine";
import "../../ui/vue.css";

async function mountSync() {
  const mount = document.getElementById("syncApp") || document.getElementById("app");
  if (!mount) return;
  if (!(await read()).sync) {mount.textContent = 'Sincronização desativada. Ative em Módulos.';return;}
  i18n.setLocales([await globalThis.SuperPreferences.locale.get()]);
  await i18n.load();
  setupDirection();
  const app = createApp(App);
  app.use(installUi); app.use(installEngineUi);
  app.mixin(i18nPlugin); app.mixin(capacitor);
  app.use(store); app.use(router);
  await router.isReady();
  window.superSyncApp = app.mount(mount);
  window.superSyncUnmount = () => { app.unmount(); delete window.superSyncApp; };
}
mountSync().catch(error => console.error("Super Sync: initialization failed", error));
