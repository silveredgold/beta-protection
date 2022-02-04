import { createPreferencesFromBackend, getAvailablePlaceholders, loadPreferencesFromStorage } from "@/preferences";
import { IPreferences, rawPreferences } from "@/preferences/types";

export class WebSocketClient {

    static create = async (host?: string): Promise<WebSocketClient> => {
        if (!host) {
            let configHost = await chrome.storage.local.get('backendHost');
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

    defaultHost = "ws://mir:8090/ws"

    waitForConnection = (callback, interval) => {
        if (this.webSocket?.readyState === 1) {
            callback();
        } else {
            let that = this;
            // optional: implement backoff for interval here
            setTimeout(function () {
                that.waitForConnection(callback, interval);
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
                    console.log(response["preferences"]);
                    this.processUserPreferences(response);
                    // setLoadedPreferences(response["preferences"]); //TODO
                }
            };

            webSocket.onclose = (e) => {
                console.log('Socket is closed. Reconnect will be attempted in 5 seconds.', e.reason);
                setTimeout(() => {
                    this.connectTo(host);
                }, 5000);
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
        let placeholders = await getAvailablePlaceholders();
        let url: string;
        console.log(`parsing image response: ${JSON.stringify(response)}`);
        if (parseInt(response.status) === 200 || parseInt(response.status) === 304) {
            url = response.url;
            //console.log(response.url);
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
            let placeholderCategories = response["placeholders"];
            let stickerCategories = response["stickers"];
            let obj = {};
            obj["placeholders"] = placeholderCategories;
            obj["stickers"] = stickerCategories;
            placeholderCategories.forEach(category => obj[category] = response[category]);
            chrome.storage.local.set(obj);

        }
    }

    processUserPreferences = async (response): Promise<IPreferences> => {
        let preferences = await loadPreferencesFromStorage();
        if (parseInt(response.status) === 200) {
            let rawPrefs = response["preferences"] as rawPreferences;
            let backendPrefs = createPreferencesFromBackend(rawPrefs);

            let mergedPrefs = {
                ...preferences,
                ...backendPrefs
            };
            console.log(mergedPrefs);
            console.log('done!');
            await chrome.storage.local.set({ 'preferences': mergedPrefs });
            console.log('set in storage!');
            let newPrefs = await loadPreferencesFromStorage();
            console.log('new:', newPrefs);
            return mergedPrefs;
        }
        return preferences;
    }
}