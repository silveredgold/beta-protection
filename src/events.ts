import { loadPreferencesFromStorage, toRaw } from "./preferences";
import { IPreferences } from "./preferences/types";
import { WebSocketClient } from "./transport/webSocketClient";
import { getExtensionVersion } from "./util";

export const REDO_CENSOR = "BSNG_REDO_CENSOR";

let idUrlMap = new Map();

export function processContextClick(info: chrome.contextMenus.OnClickData, tab: chrome.tabs.Tab|undefined, client: WebSocketClient) {
    let eVersion = getExtensionVersion();
    console.log('prcessing context click event', info, tab);
    if (tab && info.menuItemId === REDO_CENSOR) {
        chrome.tabs.sendMessage(tab.id!, {msg: "getClickedEl"}, function(value) {
            if (value.id) {
                let id = value.id;
                let img;
                    if(idUrlMap.has(id)){
                        img = idUrlMap.get(id);
                    } else {
                        img = value.src;
                        idUrlMap.set(id, value.src);
                    }
                    let preferences = loadPreferencesFromStorage().then(prefs => {
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

export async function processMessage(message: any, sender: chrome.runtime.MessageSender, socketClient: WebSocketClient) {
    let version = getExtensionVersion();
    console.log('background processing msg', message);
    if(message.msg === "getStatistics"){
        socketClient.send(JSON.stringify({
            version: version,
            msg: "getStatistics"
        }));
    }
    if(message.msg === "resetStatistics"){
        socketClient.send(JSON.stringify({
            version: version,
            msg: "resetStatistics"
        }));
    }
    if(message.msg === "censorRequest") {
        let img = String(message.imageURL);
        idUrlMap.set(message.id, img);
        let preferences: IPreferences;
        if (message.prefs !== undefined) {
            preferences = message.prefs as IPreferences;
        } else {
            preferences = await loadPreferencesFromStorage();
        }
        let requestType = "censorImage";
        if (preferences.autoAnimate) {
            requestType = "redoCensor";
        }
        let rawPrefs = toRaw(preferences);
        /*console.log(`prefs as sent:`, preferences);
        console.log(`raw prefs sent`, rawPrefs); */
        socketClient.send(JSON.stringify({
            version: version,
            msg: requestType,
            url: img,
            tabid: sender.tab!.id,
            id: message.id,
            priority: message.priority,
            preferences: rawPrefs,
            type: message.type,
            domain: message.domain
        }));
    }
}

export function onTabChange(tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab, socketClient: WebSocketClient) {
    if (changeInfo.url) {
        // chrome.storage.local.get("logs", function(list) {
        //     let logs = list["logs"];
        //     if(logs === undefined){
        //         logs = [];
        //     }
        //     logs.push(changeInfo.url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").toLowerCase());
        //     if(logs.length > 50) {
        //         logs.shift();
        //     }
        //     let obj = {}
        //     obj["logs"] = logs;
        //     chrome.storage.local.set(obj);
        // });
        //TODO: what are these logs for?

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