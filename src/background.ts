/// <reference types="chrome"/>

import { webSocket } from "./transport/websocket";
import { WebSocketClient } from "./transport/webSocketClient";
import { cancelRequestsForId, processContextClick, processMessage, REDO_CENSOR } from "./events";
import { getExtensionVersion } from "./util";


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Hello from the background');

  // chrome.scripting.executeScript({
  //   file: 'content-script.js',
  // });
});

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
  getClient().then(client => {
    client.sendObj({version: '0.5.9', msg: "getUserPreferences"});
  });
  getClient().then(client => {
    client.sendObj({
      version: '0.5.9',
       msg: "detectPlaceholdersAndStickers"
    });
  });
});

chrome.runtime.onStartup.addListener(() => {
  //TODO: we need to do a settings sync here;
  chrome.contextMenus.create({
    id: REDO_CENSOR,
    title: "(Re)censor image / animate GIF",
    contexts: ["image"]
  });
  getClient().then(client => {
    client.sendObj({
      version: '0.5.9',
       msg: "detectPlaceholdersAndStickers"
    });
  });
  
    
  
});

async function getClient() {
  return await WebSocketClient.create();
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
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

