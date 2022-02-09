/// <reference types="chrome"/>

import { WebSocketClient } from "./transport/webSocketClient";
import { cancelRequestsForId, processContextClick, processMessage, CMENU_REDO_CENSOR, CMENU_ENABLE_ONCE, CMENU_RECHECK_PAGE } from "./events";
import { getExtensionVersion } from "./util";
import { CSSManager } from "./content-scripts/cssManager";
import { IPreferences } from "./preferences";

export const currentPorts: {[tabId: number]: chrome.runtime.Port|undefined} = {};

let currentClient: WebSocketClient | null;

chrome.runtime.onConnect.addListener((port) => {
  if (port?.sender?.tab?.id) {
    //got a valid port from a tab
    let id = port.sender.tab.id;
    console.log('tab runtime port opened', id);
    port.onDisconnect.addListener(() => {
      currentPorts[id] = undefined;
    });
    port.onMessage.addListener((msg, port) => {
      let request = msg;
      if (request.msg == 'heartBeat') {
        port.postMessage({msg: 'heartBeatAlive'});
      } else {
        console.debug('got port message', port.sender?.tab?.id, request)
        const factory = async () => {
          let client = await getClient();
          let version = getExtensionVersion();
          return {
            socketClient: client,
            version
          }
        };
        processMessage(request, port.sender!, undefined, factory);
        return true;
      }
    });
    currentPorts[id] = port;
  }
});

chrome.runtime.onInstalled.addListener((details) => {
  console.log('Configuring BP settings!');

  if (details.reason === "install") {
    //I don't know why we do do this, but the original does so here we are
    const today = new Date();
    const date = today.getDate() + '-' + (today.getMonth() + 1) + '-' + today.getFullYear();
    const time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    const dateTime = time + ' ' + date;
    chrome.storage.local.set({ 'installationDate': dateTime });
  }
  initExtension();
  initContextMenus();
});

chrome.runtime.onStartup.addListener(() => {
  //TODO: we need to do a settings sync here;
  initContextMenus();
  initExtension();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log('got onclick event!');
  getClient().then(client =>
    processContextClick(info, tab, client))
  return true;
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.debug('background script handling runtime message', msg);
  if (msg.msg == "reloadSocket") {
    currentClient = null;
    initExtension();
  } else {
    const factory = async () => {
      let client = await getClient();
      let version = getExtensionVersion();
      return {
        socketClient: client,
        version
      }
    };
    processMessage(msg, sender, sendResponse, factory)
    return true;
  }
});

chrome.tabs.onUpdated.addListener((id, change, tab) => {
  console.log('tab updated: would be cancelling requests', change, tab);
  getClient().then(client => {
    cancelRequestsForId(id, client);
  });
});

chrome.tabs.onUpdated.addListener((id, change, tab) => {
  const sendMsg = (tabId: number, msg: object) => {
    // let port = currentPorts[tabId];
    // if (port) {
    //   // port.postMessage(msg)
      chrome.tabs.sendMessage(tabId, msg);
    // } else {
    //   chrome.tabs.sendMessage(tabId, msg);
    // }
  }
  console.log('onUpdated event', change);
  if (change.status === 'complete' && tab.id) {
    //caught a page load!
    // console.debug('page load detected, notifying content script!');
    sendMsg(tab.id, {msg: 'pageChanged:complete'});
    // chrome.tabs.sendMessage(tab.id, {msg: 'pageChanged'})
    // chrome.runtime.sendMessage({msg: 'pageChanged'})
  } else if (change.status === 'loading' && tab.id) {
    // chrome.tabs.sendMessage(tab.id, {msg: 'pageChanged:loading'});
    sendMsg(tab.id, {msg: 'pageChanged:loading', url: change.url});
  }
});

chrome.tabs.onRemoved.addListener((id, removeInfo) => {
  console.log('tab removed');
  getClient().then(client => {
    currentPorts[id] = undefined;
    cancelRequestsForId(id, client);
  });
});



/** UTILITY FUNCTIONS BELOW THIS, USED BY EVENTS ABOVE */

function initExtension() {
  getClient().then(client => {
    client.sendObj({version: '0.5.9', msg: "getUserPreferences"});
    client.sendObj({
      version: '0.5.9',
       msg: "detectPlaceholdersAndStickers"
    });
    chrome.runtime.sendMessage({msg: 'reloadPreferences'});
  });
}

function initContextMenus() {
  chrome.contextMenus.create({
    id: CMENU_REDO_CENSOR,
    title: "Censor this image",
    contexts: ["image"],
  }, () => {
    console.log('context menu created', chrome.runtime.lastError);
  });
  chrome.contextMenus.create({
    id: CMENU_RECHECK_PAGE,
    title: "Recheck images on this page",
    contexts: ["page"],
  }, () => {
    console.log('recheck menu created', chrome.runtime.lastError);
  });
  chrome.contextMenus.create({
    id: CMENU_ENABLE_ONCE,
    title: "Enabling censoring this tab",
    contexts: ["page"]
  }, () => {
    console.log('force-enable menu created', chrome.runtime.lastError);
  });
}

async function getClient() {
  if (currentClient?.ready) {
    return currentClient;
  } else {
    currentClient = await WebSocketClient.create();
    return currentClient;
  }
}