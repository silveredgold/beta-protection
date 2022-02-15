import { MSG_CENSOR_REQUEST, MSG_GET_STATISTICS, MSG_INJECT_CSS, MSG_RESET_STATISTICS, MSG_STATUS, MSG_PLACEHOLDERS_AVAILABLE, MSG_PLACEHOLDERS_ENABLED, MSG_INJECT_SUBLIMINAL, MSG_IMAGE_DATA } from "./messaging";
import { loadPreferencesFromStorage, toRaw } from "./preferences";
import { WebSocketClient } from "./transport/webSocketClient";
import { getDomain, getExtensionVersion } from "./util";
import browser from 'webextension-polyfill';

export const CMENU_REDO_CENSOR = "BSNG_REDO_CENSOR";
export const CMENU_ENABLE_ONCE = "BP_FORCE_RUN";
export const CMENU_RECHECK_PAGE = "BP_RECHECK_PAGE";



const knownMessages = [MSG_PLACEHOLDERS_AVAILABLE, MSG_PLACEHOLDERS_ENABLED, MSG_CENSOR_REQUEST, MSG_GET_STATISTICS, MSG_RESET_STATISTICS, MSG_INJECT_CSS, MSG_INJECT_SUBLIMINAL, MSG_STATUS, MSG_IMAGE_DATA];

export function processContextClick(info: browser.Menus.OnClickData, tab: browser.Tabs.Tab|undefined, client: WebSocketClient) {
    const eVersion = getExtensionVersion();
    console.log('prcessing context click event', info, tab);
    if (tab && info.menuItemId === CMENU_REDO_CENSOR) {
        browser.tabs.sendMessage(tab.id!, {msg: CMENU_REDO_CENSOR}).then(value => {
            if (value.id) {
                loadPreferencesFromStorage().then(prefs => {
                    client.sendObj({
                        version: eVersion,
                        msg: "redoCensor",
                        url: value.origSrc,
                        tabid: tab.id,
                        id: value.id,
                        priority: 1,
                        preferences: toRaw(prefs),
                        type: "normal",
                        domain: getDomain(value.domain, prefs)
                    });
                });
            }
        });
    } else if (tab && info.menuItemId == CMENU_ENABLE_ONCE) {
        browser.tabs.sendMessage(tab.id!, {msg: "enableOnPage"});
    } else if (tab && info.menuItemId === CMENU_RECHECK_PAGE) {
        browser.tabs.sendMessage(tab.id!, {msg: CMENU_RECHECK_PAGE});
    }
}

export type MessageContext = {
    socketClient: WebSocketClient,
    version: string;
};

export async function processMessage(message: any, sender: browser.Runtime.MessageSender, ctxFactory: () => Promise<MessageContext>) {
    console.log('background processing msg', message, knownMessages.map(e => e.event));
    let msgHandlerFound = false;
    let ctx: MessageContext;
    for (const msg of knownMessages) {
        if (message.msg === msg.event) {
            msgHandlerFound = true;
            ctx ??= await ctxFactory();
            console.debug('found matching event handler', msg);
            const result = await msg.handler(message, sender, ctx);
            return result;
        }
    }
    if (!msgHandlerFound) {
        console.warn('did not find a known message handler, unknown runtime message', message, sender);
    }
}

export function cancelRequestsForId(tabId: number, socketClient: WebSocketClient) {
    socketClient.sendObj({
        version: getExtensionVersion(),
        msg: "cancelRequests",
        tabid: tabId
    });
}

