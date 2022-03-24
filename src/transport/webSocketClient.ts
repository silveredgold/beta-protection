import Sockette from "sockette";
import { RuntimePortManager } from "./runtimePort";
import browser from 'webextension-polyfill';
import { censoredImageEvent, placeholderStickerEvent, preferencesEvent, resetStatisticsEvent, SocketContext, SocketEvent, statisticsEvent } from "./messages";
import { dbg } from "@/util";

// this file should be unnecessary now, retaining for compatibility and testing.

export class WebSocketClient {

    static createBase = async (host?: string): Promise<WebSocketClient> => {
        console.trace('creating new socket client!');
        if (!host) {
            const configHost = await browser.storage.local.get('backendHost');
            if (configHost['backendHost']) {
                host = configHost['backendHost'];
            }
        }
        return new WebSocketClient(undefined, host);
    }

    static createForRequestBase = async (requestId: string, host?: string): Promise<WebSocketClient> => {
        if (__DEBUG__) {
            console.trace('creating new socket client!');
        }
        if (!host) {
            const configHost = await browser.storage.local.get('backendHost');
            if (configHost['backendHost']) {
                host = configHost['backendHost'];
            }
        }
        return new WebSocketClient(requestId, host);
    }

    private _ports: { [tabId: number]: browser.Runtime.Port | undefined; } = {};
    private _portManager?: RuntimePortManager;
    protected _requestId?: string;
    private host: string;
    /**
     *
     */
    protected constructor(requestId?: string, host?: string) {
        this.host = host ?? WebSocketClient.defaultHost;
        this.webSocket = this.connectTo(this.host);
        this._requestId = requestId;
    }

    private messageQueue: any[] = [];

    private webSocket?: Sockette;

    static defaultHost = "ws://localhost:8090/ws"

    protected sendObj = (message: object, callback?: () => any|void) => {
        this.send(JSON.stringify(message), callback);
    }

    usePorts = (ports: {[tabId: number]: browser.Runtime.Port|undefined}) => {
        this._ports = ports;
    }

    usePortManager = (mgr: RuntimePortManager): WebSocketClient => {
        this._portManager = mgr;
        return this;
    }

    private send = (message: string, callback?: any) => {
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
            const onClose = (e: CloseEvent): any => {
                if (e.code !== 4999 && e.code !== 1000) {
                    console.error('Socket is closed.', e.code, e.reason, e.wasClean);
                    if (!this._requestId) {
                        browser.runtime.sendMessage({msg: 'socketClosed'});
                    }
                }
            };
            const onError = function (ev: Event) {
                console.error('Socket encountered error: Closing socket');
            };
            const onMessage = (event: MessageEvent<any>) => {
                    const response = JSON.parse(event.data);
                    this.processServerMessage(response)?.then(() => {
                        if (this._requestId) {
                        webSocket.close(1000);
                        }
                    });
                };
            const webSocket = new Sockette(host, {
                timeout: 60,
                maxAttempts: 10,
                onopen: onOpen,
                onmessage: onMessage,
                onreconnect: (e) => {
                    console.warn('reconnecting socket!');
                    browser.runtime.sendMessage({msg: 'socketReconnect'});
                },
                onmaximum: (e) => console.error('Socket reconnection failed!', e),
                onclose: onClose,
                onerror: onError
            });
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
            return event.handler(response, ctx);
        } else {
            console.warn('received unmatched server message!', response);
        }
    }

    close = () => {
        this.webSocket?.close(1000);
    }
}