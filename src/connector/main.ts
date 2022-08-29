import { MSG_API_EXTENSION_VERSION, MSG_API_GET_CURRENT_OVERRIDE } from "@/messaging"

console.debug('Initializing Beta Protection connector!');

const allowedEvents = [MSG_API_EXTENSION_VERSION, MSG_API_GET_CURRENT_OVERRIDE]

// window.addEventListener("message", (event) => {
//     // We only accept messages from ourselves
//     if (event.source != window) {
//         return;
//     }

//     if (event.data.type && (event.data.type == "BETA_PROTECTION")) {
//         console.log("Content script received: " + event.data.text);
//         if (event.data.message == "getCurrentVersion") {
//             browser.runtime.sendMessage({ msg: MSG_API_EXTENSION_VERSION.event }).then(version => {
//                 console.log('returning response to event source', event.source);
//                 if (event.source) {
//                     (event.source as any).postMessage({ type: "BP_CONNECTOR", message: "getCurrentVersion", response: JSON.stringify({ currentVersion: version }) })
//                 }
//             });
//         }
//     }
// }, false);

const channel = new BroadcastChannel('beta_protection');
channel.postMessage({ type: "STATUS", event: "CONNECTOR_READY", message: "The connector is ready!" });
channel.onmessage = (e) => {
    console.log('received channel message in content script', e.data, e.source);
    if (e.data.type == "REQUEST" && !!e.data.request && allowedEvents.map(e => e.event).includes(e.data.request)) {
        console.debug('sending connector request as runtime message');
        chrome.runtime.sendMessage({ msg: e.data.request }, response => {
            console.log('returning response to event source', e.source);
            channel.postMessage({type: "RESPONSE", msg: e.data.request, response: response, requestId: e.data.requestId});
        });
    }
};
console.debug('Beta Protection connector event listeners ready!');