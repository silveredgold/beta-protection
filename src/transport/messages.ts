import { createPreferencesFromBackend, IPreferences, loadPreferencesFromStorage, rawPreferences, savePreferencesToStorage } from "@/preferences"
import { PlaceholderService } from "@/services/placeholder-service"
import { StickerService } from "@/services/sticker-service"
import { WebSocketClient } from "./webSocketClient"
import browser from 'webextension-polyfill';

export type SocketEvent<Type> = {
    event: string;
    handler: (message: any, ctx: SocketContext) => Promise<Type>
}

export type SocketContext = {
    socketClient?: WebSocketClient;
    sendMessage : (requestId: string, tabId: string, obj: object) => Promise<void>
}

export const placeholderStickerEvent : SocketEvent<void> = {
    event: 'detectPlaceholdersAndStickers',
    handler: async (response, ctx) => {
        if (parseInt(response.status) === 200) {
            console.log(`sticker response:`, response)
            //TODO: we don't actually need to do this anymore, we don't use the backend placeholders anywhere
            PlaceholderService.loadBackendPlaceholders(response)
            StickerService.loadAvailableStickers(response);
        }
    }
}

export const censoredImageEvent : SocketEvent<void> = {
    event: 'censorImage',
    handler: async (response, ctx) => {
        const prefs = await loadPreferencesFromStorage();
        let url: string;
        // console.log(`parsing image response`, response);
        if (parseInt(response.status) === 200 || parseInt(response.status) === 304) {
            url = response.url;
        } else {
            console.log(`error image response`, response);
            url = prefs.errorMode === 'normal'
                ? browser.runtime.getURL("images/error_normal.jpg")
                : browser.runtime.getURL("images/error_simple.png");
            // we don't have an NSFW error screen yet
            // ignore that, we do now
        }
        const body = {
            msg: "setSrc", censorURL: url,
            id: response.id, tabid: response.tabid, type: response.type
        };
        ctx.sendMessage(response.id, response.tabid, body);
    }
}

export const preferencesEvent : SocketEvent<IPreferences> = {
    event: 'getUserPreferences',
    handler: async (response, ctx) => {
        const log = (...data: any[]) => {
            // console.debug(...data);
            //this is just here to make debugging things easier
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
            return mergedPrefs;
        }
        return preferences;
    }
}