import { loadPreferencesFromStorage, savePreferencesToStorage, IPreferences } from "@/preferences";
import { setModeBadge } from "@/util";
import { StickerService } from "@/services/sticker-service";
import { RuntimePortManager } from "@/transport/runtimePort";
import { ICensorBackend } from "@/transport";
import browser from 'webextension-polyfill';


export class ExtensionEventHandler {
    static RegisterEvents(backend: ICensorBackend, portManager: RuntimePortManager) {
        backend.onReceivePreferences.subscribe((sender, prefs) => {
            mergePrefs(prefs);
        });
        backend.onUpdate.subscribe(payload => {
            if (payload.entityType == 'stickers') {
                saveStickers(payload.eventData['categories']);
            }
            if (payload.entityType == 'statistics') {
            }
        });
        backend.onImageCensored.subscribe(async (sender, payload) => {
            const prefs = payload.responseData['preferences']
                ? payload.responseData['preferences']
                : await loadPreferencesFromStorage();
            if (payload.error) {
                console.log(`error image response`, payload);
                payload.url = prefs.errorMode === 'normal'
                    ? browser.runtime.getURL("images/error_normal.jpg")
                    : browser.runtime.getURL("images/error_simple.png");
            }
            const body = {
                msg: "setSrc", censorURL: payload.url, id: payload.id, 
                tabid: payload.srcId ? +payload.srcId : undefined, error: payload.error
            };
            portManager.sendMessage(body, payload.id);
        })
    }

    

}

const mergePrefs = async (backendPrefs: Partial<IPreferences>) => {
    const log = (...data: any[]) => {
        // console.debug(...data);
        //this is just here to make debugging things easier
        // this is so chatty, even using dbg would be annoying
    };
    const preferences = await loadPreferencesFromStorage();
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
};

const saveStickers = async (response: any) => {
    StickerService.loadAvailableStickers(response);
};