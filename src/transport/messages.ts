import { createPreferencesFromBackend, IPreferences, loadPreferencesFromStorage, rawPreferences, savePreferencesToStorage } from "@/preferences"
import { PlaceholderService } from "@/services/placeholder-service"
import { StickerService } from "@/services/sticker-service"
import browser from 'webextension-polyfill';
import { StatisticsService } from "@/services/statistics-service";
import { setModeBadge, dbg } from "@/util";
import { IWebSocketClient } from "@/events";

// this file should be unnecessary now, retaining for compatibility and testing.

export type SocketEvent<Type> = {
    event: string;
    handler: (message: any, ctx: SocketContext) => Promise<Type>
}

export type SocketContext = {
    socketClient?: IWebSocketClient;
    sendMessage : (obj: object, requestId?: string, tabId?: string) => Promise<void>
}

export const placeholderStickerEvent : SocketEvent<void> = {
    event: 'detectPlaceholdersAndStickers',
    handler: async (response, ctx) => {
        if (parseInt(response.status) === 200) {
            //TODO: we don't actually need to do this anymore, we don't use the backend placeholders anywhere
            PlaceholderService.loadBackendPlaceholders(response)
            StickerService.loadAvailableStickers(response);
        }
    }
}

export const censoredImageEvent : SocketEvent<void> = {
    event: 'censorImage',
    handler: async (response, ctx) => {
        let errorMsg: string|undefined;
        const prefs = await loadPreferencesFromStorage();
        let url: string;
        if (parseInt(response.status) === 200 || parseInt(response.status) === 304) {
            url = response.url;
        } else {
            console.log(`error image response`, response);
            url = prefs.errorMode === 'normal'
                ? browser.runtime.getURL("images/error_normal.jpg")
                : browser.runtime.getURL("images/error_simple.png");
            errorMsg = response.url;
            // we don't have an NSFW error screen yet
            // ignore that, we do now
        }
        const body = {
            msg: "setSrc", censorURL: url,
            id: response.id, tabid: response.tabid, 
            type: response.type, error: errorMsg
        };
        ctx.sendMessage(body, response.id, response.tabid);
    }
}

export const preferencesEvent : SocketEvent<IPreferences> = {
    event: 'getUserPreferences',
    handler: async (response, ctx) => {
        const log = (...data: any[]) => {
            // console.debug(...data);
            //this is just here to make debugging things easier
            // this is so chatty, even using dbg would be annoying
        }
        const preferences = await loadPreferencesFromStorage();
        if (parseInt(response.status) === 200) {
            const rawPrefs = response["preferences"] as rawPreferences;
            log('raw prefs', rawPrefs);
            const backendPrefs = createPreferencesFromBackend(rawPrefs);
            log('backend prefs', backendPrefs);
            log('loaded prefs', preferences);
            const mergedPrefs = {
                ...backendPrefs,
                ...preferences
            };
            log('merged prefs', mergedPrefs);
            await savePreferencesToStorage(mergedPrefs, true);
            const newPrefs = await loadPreferencesFromStorage();
            log('new prefs as stored:', newPrefs);
            setModeBadge(newPrefs.mode);
            return mergedPrefs;
        }
        return preferences;
    }
}

export const statisticsEvent : SocketEvent<void> = {
    event: 'getStatistics',
    handler: async (response, ctx) => {
        if (parseInt(response.status) === 200) {
            const rawLogs = response["logs"] as string;
            const stats = StatisticsService.parseRaw(rawLogs);
            dbg('parsed stats data', stats);
            ctx.sendMessage({msg: "reloadStatistics", statistics: stats}, "statistics");
        }
    }
}

export const resetStatisticsEvent : SocketEvent<void> = {
    event: 'resetStatistics',
    handler: async (response, ctx) => {
        const success = parseInt(response.status) === 200;
        ctx.sendMessage({msg: "resetStatistics", reset: success}, "statistics:reset");
    }
}

export const updatePreferencesEvent : SocketEvent<void> = {
    event: 'updatePreferences',
    handler: async (response, ctx) => {
        const success = parseInt(response.status) === 200;
        ctx.sendMessage({msg: 'updatePreferences', update: success}, "preferences:backend");
    }
}