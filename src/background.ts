import { WebSocketClient } from "./transport/webSocketClient";
import { cancelRequestsForId, processContextClick, processMessage, CMENU_REDO_CENSOR, CMENU_ENABLE_ONCE, CMENU_RECHECK_PAGE } from "./events";
import { getExtensionVersion } from "./util";
import { RuntimePortManager } from "./transport/runtimePort";
import { generateUUID, dbg } from "@/util";
import browser from "webextension-polyfill";
import { WebSocketRequestClient } from "./transport/webSocketPortClient";

export const portManager: RuntimePortManager = new RuntimePortManager();

let currentClient: WebSocketClient | null;

browser.runtime.onConnect.addListener((port) => {
  const portMsgListener = async (msg: any, port: browser.Runtime.Port) => {
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
      const result = await processMessage(request, port.sender!, factory);
      return result;
    }
  };
  const requestPortMsgListener = async (msg: any, port: browser.Runtime.Port) => {
    const request = msg;
    dbg('got port message', port.sender?.tab?.id, request)
    const factory = async () => {
      const client = await getRequestClient(port.name);
      const version = getExtensionVersion();
      return {
        socketClient: client,
        version
      }
    };
    const result = await processMessage(request, port.sender!, factory);
    
    return result;
  };
  if (port.name && port.sender?.tab?.id) {
    dbg('resource-specific runtime port opened!', port.name, port.sender.tab.id);
    portManager.addNamedPort(port, port.sender.tab.id.toString());
    const isRequestPort = /^[{(]?[0-9A-F]{8}[-]?(?:[0-9A-F]{4}[-]?){3}[0-9A-F]{12}[)}]?$/i.test(port.name);
    port.onMessage.addListener(isRequestPort ? requestPortMsgListener : portMsgListener);
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

browser.runtime.onInstalled.addListener((details) => {
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
    browser.storage.local.get({'installationId': ''}).then(result => {
      if (!result['installationId']) {
        console.log('No installation ID found, creating new one!');
        browser.storage.local.set({'installationId': id});
      }
    })
  }
  initExtension();
  initContextMenus();
});

browser.runtime.onStartup.addListener(() => {
  //TODO: we need to do a settings sync here;
  initContextMenus();
});

browser.contextMenus.onClicked.addListener((info, tab) => {
  dbg('got onclick event!');
  getClient().then(client =>
    processContextClick(info, tab, client))
  return true;
});

browser.runtime.onMessage.addListener((msg, sender) => {
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
    const response = processMessage(msg, sender, factory);
    return response;
  }
});

browser.tabs.onUpdated.addListener((id, change, tab) => {
  dbg('tab updated: cancelling requests', change, tab);
  getClient().then(client => {
    cancelRequestsForId(id, client);
  });
});

browser.tabs.onUpdated.addListener(async (id, change, tab) => {
  const sendMsg = async(tabId: number, msg: object) => {
    try {
      await browser.tabs.sendMessage(tabId, msg);
    } catch (e: any) {
      console.log('Failed to send tab update event to tab!', tabId, msg, e);
    }
  }
  if (change.status === 'complete' && tab.id) {
    //caught a page load!
    // console.debug('page load detected, notifying content script!');
    dbg('sending loaded message');
    await trySendEvent({msg: 'pageChanged:complete'}, tab.id);
  } else if (change.status === 'loading' && tab.id) {
    dbg('sending loading message');
    await trySendEvent({msg: 'pageChanged:loading', url: change.url}, tab.id);
    // await sendMsg(tab.id, {msg: 'pageChanged:loading', url: change.url});
  }
});

browser.tabs.onRemoved.addListener((id, removeInfo) => {
  dbg('tab removed', removeInfo);
  getClient().then(client => {
    portManager.closeForSrc(id.toString());
    cancelRequestsForId(id, client);
  });
});



/** UTILITY FUNCTIONS BELOW THIS, USED BY EVENTS ABOVE */

// function trySendEvent(msg: object) {
//   browser.runtime.sendMessage(msg).then((res) => {
//     console.debug('sent event message', res);
//   }).catch(e => {
//     console.warn("Failed to send preferences reload event. Likely there's just no listeners yet.", e);
//   });
// }

const trySendEvent = async (msg: object, tabId?: number) => {
  if (tabId) {
    try {
      await browser.tabs.sendMessage(tabId, msg);
    } catch (e: any) {
      console.log('Failed to send tab update event to tab!', tabId, msg, e);
    }
  } else {
    try {
      await browser.runtime.sendMessage(msg);
    } catch (e: any) {
      console.warn("Failed to send preferences reload event. Likely there's just no listeners yet.", e);
    }
  }
}

function initExtension(syncPrefs: boolean = true) {
  getClient().then(client => {
    const eVersion = getExtensionVersion();
    if (syncPrefs) {
      client.sendObj({version: eVersion, msg: "getUserPreferences"});
    }
    client.sendObj({
      version: eVersion,
       msg: "detectPlaceholdersAndStickers"
    });
    trySendEvent({msg: 'reloadPreferences'});    
  });
}

function initContextMenus() {
  browser.contextMenus.create({
    id: CMENU_REDO_CENSOR,
    title: "Censor this image",
    contexts: ["image"],
  }, () => {
    console.log('context menu created', browser.runtime.lastError);
  });
  browser.contextMenus.create({
    id: CMENU_RECHECK_PAGE,
    title: "Recheck images on this page",
    contexts: ["page"],
  }, () => {
    console.log('recheck menu created', browser.runtime.lastError);
  });
  browser.contextMenus.create({
    id: CMENU_ENABLE_ONCE,
    title: "Enable censoring this tab",
    contexts: ["page"]
  }, () => {
    console.log('force-enable menu created', browser.runtime.lastError);
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

async function getRequestClient(requestId: string) {
  let reqClient = await WebSocketRequestClient.create(requestId);
  reqClient.usePortManager(portManager);
  return reqClient;
}