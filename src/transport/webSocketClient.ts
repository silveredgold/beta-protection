import Sockette from "sockette";
import { RuntimePortManager } from "./runtimePort";
import browser from 'webextension-polyfill';
import { censoredImageEvent, placeholderStickerEvent, preferencesEvent, resetStatisticsEvent, SocketContext, SocketEvent, statisticsEvent } from "./messages";
import { dbg } from "@/util";

export class WebSocketClient {

    static create = async (host?: string): Promise<WebSocketClient> => {
        console.trace('creating new socket client!');
        if (!host) {
            const configHost = await browser.storage.local.get('backendHost');
            if (configHost['backendHost']) {
                host = configHost['backendHost'];
            }
        }
        return new WebSocketClient(host);
    }
    private _ports: { [tabId: number]: browser.Runtime.Port | undefined; } = {};
    private _portManager?: RuntimePortManager;
    /**
     *
     */
    private constructor(host?: string) {
        this.webSocket = this.connectTo(host);
    }

    private messageQueue: any[] = [];

    private webSocket?: Sockette;

    static defaultHost = "ws://localhost:8090/ws"

    sendObj = (message: object, callback?: () => any|void) => {
        this.send(JSON.stringify(message), callback);
    }

    usePorts = (ports: {[tabId: number]: browser.Runtime.Port|undefined}) => {
        this._ports = ports;
    }

    usePortManager = (mgr: RuntimePortManager): WebSocketClient => {
        this._portManager = mgr;
        return this;
    }

    send = (message: string, callback?: any) => {
        //sockette means the socket is never not ready
        // that doesn't mean it can't error out though

        try {
            this.webSocket?.send(message)
            if (typeof callback !== 'undefined') {
                callback();
            }
        } catch {
            this.messageQueue.push(message);
        }
    };



    private sendRuntimeMessage = async (obj: object, requestId?: string, tabId?: string) => {
        if (requestId && this._portManager) {
            this._portManager.sendMessage(obj, requestId, tabId?.toString());
        }
        if (tabId) {
            const port = this._ports[tabId];
            if (port) {
                port.postMessage(obj);
            } else {
                browser.tabs.sendMessage(parseInt(tabId), obj);
            }
        } else {
            browser.runtime.sendMessage(obj)
            // throw new Error("Cannot deliver message without tab ID!");
        }
    }
    
    
    public get ready() : boolean {
        // return this.webSocket?.readyState === 1;
        return true;
    }
    

    private connectTo = (host?: string): Sockette | undefined => {
        host ??= WebSocketClient.defaultHost;
        try {
            const onOpen = () => {
                while (this.messageQueue.length > 0) {
                    webSocket.send(this.messageQueue.pop());
                }
             };
             const onMessage = (event) => {
                const response = JSON.parse(event.data);
                this.processServerMessage(response);
            };
            const onClose = (e) => {
                if (e.code !== 4999) {
                    console.error('Socket is closed.', e);
                    browser.runtime.sendMessage({msg: 'socketClosed'});
                    
                    // setTimeout(() => {
                    //     this.connectTo(host);
                    // }, 5000);
                }
            };
            const onError = function (err) {
                console.error('Socket encountered error: ', err.message, 'Closing socket');
                // webSocket.close();
            };
            const webSocket = new Sockette(host, {
                timeout: 60,
                maxAttempts: 10,
                onopen: onOpen,
                onmessage: onMessage,
                onreconnect: (e) => {
                    console.warn('reconnecting socket!');
                    browser.runtime.sendMessage({msg: 'socketReconnect'});
                    while (this.messageQueue.length > 0) {
                        webSocket.send(this.messageQueue.pop());
                    }
                },
                onmaximum: (e) => console.error('Socket reconnection failed!', e),
                onclose: onClose,
                onerror: onError
            });
            // webSocket.onopen = onOpen
            // webSocket.onmessage = onMessage
            // webSocket.onclose = onClose;
            // webSocket.onerror = onError;
            return webSocket;
        } catch (e: any) {
            console.warn("Failed to connect to WebSocket! Cannot connect to the target endpoint.",  e.toString(), e);
        }
    }

    public get messageEvents() : SocketEvent<any>[] {
        return [
            placeholderStickerEvent,
            preferencesEvent,
            censoredImageEvent,
            statisticsEvent,
            resetStatisticsEvent
        ]
    }

    processServerMessage = (response: any) => {
        const event = this.messageEvents.find(evt => evt.event === response['requestType']);
        if (event?.handler !== undefined) {
            const ctx: SocketContext = {
                socketClient: this,
                sendMessage: this.sendRuntimeMessage
            };
            dbg('running handler for server message', response.requestType, response, ctx);
            event.handler(response, ctx);
        } else {
            console.warn('received unmatched server message!', response);
        }
    }

    close = () => {
        this.webSocket?.close(1000);
    }
}