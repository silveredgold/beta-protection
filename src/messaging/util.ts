import { IPreferences, loadPreferencesFromStorage, toRaw } from "@/preferences";
import { RuntimeEvent } from "./placeholders";

export const MSG_RESET_STATISTICS: RuntimeEvent<void> = {
    event: "resetStatistics",
    handler: async (msg, sender, sendResponse, ctx) => {
        ctx.socketClient!.send(JSON.stringify({
            version: ctx.version,
            msg: "resetStatistics"
        }));
    }
}

export const MSG_GET_STATISTICS: RuntimeEvent<void> = {
    event: "getStatistics",
    handler: async (msg, sender, resposne, ctx) => {
        ctx.socketClient.send(JSON.stringify({
            version: ctx.version,
            msg: "getStatistics"
        }));
    }
}

export const MSG_CENSOR_REQUEST: RuntimeEvent<void> = {
    event: 'censorRequest',
    handler: async (message, sender, response, ctx) => {
        let img = String(message.imageURL);
        idUrlMap.set(message.id, img);
        let preferences: IPreferences;
        if (message.prefs !== undefined) {
            preferences = message.prefs as IPreferences;
        } else {
            preferences = await loadPreferencesFromStorage();
        }
        let requestType = "censorImage";
        if (preferences.autoAnimate) {
            requestType = "redoCensor";
        }
        let rawPrefs = toRaw(preferences);
        /*console.log(`prefs as sent:`, preferences);
        console.log(`raw prefs sent`, rawPrefs); */
        ctx.socketClient.send(JSON.stringify({
            version: ctx.version,
            msg: requestType,
            url: img,
            tabid: sender.tab!.id,
            id: message.id,
            priority: message.priority,
            preferences: rawPrefs,
            type: message.type,
            domain: message.domain
        }));
    }
}

export const idUrlMap = new Map();
