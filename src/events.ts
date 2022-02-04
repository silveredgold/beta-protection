import { WebSocketClient } from "./transport/webSocketClient";
import { getExtensionVersion } from "./util";

export const REDO_CENSOR = "BSNG_REDO_CENSOR";

let idUrlMap = new Map();

export function processContextClick(info: chrome.contextMenus.OnClickData, tab: chrome.tabs.Tab|undefined, client: WebSocketClient) {
    let eVersion = getExtensionVersion();
    if (tab && info.menuItemId === REDO_CENSOR) {
        chrome.tabs.sendMessage(tab.id!, {msg: "getClickedEl"}, function(value) {
            let classList = String(value.value).split(' ');
            for(let i = 0; i < classList.length; i++){
                if(/[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}/.exec(classList[i])) {
                    let id = classList[i];
                    let img;
                    if(idUrlMap.has(id)){
                        img = idUrlMap.get(id);
                    } else {
                        img = value.src;
                        idUrlMap.set(id, value.src);
                    }

                    // if(pref === undefined || pref.length === 0){
                    //     loadPreferences();
                    // }
                    client.sendObj({
                        version: eVersion,
                        msg: "redoCensor",
                        url: img,
                        tabid: tab.id,
                        id: id,
                        priority: 1,
                        // preferences: pref,
                        type: "normal"
                    });
                    break;
                }
            }
        });
    }
}

chrome.runtime.onMessage

export function processsMessage(message: any, sender: chrome.runtime.MessageSender, socketClient: WebSocketClient) {
    let version = getExtensionVersion();
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
    if(message.msg === "censorRequest"){
        let img = String(message.imageURL);
        idUrlMap.set(message.id, img);
        // if(pref === undefined || pref.length === 0){
        //     loadPreferences();
        // }
        let requestType = "censorImage";
        // if(pref["animate"] === "true"){
        //     requestType = "redoCensor";
        // }
        socketClient.send(JSON.stringify({
            version: version,
            msg: requestType,
            url: img,
            tabid: sender.tab!.id,
            id: message.id,
            priority: message.priority,
            // preferences: pref,
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