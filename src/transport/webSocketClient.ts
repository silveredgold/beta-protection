import { createPreferencesFromBackend, getAvailablePlaceholders, getEnabledPlaceholders, loadPreferencesFromStorage, savePreferencesToStorage } from "@/preferences";
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

    private webSocket?: WebSocket;

    defaultHost = "ws://localhost:8090/ws"

    waitForConnection = (callback: () => void, interval: number) => {
        if (this.webSocket?.readyState === 1) {
            callback();
        } else {
            // optional: implement backoff for interval here
            setTimeout(() => {
                this.waitForConnection(callback, interval);
            }, interval);
        }
    }

    sendObj = (message: object, callback?: any) => {
        this.waitForConnection(() => {
            this.webSocket?.send(JSON.stringify(message));
            if (typeof callback !== 'undefined') {
                callback();
            }
        }, 100);
    };

    send = (message: string, callback?: any) => {
        this.waitForConnection(() => {
            this.webSocket?.send(message);
            if (typeof callback !== 'undefined') {
                callback();
            }
        }, 100);
    };

    
    
    public get ready() : boolean {
        return this.webSocket?.readyState === 1;
    }
    

    private connectTo = (host?: string): WebSocket | undefined => {
        host ??= this.defaultHost;
        try {
            const webSocket = new WebSocket(host);
            /* Hi! Do you see an error on the line above? That's most likely because you're
             * not running the backend .exe, or because the extension cannot reach it.
             * Maybe your firewall is blocking it? You always need to run the backend .exe
             * whenever you use the extension, because that part does the censoring!
             */
            webSocket.onopen = function () { };
            webSocket.onmessage = (event) => {
                let response = JSON.parse(event.data);
                if (response.requestType === "censorImage") {
                    console.log(`censored image response: ${response}`);
                    this.processCensoredImageResponse(response);
                } else if (response.requestType === "detectPlaceholdersAndStickers") {
                    this.processPlaceholderAndStickerResponse(response);
                } else if (response.requestType === "getStatistics") {
                    chrome.runtime.sendMessage({
                        msg: 'statisticsInfo',
                        data: response["logs"]
                    });
                } else if (response.requestType === "getUserPreferences") {
                    this.processUserPreferences(response);
                    // setLoadedPreferences(response["preferences"]); //TODO
                }
            };

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

    processCensoredImageResponse = async (response) => {
        let placeholders = await getEnabledPlaceholders();
        let url: string;
        console.log(`parsing image response`, response);
        if (parseInt(response.status) === 200 || parseInt(response.status) === 304) {
            url = response.url;
        } else {
            if (placeholders.categories.indexOf("Discreet") > -1) {
                url = chrome.runtime.getURL("images/discreeterror.png");
            } else {
                url = chrome.runtime.getURL("images/error.gif");
            }
        }
        let body = {
            msg: "setSrc", censorURL: url,
            id: response.id, tabid: response.tabid, type: response.type
        };

        chrome.tabs.sendMessage(parseInt(response.tabid), body);
    }

    processPlaceholderAndStickerResponse = (response) => {
        if (parseInt(response.status) === 200) {
            console.log(`sticker response:`)
            console.log(response);
            PlaceholderService.loadAvailablePlaceholders(response)
            StickerService.loadAvailableStickers(response);

        }
    }

    processUserPreferences = async (response): Promise<IPreferences> => {
        let preferences = await loadPreferencesFromStorage();
        if (parseInt(response.status) === 200) {
            let rawPrefs = response["preferences"] as rawPreferences;
            // console.log('raw prefs: ', rawPrefs);
            let backendPrefs = createPreferencesFromBackend(rawPrefs);
            // console.log('backend prefs', backendPrefs);
            // console.log('loaded prefs', preferences);
            let mergedPrefs = {
                ...backendPrefs,
                ...preferences
            };
            // console.log('merged prefs', mergedPrefs);
            await savePreferencesToStorage(mergedPrefs, true);
            let newPrefs = await loadPreferencesFromStorage();
            // console.log('new prefs as stored:', newPrefs);
            return mergedPrefs;
        }
        return preferences;
    }

    close = () => {
        this.webSocket?.close(4999);
    }
}