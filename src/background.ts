import { processContextClick, processMessage, CMENU_REDO_CENSOR, CMENU_ENABLE_ONCE, CMENU_RECHECK_PAGE } from "./events";
import { getExtensionVersion, setModeBadge } from "./util";
import { RuntimePortManager } from "./transport/runtimePort";
import { generateUUID, dbg } from "@/util";
import browser from "webextension-polyfill";
import { UpdateService } from "./services/update-service";
import { BackendService } from "./transport";
import type { ICensorBackend } from "@silveredgold/beta-shared/transport";
import { defaultExtensionPrefs } from "./preferences";
// import { StickerService } from "./services/sticker-service";
import semver from 'semver';
import { waitForPreferencesStore } from "./stores/util";
import { buildStickerStore, useStickerStore } from "./stores/stickers";
import { CSSManager } from "./services/css-manager";

export const portManager: RuntimePortManager = new RuntimePortManager();
let backendService: BackendService| null;

let currentClient: ICensorBackend | null;

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
          backendClient: client,
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
        backendClient: client,
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
  const breaking = 'v0.1.0'

  if (details.reason === 'update' && details.previousVersion !== undefined) {
    const newVersion = getExtensionVersion();
    const srcVersion = semver.valid(details.previousVersion);
    console.warn(`upgrading from ${srcVersion}->${newVersion}`);
    if (srcVersion && semver.gte(newVersion, breaking) && semver.lt(srcVersion, breaking)) {
      console.log('breaking change boundary cross detected!');
      waitForPreferencesStore(false).then(store => {
        store.merge(defaultExtensionPrefs, false).then(() => {
          UpdateService.notifyForBreakingUpdate(details.previousVersion);
        })
      });
    }
  }

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
    });
    const defaultBackendHost = 'http://localhost:2382';
    dbg(`persisting default backend host`, JSON.stringify({host: defaultBackendHost}));
    browser.storage.local.set({'backendHost': defaultBackendHost})
      .then(() => {
        browser.storage.local.set({'backendId': 'beta-censoring'}).then(() => {
          browser.runtime.sendMessage({msg: 'reloadSocket'});
        })
      });
    waitForPreferencesStore(false).then(store => {
      store.merge(defaultExtensionPrefs, false)
    });
  }
  initExtension();
  initContextMenus();
  initAlarms();
});

browser.runtime.onStartup.addListener(() => {
  //TODO: we need to do a settings sync here;
  initContextMenus();
  initAlarms();
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
    backendService = null;
    initExtension();
  } else {
    const factory = async () => {
      const client = await getClient();
      const version = getExtensionVersion();
      return {
        backendClient: client,
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
    client.cancelRequests({srcId: id.toString()});
  });
});

browser.tabs.onUpdated.addListener(async (id, change, tab) => {
  if (change.status === 'complete' && tab.id) {
    //caught a page load!
    dbg('sending loaded message');
    await trySendEvent({msg: 'pageChanged:complete'}, tab.id);
  } else if (change.status === 'loading' && tab.id) {
    dbg('sending loading message');
    await trySendEvent({msg: 'pageChanged:loading', url: change.url}, tab.id);
    // await sendMsg(tab.id, {msg: 'pageChanged:loading', url: change.url});
  }
});

browser.tabs.onUpdated.addListener(async (id, change, tab) => {
  if (tab.id) {
    const css = new CSSManager(tab.id, null!);
    if (change.status === 'complete' && tab.id) {
      //caught a page load!
      dbg('disabling loading filter');
      await css.setLoadingState(false);
    } else if (change.status === 'loading' && change.url) {
      dbg('enabling loading filter');
      await css.setLoadingState(true);
    }
  }
});

browser.tabs.onRemoved.addListener((id, removeInfo) => {
  dbg('tab removed', removeInfo);
  getClient().then(client => {
    const portNames = portManager.closeForSrc(id.toString());
    console.debug('invoking backend cancel', id, portNames);
    client.cancelRequests({requestId: [...portNames]});
  });
});

browser.storage.onChanged.addListener((changes, area) => {
  const keys = Object.keys(changes);
  if (area === 'local') {
    console.log('change: storage', area, changes);
    if (keys.includes('override') || keys.includes('preferences')) {
      browser.runtime.sendMessage({msg: `reloadPreferences`});
      browser.runtime.sendMessage({msg: 'reloadOverride'})
    }
  }
  browser.runtime.sendMessage({msg: `storageChange:${area}`, keys, changes});
  //TODO: this should just be done in an onAction listener in the store.
  waitForPreferencesStore().then(ep => setModeBadge(ep.mode)).catch(() => console.debug('failed to set mode badge'));
});

browser.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'BP_UPDATE_CHECK') {
    console.log('running background update check!', Date.now().toString());
    UpdateService.checkForUpdates();
  }
});

browser.notifications.onButtonClicked.addListener((id, idx) => {
  UpdateService.handleNotification(id, idx);
});

browser.notifications.onClicked.addListener(id => {
  UpdateService.handleNotification(id);
});





/** UTILITY FUNCTIONS BELOW THIS, USED BY EVENTS ABOVE */


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
      client.getRemotePreferences().then((result) => {
        if (result) {
          waitForPreferencesStore(false).then(store => {
            store.merge(defaultExtensionPrefs)
          });
        }
        trySendEvent({msg: 'reloadPreferences'});
      });
    }
    const store = buildStickerStore();
    store.tryRefreshAvailable(client);
  });
}

function initContextMenus() {
  browser.contextMenus.create({
    id: CMENU_REDO_CENSOR,
    title: "Censor this image",
    contexts: ["image"],
  }, () => {
    if (browser.runtime.lastError) {
      console.warn('error creating context menu', CMENU_REDO_CENSOR, browser.runtime.lastError);
    }
  });
  browser.contextMenus.create({
    id: CMENU_RECHECK_PAGE,
    title: "Recheck images on this page",
    contexts: ["page"],
  }, () => {
    if (browser.runtime.lastError) {
      console.warn('error creating context menu', CMENU_RECHECK_PAGE, browser.runtime.lastError);
    }
  });
  browser.contextMenus.create({
    id: CMENU_ENABLE_ONCE,
    title: "Enable censoring this tab",
    contexts: ["page"]
  }, () => {
    if (browser.runtime.lastError) {
      console.warn('error creating context menu', CMENU_ENABLE_ONCE, browser.runtime.lastError);
    }
  });
}

function initAlarms() {
  browser.alarms.create('BP_UPDATE_CHECK', {
    delayInMinutes: 1,
    periodInMinutes: 720
  });
}

async function getService(): Promise<BackendService> {
  if (backendService) {
    return backendService
  } else {
    backendService = await BackendService.create();
    return backendService;
  }
}

async function getClient(): Promise<ICensorBackend> {
  console.debug('getting client');
  const service = await getService();
  if (currentClient) {
    return currentClient;
  } else {
    currentClient = await service.currentProvider.getClient(portManager);
    return currentClient!;
  }
}

async function getRequestClient(requestId: string) {
  const service = await getService();
  const reqClient = await service.currentProvider.getRequestClient(requestId, portManager);
  return reqClient;
}
