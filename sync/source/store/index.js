/* SPDX-License-Identifier: MPL-2.0 */
import { reactive } from "vue";
import { mutationsDefinition } from "./mutations";
import { actionsDefinition } from "./actions";
const state = reactive({ locked: false, accounts: {}, loginFlow: { isRunning: false }, loading: { accounts: true } });
const store = {
  state,
  commit(type, payload) {
    if (!mutationsDefinition[type]) throw Error("Unknown sync mutation: " + type);
    return mutationsDefinition[type](state, payload);
  },
  async dispatch(type, payload) {
    if (!actionsDefinition[type]) throw Error("Unknown sync action: " + type);
    return actionsDefinition[type](store, payload);
  },
  install(app) { app.config.globalProperties.$store = store; },
};
export default store;
