/// <reference types="chrome"/>

import { WebSocketClient } from "./transport/webSocketClient";
import { cancelRequestsForId, processContextClick, processMessage, REDO_CENSOR } from "./events";
import { getExtensionVersion } from "./util";
import { CSSManager } from "./content-scripts/cssManager";
import { IPreferences } from "./preferences";

let currentClient: WebSocketClient | null;


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Hello from the background');

  if (request.msg == "reloadSocket") {
    currentClient = null;
    init();
  };
  if (request.msg === "injectCSS") {
    let tabId = sender.tab?.id;
    console.log(`got injectCSS for ${tabId}`);
    if (tabId) {
      let prefs = request.preferences as IPreferences;
      let css = new CSSManager(tabId, prefs);
      injectCSS(css);
    }
  }
});

async function injectCSS(css: CSSManager) {
  await css.addCSS();
  await css.addVideo();
}

function init() {
  getClient().then(client => {
    client.sendObj({version: '0.5.9', msg: "getUserPreferences"});
    client.sendObj({
      version: '0.5.9',
       msg: "detectPlaceholdersAndStickers"
    });
    chrome.runtime.sendMessage({msg: 'reloadPreferences'});
  });
}

chrome.runtime.onInstalled.addListener((details) => {
  console.log('Configuring NG settings!');

  if (details.reason === "install") {
    //I don't know why we do do this, but the original does so here we are
    const today = new Date();
    const date = today.getDate() + '-' + (today.getMonth() + 1) + '-' + today.getFullYear();
    const time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    const dateTime = time + ' ' + date;
    chrome.storage.local.set({ 'installationDate': dateTime });
  }
  init();
  chrome.contextMenus.create({
    id: REDO_CENSOR,
    title: "(Re)censor image / animate GIF",
    contexts: ["image"],
    // onclick: (info, tab) => {
    //   getClient().then(client => {
    //     processContextClick(info, tab, client);
    //   });
    // }, 
  }, () => {
    console.log('context menu created', chrome.runtime.lastError);
  });
});

chrome.runtime.onStartup.addListener(() => {
  //TODO: we need to do a settings sync here;
  chrome.contextMenus.create({
    id: REDO_CENSOR,
    title: "(Re)censor image / animate GIF",
    contexts: ["image"]
  }, () => {
    console.log('context menu created', chrome.runtime.lastError);
  });
  init();
});

async function getClient() {
  if (currentClient?.ready) {
    return currentClient;
  } else {
    return await WebSocketClient.create();
  }
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log('got onclick event!');
  getClient().then(client =>
    processContextClick(info, tab, client))
  return true;
});
chrome.runtime.onMessage.addListener((msg, sender) => {
  getClient().then(client =>
    processMessage(msg, sender, client))
  return true;
});

chrome.tabs.onUpdated.addListener((id, change, tab) => {
  console.log('tab updated', change, tab);
  getClient().then(client => {
    cancelRequestsForId(id, client);
  });
});
chrome.tabs.onRemoved.addListener((id, removeInfo) => {
  getClient().then(client => {
    cancelRequestsForId(id, client);
  });
});

// function setupContextMenuOptions() {
//   chrome.contextMenus.removeAll(function() {
//       chrome.contextMenus.create({
//           id: REDO_CENSOR,
//           title: "(Re)censor image / animate GIF",
//           contexts: ["image"]
//       });
//   });
// }
// setupContextMenuOptions();




// const manifestData = chrome.runtime.getManifest();
// const version = manifestData.version;

