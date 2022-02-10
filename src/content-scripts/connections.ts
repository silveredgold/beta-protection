import { RuntimePortManager } from '@/transport/runtimePort';
import browser from 'webextension-polyfill';

const portManager: RuntimePortManager = new RuntimePortManager();

const dbg = (...data: any[]) => {
    console.debug(...data);
}

// browser.runtime.onConnect.addListener((port) => {
//     const portMsgListener = (msg: any, port: browser.Runtime.Port) => {
//         const request = msg;
//         if (request.msg == 'getClickedEl') {
//             port.postMessage({ msg: 'heartBeatAlive' });
//         } else {
//             dbg('got port message', port.sender?.tab?.id, request)
//             const factory = async () => {
//                 const client = await getClient();
//                 const version = getExtensionVersion();
//                 return {
//                     socketClient: client,
//                     version
//                 }
//             };
//             return processMessage(request, port.sender!, undefined, factory);
            
//         }
//     };
//     dbg('resource-specific runtime port opened!', port.name, port.sender);
//     if (port.name && port.sender?.id && port.sender?.url) {
//         portManager.addNamedPort(port, `${port.sender.id}-${port.sender.url}`.toString());
//         port.onMessage.addListener(portMsgListener);
//     }
//     else if (port?.sender?.tab?.id) {
//         //got a valid port from a tab
//         const id = port.sender.tab.id;
//         dbg('tab runtime port opened', id);
//         port.onDisconnect.addListener(() => {
//             console.log('anonymous tab runtime port disconnected', port.sender?.tab?.id);
//         });
//         port.onMessage.addListener(portMsgListener);
//     }
// });