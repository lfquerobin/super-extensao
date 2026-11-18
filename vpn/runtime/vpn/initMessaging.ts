import { isAccountUrl } from "../../engine/login";
import { routeMessage } from "../messaging/messaging";
import { RefreshTokenError } from "../account/RefreshTokenError";
import { logOut } from "../state";
import { createSession } from "../account/createSession";
import { BackgroundAction } from "../messaging/MessageType";
import type { ForkMessage, MessageBase } from "../messaging/Message";
import { forkSession } from "../messaging/forkSession";
import { executeOnTab } from "../tools/executeOnTab";
import { getPartnerById } from "../account/partner/partners";
import { delay } from "../tools/delay";
import { getRuntime } from "../tools/getRuntime";
import { handleAccountFork } from "./handleAccountFork";
import Tab = browser.tabs.Tab;

type WorkerExternalMessage = MessageBase &
	(
		| {
				type: undefined;
		  }
		| ForkMessage
	);

const getMessageResponse = async (message: any) => {
	try {
		const result = await routeMessage(message);
		return { received: true, success: !result?.error, result };
	} catch (error) {
		if (error instanceof RefreshTokenError) {
			logOut(false);
			await createSession();
		}
		return failedResponse(error);
	}
};

const failedResponse = (error: unknown) => ({
	received: true,
	success: false,
	result: {
		error:
			error instanceof Error ? { ...error, message: error.message } : error,
	},
});

export const initMessaging = () => {
	const runtime = getRuntime();

	const receiveMessage = (message: any, sender: browser.runtime.MessageSender, sendResponse: (response: any) => void) => {
		if (message?.channel !== "super-vpn" || message.respondTo === "none")
			return undefined;
		const senderUrl = sender.url || sender.tab?.url || "";
		const fromAccount = isAccountUrl(senderUrl);
		const internal = senderUrl.startsWith(runtime.getURL(""));
		if (message.type === BackgroundAction.FORK ? !fromAccount : !internal)
			return undefined;
		if (message.type === BackgroundAction.FORK) {
			void handleAccountFork(message).then(sendResponse, () =>
				sendResponse({
					handled: true,
					response: {
						type: "error",
						payload: { message: "VpnOperationPending" },
					},
				}),
			);
		} else {
			void getMessageResponse(message).then(sendResponse, (error) =>
				sendResponse(failedResponse(error)),
			);
		}

		return true;
	};

  if ((globalThis as any).SuperModuleHost) (globalThis as any).SuperModuleHost.message('vpn', receiveMessage);
  else runtime?.onMessage.addListener(receiveMessage);

	/**
	 * Consumes a session fork request and sends response
	 * to sender (account app) - to see full data flow :
	 * `applications/account/src/app/content/PublicApp.tsx`
	 */
	const receiveExternal = async (request: WorkerExternalMessage, sender: browser.runtime.MessageSender) => {
			if (
				request.type === BackgroundAction.FORK &&
				isAccountUrl(sender.url || sender.tab?.url)
			) {
				const response = await forkSession(request);

				const welcomePage = response?.partnerId
					? getPartnerById(response.partnerId)?.welcomePage
					: undefined;

				if (welcomePage) {
					await executeOnTab(
						(sender.tab as Tab).id as number,
						() => ({
							func(welcomePage: string) {
								location.href = welcomePage;
							},
							args: [welcomePage] as [string],
						}),
						() => `location.href = ${JSON.stringify(welcomePage)};`,
					);
					// Wait a bit to let the page load
					// But in case it's too slow, we'll still show the Proton success
					// So to let user know they can start using the extension
					await delay(500);
				}

				return response;
			}

			return;
		};
  if ((globalThis as any).SuperModuleHost) (globalThis as any).SuperModuleHost.external(receiveExternal);
  else runtime?.onMessageExternal.addListener(receiveExternal);
};
