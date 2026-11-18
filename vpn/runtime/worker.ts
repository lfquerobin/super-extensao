"use background";
// SPDX-License-Identifier: GPL-3.0-only

import { emitPrivacyWarning } from "./notifications/privacyWarning";
import {
	connectionLifecycle,
	disconnect,
	getCurrentStateIfDefined,
	isCurrentStateConnected,
	privacyFault,
} from "./state";
import { nativeStorage } from "./tools/nativeStorage";
import { getFixedServerConfig, setProxyToWaiterHost } from "./tools/proxy";
import { initSentry, handleError } from "./tools/sentry";
import { setupHandleProxyRequest } from "./tools/setupHandleProxyRequest";
import { fetchTranslations } from "./tools/translate";
import { triggerPromise } from "./tools/triggerPromise";
import { connectedServer } from "./vpn/connectedServer";
import { initAuthInterceptor } from "./vpn/initAuthInterceptor";
import { initFocusWatcher } from "./vpn/initFocusWatcher";
import { initIdleWatcher } from "./vpn/initIdleWatcher";
import { initMessaging } from "./vpn/initMessaging";
import { initPrivacyWatchers } from "./vpn/initPrivacyWatchers";
import { initProxySettingsWatcher } from "./vpn/initProxySettingsWatcher";
import { initState, initStateRecovery } from "./vpn/initState";
import { bootstrapNetworkGuard, networkBlocked, networkGuard } from "./vpn/networkGuard";
import { privacyController } from "./webrtc/privacyController";
import { WebRTCState } from "./webrtc/state";

type WorkerHost = typeof globalThis & {
	SuperModuleHost?: {
		onStop(id: string, stop: (next: boolean) => Promise<void>): void;
	};
	SuperVpnIndicator?: {
		attach(read: () => {
			blocked: boolean;
			connected: boolean;
			connectionRevision: ReturnType<typeof connectionLifecycle.capture>;
			bypassList: string[];
			includeOnly?: string[];
		}): void;
	};
};

async function restoreConnection(): Promise<void> {
	const current = connectionLifecycle.guard();
	try {
		await bootstrapNetworkGuard();
		if ((await networkGuard.status()).blocked) emitPrivacyWarning();
		if ((await connectedServer.get())?.value && current()) {
			await setProxyToWaiterHost(current);
		}
	} catch (error) {
		handleError(error);
		emitPrivacyWarning();
	}
	await initState();
}

function startVpnWorker(host: WorkerHost): void {
	host.SuperModuleHost?.onStop("vpn", async (next) => {
		if (next) return;
		await disconnect();
		await privacyController.apply(WebRTCState.CLEAR);
		await nativeStorage.remove("local", "superVpn:loginFlow");
	});

	initSentry();
	initStateRecovery();
	initAuthInterceptor();
	initMessaging();
	nativeStorage.watchFailures(privacyFault);
	initPrivacyWatchers();
	triggerPromise(restoreConnection());
	setupHandleProxyRequest();
	triggerPromise(fetchTranslations());
	initFocusWatcher();
	initProxySettingsWatcher();
	initIdleWatcher();

	host.SuperVpnIndicator?.attach(() => {
		const state = getCurrentStateIfDefined();
		const split = state?.data.server?.splitTunneling;
		const { bypassList, includeOnly } = getFixedServerConfig("", 0, split).rules;
		return {
			blocked: networkBlocked() || !!state?.data.blocked,
			connected: isCurrentStateConnected(),
			connectionRevision: connectionLifecycle.capture(),
			bypassList,
			includeOnly,
		};
	});
}

startVpnWorker(globalThis);
