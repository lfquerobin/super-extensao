/* SPDX-License-Identifier: GPL-3.0-only */
import {read} from "../../modules.js";
import { createEngine } from "./bridge";
import { mountVpn } from "./app";
const root = document.getElementById("vpnPanel");
if (root)
  globalThis.SuperVpnReady = read().then(modules => {
    if (!modules.vpn) {root.textContent = 'VPN desativada. Ative em Módulos.';return;}
    return mountVpn(root, createEngine(globalThis.SuperVpnBootstrap), globalThis.SuperPreferences);
  }).catch((error) => {
    root.textContent = String(
      error?.message || "Não foi possível carregar a VPN.",
    );
    root.setAttribute("role", "alert");
  });
