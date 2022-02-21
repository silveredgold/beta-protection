import { RuntimePortManager } from "./runtimePort";
import Sockette from "sockette";
import browser from 'webextension-polyfill';
import { censoredImageEvent, placeholderStickerEvent, preferencesEvent, resetStatisticsEvent, SocketContext, SocketEvent, statisticsEvent } from "./messages";

export class WebSocketRequestClient {

    static create = async (requestId: string, host?: string): Promise<WebSocketRequestClient> => {
        console.trace('creating new socket client!');
        if (!host) {
            const configHost = await browser.storage.local.get('backendHost');
            // console.log(`pulled host config: ${JSON.stringify(configHost)}`);
            if (configHost['backendHost']) {
                host = configHost['backendHost'];
            }
        }
        return new WebSocketRequestClient(requestId, host);
    }
    private _sockets: Map<string, WebSocket> = new Map();
    private _ports: { [tabId: number]: browser.Runtime.Port | undefined; } = {};
    private _portManager?: RuntimePortManager;
    private _requestId: string;
    private host: string;
    /**
     *
     */
    private constructor(requestId: string, host?: string) {
        // this.webSocket = this.connectTo(host);
        this._requestId = requestId;
        this.host = host ?? this.defaultHost
    }

    private messageQueue: any[] = [];

    private webSocket?: WebSocket;

    defaultHost = "ws://localhost:8090/ws"

    sendObj = (message: object, callback?: () => any|void) => {
        this.send(JSON.stringify(message), callback);
    }

    usePorts = (ports: {[tabId: number]: browser.Runtime.Port|undefined}) => {
        this._ports = ports;
    }

    usePortManager = (mgr: RuntimePortManager): WebSocketRequestClient => {
        this._portManager = mgr;
        return this;
    }

    send = (message: string, callback?: any) => {
        //sockette means the socket is never not ready
        // that doesn't mean it can't error out though
        if (this._requestId) {
            try {
                let socket = this.webSocket;
                if (socket) {
                    socket.send(message);
                } else {
                    socket = this.getRequestSocket(this._requestId);
                    this.webSocket = socket;
                    socket?.send(message)
                }
                
                if (typeof callback !== 'undefined') {
                    callback();
                }
            } catch {
                this.messageQueue.push(message);
            }
        } else {
            console.warn('no request id set on client!');
        }
    };

    getRequestSocket = (requestId: string) => {
        const host = this.host;
        try {
            const onOpen = () => {
                while (this.messageQueue.length > 0) {
                    socket.send(this.messageQueue.pop());
                }
             };
            const onClose = (e) => {
                if (e.code !== 4999 && e.code !== 1000) {
                    console.error('Request socket is closed.', e, e.code, e.reason, e.wasClean);
                    browser.runtime.sendMessage({msg: 'socketClosed'});
                    
                    // setTimeout(() => {
                    //     this.connectTo(host);
                    // }, 5000);
                }
            };
            const onError = function (err) {
                console.error('Request socket encountered error: ', err.message, err.toString(), 'Closing socket');
                // webSocket.close();
            };
            const socket = new WebSocket(host);
            socket.onopen = onOpen;
            socket.onclose = onClose;
            socket.onmessage = (event) => {
                const response = JSON.parse(event.data);
                this.processServerMessage(response)?.then(() => {
                    socket.close(1000);
                });
            };
            socket.onerror = onError;
            this._sockets.set(requestId, socket);
            return socket;
        } catch (e: any) {
            console.warn("Failed to connect to WebSocket! Cannot connect to the target endpoint.",  e.toString(), e);
        }
    }



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
        console.debug(`server response received`, response);
        const event = this.messageEvents.find(evt => evt.event === response['requestType']);
        if (event?.handler !== undefined) {
            const ctx: SocketContext = {
                // socketClient: this,
                sendMessage: this.sendRuntimeMessage
            };
            console.log('running handler for server message', response.requestType, response, ctx);
            return event.handler(response, ctx);
        } else {
            console.warn('received unmatched server message!', response);
        }
    }

    close = () => {
        this.webSocket?.close(1000);
    }
}