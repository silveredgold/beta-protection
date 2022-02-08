import { MSG_PLACEHOLDERS_AVAILABLE, MSG_PLACEHOLDERS_ENABLED } from "./messaging/placeholders";
import { idUrlMap, MSG_CENSOR_REQUEST, MSG_GET_STATISTICS, MSG_RESET_STATISTICS } from "./messaging/util";
import { loadPreferencesFromStorage } from "./preferences";
import { WebSocketClient } from "./transport/webSocketClient";
import { getExtensionVersion } from "./util";

export const CMENU_REDO_CENSOR = "BSNG_REDO_CENSOR";



const knownMessages = [MSG_PLACEHOLDERS_AVAILABLE, MSG_PLACEHOLDERS_ENABLED, MSG_CENSOR_REQUEST, MSG_GET_STATISTICS, MSG_RESET_STATISTICS];

export function processContextClick(info: chrome.contextMenus.OnClickData, tab: chrome.tabs.Tab|undefined, client: WebSocketClient) {
    let eVersion = getExtensionVersion();
    console.log('prcessing context click event', info, tab);
    if (tab && info.menuItemId === CMENU_REDO_CENSOR) {
        chrome.tabs.sendMessage(tab.id!, {msg: "getClickedEl"}, function(value) {
            if (value.id) {
                let id = value.id;
                let img: string;
                    if(idUrlMap.has(id)){
                        img = idUrlMap.get(id);
                    } else {
                        img = value.src;
                        idUrlMap.set(id, value.src);
                    }
                    loadPreferencesFromStorage().then(prefs => {
                        client.sendObj({
                            version: eVersion,
                            msg: "redoCensor",
                            url: img,
                            tabid: tab.id,
                            id: id,
                            priority: 1,
                            preferences: prefs,
                            type: "normal"
                        });
                    });
            }
        });
    }
}

export type MessageContext = {
    socketClient: WebSocketClient,
    version: string;
};

export async function processMessage(message: any, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void, ctx: MessageContext) {
    console.log('background processing msg', message);
    for (const msg of knownMessages) {
        if (message.msg === msg.event) {
            let result = await msg.handler(message, sender, sendResponse, ctx);
            sendResponse?.(result);
        }
    }
    console.warn('did not find a known message handler, unknown runtime message', message, sender);
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

