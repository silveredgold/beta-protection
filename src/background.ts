/// <reference types="chrome"/>

import { webSocket } from "./transport/websocket";
import { WebSocketClient } from "./transport/webSocketClient";
import { cancelRequestsForId, processContextClick, processsMessage, REDO_CENSOR } from "./events";


const globalSocketClient = new WebSocketClient();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Hello from the background');

  chrome.tabs.executeScript({
    file: 'content-script.js',
  });
});

chrome.runtime.onInstalled.addListener((details) => {
  console.log('Configuring NG settings!');

  if (details.reason === "install") {
    //I don't know why we do do this, but the original does so here we are
    const today = new Date();
    const date = today.getDate()+'-'+(today.getMonth()+1)+'-'+today.getFullYear();
    const time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    const dateTime = time+' '+date;
    chrome.storage.local.set({'installationDate': dateTime});
  }
});

chrome.runtime.onStartup.addListener(() => {
  //TODO: we need to do a settings sync here;
  chrome.contextMenus.create({
    id: REDO_CENSOR,
    title: "(Re)censor image / animate GIF",
    contexts: ["image"]
  });
  chrome.contextMenus.onClicked.addListener((info, tab) => processContextClick(info, tab, globalSocketClient));
  chrome.runtime.onMessage.addListener((msg, sender) => processsMessage(msg, sender, globalSocketClient));
  chrome.tabs.onUpdated.addListener((id, change, tab) => cancelRequestsForId(id, globalSocketClient));
  chrome.tabs.onRemoved.addListener((id, removeInfo) => cancelRequestsForId(id, globalSocketClient));


});

function setupContextMenuOptions() {
  chrome.contextMenus.removeAll(function() {
      chrome.contextMenus.create({
          id: REDO_CENSOR,
          title: "(Re)censor image / animate GIF",
          contexts: ["image"]
      });
  });
}
setupContextMenuOptions();




// const manifestData = chrome.runtime.getManifest();
// const version = manifestData.version;

