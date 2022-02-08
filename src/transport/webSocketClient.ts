import { createPreferencesFromBackend, loadPreferencesFromStorage, savePreferencesToStorage } from "@/preferences";
import { IPreferences, rawPreferences } from "@/preferences/types";
import { PlaceholderService } from "@/services/placeholder-service";
import { StickerService } from "@/services/sticker-service";

export class WebSocketClient {

    static create = async (host?: string): Promise<WebSocketClient> => {
        console.log('creating new client!');
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

    private webSocket?: WebSocket;

    defaultHost = "ws://localhost:8090/ws"

    // Make the function wait until the connection is made...
    // thanks https://stackoverflow.com/questions/13546424/how-to-wait-for-a-websockets-readystate-to-change
    waitForConnection = (callback: () => void, interval: number = 100) =>{
        setTimeout(
            () => {
                if (this.webSocket?.readyState === 1) {
                    // console.log("Connection is made")
                    if (callback != null){
                        callback();
                    }
                } else {
                    console.debug("Socket waiting for connection...")
                    this.waitForConnection(callback);
                }

            }, interval); // wait 5 milisecond for the connection...
    }

    sendObj = (message: object, callback?: () => any|void) => {
        this.send(JSON.stringify(message), callback);
    }

    send = (message: string, callback?: any) => {
        if (this.webSocket?.readyState !== 1) {
            this.messageQueue.push(message)
          } else {
            this.webSocket?.send(message)
            if (typeof callback !== 'undefined') {
                callback();
            }
          }
        // this.waitForConnection(() => {
        //     this.webSocket?.send(JSON.stringify(message));
        //     if (typeof callback !== 'undefined') {
        //         callback();
        //     }
        // }, 100);
    };

    // send = (message: string, callback?: any) => {
    //     this.waitForConnection(() => {
    //         this.webSocket?.send(message);
    //         if (typeof callback !== 'undefined') {
    //             callback();
    //         }
    //     }, 100);
    // };

    
    
    public get ready() : boolean {
        return this.webSocket?.readyState === 1;
    }
    

    private connectTo = (host?: string): WebSocket | undefined => {
        host ??= this.defaultHost;
        try {
            const webSocket = new WebSocket(host);
            // webSocket.onopen = function () { };
            webSocket.onmessage = (event) => {
                let response = JSON.parse(event.data);
                this.processServerMessage(response);
            };
            //this should really be replaced with Sockette
            webSocket.onclose = (e) => {
                if (e.code !== 4999) {
                    console.log('Socket is closed. Reconnect will be attempted in 5 seconds.', e.reason);
                    setTimeout(() => {
                        this.connectTo(host);
                    }, 5000);
                }
            };

            webSocket.onerror = function (err) {
                //console.error('Socket encountered error: ', err.message, 'Closing socket');
                webSocket.close();
            };
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
            handler(response);
        } else {
            console.log('received unmatched server message!', response);
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
                ? chrome.runtime.getURL("images/discreeterror.png")
                : chrome.runtime.getURL("images/error.gif");
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