/// <reference types="chrome"/>

import { WebSocketClient } from "./transport/webSocketClient";
import { cancelRequestsForId, processContextClick, processMessage, CMENU_REDO_CENSOR, CMENU_ENABLE_ONCE, CMENU_RECHECK_PAGE } from "./events";
import { getExtensionVersion } from "./util";
import { CSSManager } from "./content-scripts/cssManager";
import { IPreferences } from "./preferences";
import { RuntimePortManager } from "./transport/runtimePort";
import { generateUUID } from "@/util";
export const portManager: RuntimePortManager = new RuntimePortManager();

let currentClient: WebSocketClient | null;

const dbg = (...data: any[]) => {
  // console.debug(...data);
}

chrome.runtime.onConnect.addListener((port) => {
  const portMsgListener = (msg: any, port: chrome.runtime.Port) => {
    const request = msg;
    if (request.msg == 'heartBeat') {
      port.postMessage({msg: 'heartBeatAlive'});
    } else {
      dbg('got port message', port.sender?.tab?.id, request)
      const factory = async () => {
        const client = await getClient();
        const version = getExtensionVersion();
        return {
          socketClient: client,
          version
        }
      };
      processMessage(request, port.sender!, undefined, factory);
      return true;
    }
  };
  if (port.name && port.sender?.tab?.id) {
    dbg('resource-specific runtime port opened!', port.name, port.sender.tab.id);
    portManager.addNamedPort(port, port.sender.tab.id.toString());
    port.onMessage.addListener(portMsgListener);
  }
  else if (port?.sender?.tab?.id) {
    //got a valid port from a tab
    const id = port.sender.tab.id;
    dbg('tab runtime port opened', id);
    port.onDisconnect.addListener(() => {
      console.log('anonymous tab runtime port disconnected', port.sender?.tab?.id);
    });
    port.onMessage.addListener(portMsgListener);
  }
});

chrome.runtime.onInstalled.addListener((details) => {
  console.log('Configuring BP settings!');

  if (details.reason === "install") {
    //to any adventurous code spelunkers:
    // this probably looks kinda fucked
    // in reality, there's plans I have for this extension that rely
    // on anonymously identifying installs.
    // this is the easiest way to do so reliably.
    // using this method also means that simply reinstalling
    // the extension will scramble the ID
    const id = generateUUID();
    chrome.storage.local.get({'installationId': ''}).then(result => {
      if (!result['installationId']) {
        console.log('No installation ID found, creating new one!');
        chrome.storage.local.set({'installationId': id});
      }
    })
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
  dbg('got onclick event!');
  getClient().then(client =>
    processContextClick(info, tab, client))
  return true;
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  dbg('background script handling runtime message', msg);
  if (msg.msg == "reloadSocket") {
    currentClient = null;
    initExtension();
  } else {
    const factory = async () => {
      const client = await getClient();
      const version = getExtensionVersion();
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
  dbg('tab updated: cancelling requests', change, tab);
  getClient().then(client => {
    cancelRequestsForId(id, client);
  });
});

chrome.tabs.onUpdated.addListener((id, change, tab) => {
  const sendMsg = (tabId: number, msg: object) => {
    chrome.tabs.sendMessage(tabId, msg);
  }
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
    portManager.closeForSrc(id.toString());
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
    currentClient.usePortManager(portManager);
    return currentClient;
  }
}