import { CSSManager } from "@/content-scripts/cssManager";
import { IPreferences, loadPreferencesFromStorage, toRaw } from "@/preferences";
import { RuntimeEvent } from "./placeholders";

const pendingMessages: {id: string, task: Deferred}[] = [];

export const MSG_STATUS: RuntimeEvent<{queue: number, state: boolean}> = {
    event: 'getSocketStatus',
    handler: async (msg, sender, ctx) => {
        return {queue: pendingMessages.length, state: false};
    }
}

export const MSG_RESET_STATISTICS: RuntimeEvent<void> = {
    event: "resetStatistics",
    handler: async (msg, sender, ctx) => {
        ctx.socketClient!.send(JSON.stringify({
            version: ctx.version,
            msg: "resetStatistics"
        }));
    }
}

export const MSG_GET_STATISTICS: RuntimeEvent<void> = {
    event: "getStatistics",
    handler: async (msg, sender, ctx) => {
        ctx.socketClient.send(JSON.stringify({
            version: ctx.version,
            msg: "getStatistics"
        }));
    }
}

export const MSG_CENSOR_REQUEST: RuntimeEvent<any> = {
    event: 'censorRequest',
    handler: async (message, sender, ctx) => {
        let img = String(message.imageURL);
        idUrlMap.set(message.id, img);
        let preferences: IPreferences;
        if (message.prefs !== undefined) {
            preferences = message.prefs as IPreferences;
        } else {
            preferences = await loadPreferencesFromStorage();
        }
        let requestType = "censorImage";
        if (preferences.autoAnimate || message.forceCensor) {
            console.log('forcing to redo message type');
            requestType = "redoCensor";
        }
        let rawPrefs = toRaw(preferences);
        /*console.log(`prefs as sent:`, preferences);
        console.log(`raw prefs sent`, rawPrefs); */
        const deferred = {id: message.id, task: new Deferred()};
        pendingMessages.push(deferred);
            ctx.socketClient.sendObj({
                version: ctx.version,
                msg: requestType,
                url: img,
                tabid: message['tabId'] ?? sender.tab!.id,
                id: message.id,
                priority: message.priority,
                preferences: rawPrefs,
                type: message.type,
                domain: message.domain
            });
        return deferred.task.promise;
    }
}
export const MSG_INJECT_CSS: RuntimeEvent<void> = {
    event: 'injectCSS',
    handler: async (request, sender, ctx) => {
        let tabId = sender.tab?.id;
        // console.debug(`got injectCSS for ${tabId}`);
        if (tabId) {
          let prefs = request.preferences as IPreferences;
          let css = new CSSManager(tabId, prefs);
          await css.addCSS();
          await css.addVideo();
        }
    }
}


    

export const idUrlMap = new Map();

export class Deferred {
    promise: Promise<any>;
    reject?: (reason?: any) => void;
    resolve?: (value: unknown) => void;
    constructor() {
      this.promise = new Promise<any>((resolve, reject)=> {
        this.reject = reject
        this.resolve = resolve
      })
    }
  }