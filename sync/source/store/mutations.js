/* SPDX-License-Identifier: MPL-2.0 */
import { mutations } from "./definitions";

export const mutationsDefinition = {
  [mutations.SET_LOCKED](state, locked) {
    state.locked = locked;
  },
  [mutations.LOAD_ACCOUNTS](state, accounts) {
    state.accounts = accounts;
  },
  [mutations.STORE_ACCOUNT_DATA](state, { id, data }) {
    state.accounts[id].data = data;
  },
  [mutations.REMOVE_ACCOUNT](state, id) {
    delete state.accounts[id];
  },
  [mutations.SET_LOGIN_FLOW_STATE](state, running) {
    state.loginFlow.isRunning = running;
  },
  [mutations.LOADING_START](state, label) {
    state.loading[label] = true;
  },
  [mutations.LOADING_END](state, label) {
    state.loading[label] = false;
  },
};
