import { setModeBadge, toTitleCase } from "@/util";
import { defaultExtensionPrefs, IExtensionPreferences, IPreferences } from "@/preferences";
import clone from "just-clone";
import browser from 'webextension-polyfill';
import { MSG_UPDATE_PREFS } from "@/messaging";
import { OverrideService } from "@/services/override-service";


export async function loadPreferencesFromStorage(): Promise<IExtensionPreferences> {
    const result = await browser.storage.local.get('preferences');
    let storedPrefs = result['preferences'] as IExtensionPreferences;
    const overService = await OverrideService.create();
    if (storedPrefs && storedPrefs.mode && overService.active) {
        const merged: IExtensionPreferences = {
            ...storedPrefs,
            ...overService.current?.preferences
        };
        if (!overService.current!.allowedModes.includes(storedPrefs.mode)) {
            merged.mode = overService.current!.allowedModes[0];
        }
        storedPrefs = merged;
    }
    setModeBadge(storedPrefs?.mode);
    return storedPrefs;
}

export async function savePreferencesToStorage(prefs: IExtensionPreferences, skipClone: boolean = false): Promise<void> {
    const clonedPrefs = skipClone ? prefs : clone(prefs);
    await browser.storage.local.set({ 'preferences': clonedPrefs });
}

export async function mergeNewPreferences(prefs: Partial<IPreferences>, preferSaved: boolean = true): Promise<void> {
    const clonedPrefs = clone(prefs);

    const storedPrefs = await loadPreferencesFromStorage();
    const mergedPrefs = preferSaved
        ? {
            ...defaultExtensionPrefs,
            ...clonedPrefs,
            ...storedPrefs
        }
        : {
            ...defaultExtensionPrefs,
            ...storedPrefs,
            ...clonedPrefs
        }
    await savePreferencesToStorage(mergedPrefs, true);
    // setModeBadge(mergedPrefs.mode);
}

export function updateBackendPreferences(prefs: IPreferences) {
    return new Promise<boolean>((resolve, reject) => {
        const port = browser.runtime.connect({name: 'preferences:backend'});
        port.onMessage.addListener((msg, port) => {
            if (msg.msg == 'updatePreferences') {
                const success = msg.update as boolean;
                port.disconnect();
                resolve(success);
            } else {
                reject('wait what');
                port.disconnect();
            }
        });
        port.postMessage({msg: MSG_UPDATE_PREFS.event});
    });
}

export const mergePreferences = async (backendPrefs: Partial<IPreferences>) => {
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
    // setModeBadge(newPrefs.mode);
    return mergedPrefs;
};