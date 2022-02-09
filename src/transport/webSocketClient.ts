import { createPreferencesFromBackend, loadPreferencesFromStorage, savePreferencesToStorage } from "@/preferences";
import { IPreferences, rawPreferences } from "@/preferences/types";
import { PlaceholderService } from "@/services/placeholder-service";
import { StickerService } from "@/services/sticker-service";
import Sockette from "sockette";

export class WebSocketClient {

    static create = async (host?: string): Promise<WebSocketClient> => {
        // console.log('creating new client!');
        console.trace('creating new socket client!');
        if (!host) {
            let configHost = await chrome.storage.local.get('backendHost');
            // console.log(`pulled host config: ${JSON.stringify(configHost)}`);
            if (configHost['backendHost']) {
                host = configHost['backendHost'];
            }
        }
        return new WebSocketClient(host);
    }
    /**
     *
     */
    private constructor(host?: string) {
        this.webSocket = this.connectTo(host);
    }

    private messageQueue: any[] = [];

    private webSocket?: Sockette;

    defaultHost = "ws://localhost:8090/ws"

    // Make the function wait until the connection is made...
    // thanks https://stackoverflow.com/questions/13546424/how-to-wait-for-a-websockets-readystate-to-change
    // waitForConnection = (callback: () => void, interval: number = 100) =>{
    //     setTimeout(
    //         () => {
    //             if (this.webSocket?.readyState === 1) {
    //                 // console.log("Connection is made")
    //                 if (callback != null){
    //                     callback();
    //                 }
    //             } else {
    //                 console.debug("Socket waiting for connection...")
    //                 this.waitForConnection(callback);
    //             }

    //         }, interval); // wait 5 milisecond for the connection...
    // }

    sendObj = (message: object, callback?: () => any|void) => {
        this.send(JSON.stringify(message), callback);
    }

    send = (message: string, callback?: any) => {
        // if (this.webSocket?.readyState !== 1) {
            if (false) {
            console.log('socket not ready, queueing message!');
            this.messageQueue.push(message)
          } else {
              try {
                this.webSocket?.send(message)
                if (typeof callback !== 'undefined') {
                    callback();
                }
              } catch {
                  this.messageQueue.push(message);
              }
            
          }
    };


    
    
    public get ready() : boolean {
        // return this.webSocket?.readyState === 1;
        return true;
    }
    

    private connectTo = (host?: string): Sockette | undefined => {
        host ??= this.defaultHost;
        try {
            const onOpen = () => {
                while (this.messageQueue.length > 0) {
                    webSocket.send(this.messageQueue.pop());
                }
             };
             const onMessage = (event) => {
                let response = JSON.parse(event.data);
                this.processServerMessage(response);
            };
            const onClose = (e) => {
                if (e.code !== 4999) {
                    chrome.runtime.sendMessage({msg: 'socketClosed'});
                    console.error('Socket is closed.', e);
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
                    chrome.runtime.sendMessage({msg: 'socketReconnect'});
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
            console.log("Websocket is complaining; server is likely rebooting or offline. - " + e.toString());
        }
    }

    public get messageHandlers() : {[key: string]: (response: any) => void} {
        return {
            'censorImage': (response) => this.processCensoredImageResponse(response),
            'detectPlaceholdersAndStickers': this.processPlaceholderAndStickerResponse,
            'getUserPreferences': this.processUserPreferences
        }
    }
    

    processServerMessage = (response: any) => {
        console.debug(`server response received`, response);
        let handler = this.messageHandlers[response['requestType']];
        if (handler !== undefined) {
            console.log('running handler for server message', response.requestType, response);
            handler(response);
        } else {
            console.warn('received unmatched server message!', response);
        }
    }

    processCensoredImageResponse = async (response) => {
        let prefs = await loadPreferencesFromStorage();
        let url: string;
        console.log(`parsing image response`, response);
        if (parseInt(response.status) === 200 || parseInt(response.status) === 304) {
            url = response.url;
        } else {
            url = prefs.errorMode === 'subtle'
                ? chrome.runtime.getURL("images/error_simple.png")
                : chrome.runtime.getURL("images/error_normal.jpg");
            // we don't have an NSFW error screen yet
            // ignore that, we do now
        }
        let body = {
            msg: "setSrc", censorURL: url,
            id: response.id, tabid: response.tabid, type: response.type
        };

        chrome.tabs.sendMessage(parseInt(response.tabid), body);
    }

    processPlaceholderAndStickerResponse = (response) => {
        if (parseInt(response.status) === 200) {
            console.log(`sticker response:`, response)
            //TODO: we don't actually need to do this anymore, we don't use the backend placeholders anywhere
            PlaceholderService.loadBackendPlaceholders(response)
            StickerService.loadAvailableStickers(response);

        }
    }

    processUserPreferences = async (response): Promise<IPreferences> => {
        const log = (...data: any[]) => {
            // console.debug(...data);
            //this is just here to make debugging things easier
        }
        console.log()
        let preferences = await loadPreferencesFromStorage();
        if (parseInt(response.status) === 200) {
            let rawPrefs = response["preferences"] as rawPreferences;
            log('raw prefs', rawPrefs);
            let backendPrefs = createPreferencesFromBackend(rawPrefs);
            log('backend prefs', backendPrefs);
            log('loaded prefs', preferences);
            let mergedPrefs = {
                ...backendPrefs,
                ...preferences
            };
            log('merged prefs', mergedPrefs);
            await savePreferencesToStorage(mergedPrefs, true);
            let newPrefs = await loadPreferencesFromStorage();
            log('new prefs as stored:', newPrefs);
            return mergedPrefs;
        }
        return preferences;
    }

    close = () => {
        this.webSocket?.close(4999);
    }
}