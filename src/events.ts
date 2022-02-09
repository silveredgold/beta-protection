import { MSG_PLACEHOLDERS_AVAILABLE, MSG_PLACEHOLDERS_ENABLED } from "./messaging/placeholders";
import { idUrlMap, MSG_CENSOR_REQUEST, MSG_GET_STATISTICS, MSG_INJECT_CSS, MSG_RESET_STATISTICS, MSG_STATUS } from "./messaging/util";
import { loadPreferencesFromStorage, toRaw } from "./preferences";
import { WebSocketClient } from "./transport/webSocketClient";
import { getExtensionVersion } from "./util";

export const CMENU_REDO_CENSOR = "BSNG_REDO_CENSOR";
export const CMENU_ENABLE_ONCE = "BP_FORCE_RUN";
export const CMENU_RECHECK_PAGE = "BP_RECHECK_PAGE";



const knownMessages = [MSG_PLACEHOLDERS_AVAILABLE, MSG_PLACEHOLDERS_ENABLED, MSG_CENSOR_REQUEST, MSG_GET_STATISTICS, MSG_RESET_STATISTICS, MSG_INJECT_CSS, MSG_STATUS];

export function processContextClick(info: chrome.contextMenus.OnClickData, tab: chrome.tabs.Tab|undefined, client: WebSocketClient) {
    let eVersion = getExtensionVersion();
    console.log('prcessing context click event', info, tab);
    if (tab && info.menuItemId === CMENU_REDO_CENSOR) {
        chrome.tabs.sendMessage(tab.id!, {msg: "getClickedEl"}, function(value) {
            if (value.id) {
                let id = value.id;
                loadPreferencesFromStorage().then(prefs => {
                    client.sendObj({
                        version: eVersion,
                        msg: "redoCensor",
                        url: value.origSrc,
                        tabid: tab.id,
                        id: id,
                        priority: 1,
                        preferences: toRaw(prefs),
                        type: "normal",
                        domain: value.domain
                    });
                });
            }
        });
    } else if (tab && info.menuItemId == CMENU_ENABLE_ONCE) {
        chrome.tabs.sendMessage(tab.id!, {msg: "enableOnPage"});
    } else if (tab && info.menuItemId === CMENU_RECHECK_PAGE) {
        chrome.tabs.sendMessage(tab.id!, {msg: "recheckPage"});
    }
}

export type MessageContext = {
    socketClient: WebSocketClient,
    version: string;
};

export async function processMessage(message: any, sender: chrome.runtime.MessageSender, sendResponse: ((response: any) => void)|undefined, ctxFactory: () => Promise<MessageContext>) {
    console.log('background processing msg', message);
    let msgHandlerFound = false;
    let ctx: MessageContext;
    for (const msg of knownMessages) {
        if (message.msg === msg.event) {
            msgHandlerFound = true;
            ctx ??= await ctxFactory();
            console.debug('found matching event handler', msg);
            let result = await msg.handler(message, sender, ctx);
            sendResponse?.(result);
        }
    }
    if (!msgHandlerFound) {
        console.warn('did not find a known message handler, unknown runtime message', message, sender);
    }
}

export function onTabChange(tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab, socketClient: WebSocketClient) {
    if (changeInfo.url) {
        cancelRequestsForId(tabId, socketClient);
    }
}

export function cancelRequestsForId(tabId: number, socketClient: WebSocketClient) {
    socketClient.sendObj({
        version: getExtensionVersion(),
        msg: "cancelRequests",
        tabid: tabId
    });
}

