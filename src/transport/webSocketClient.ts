export class WebSocketClient {

    /**
     *
     */
    constructor(host?: string) {
        this.webSocket = this.connectTo(host);

    }

    private webSocket?: WebSocket;

    defaultHost = "ws://localhost:8090/ws"

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
                    this.processCensoredImageResponse(response);
                } else if (response.requestType === "detectPlaceholdersAndStickers") {
                    this.processPlaceholderAndStickerResponse(response);
                } else if (response.requestType === "getStatistics") {
                    chrome.runtime.sendMessage({
                        msg: 'statisticsInfo',
                        data: response["logs"]
                    });
                } else if (response.requestType === "getUserPreferences") {
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

    processCensoredImageResponse = (response) => {
        chrome.storage.local.get(["selectedPlaceholders"], function (selectedCategoryList) {
            let selected = selectedCategoryList["selectedPlaceholders"];
            let url;
            if (parseInt(response.status) === 200 || parseInt(response.status) === 304) {
                url = response.url;
                //console.log(response.url);
            } else {
                if (selected.indexOf("Discreet") > -1) {
                    url = chrome.runtime.getURL("images/discreeterror.png");
                } else {
                    url = chrome.runtime.getURL("images/error.gif");
                }
            }
            chrome.tabs.sendMessage(parseInt(response.tabid), {
                msg: "setSrc", censorURL: url,
                id: response.id, tabid: response.tabid, type: response.type
            });
        });
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
}