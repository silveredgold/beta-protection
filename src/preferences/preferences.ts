import { toTitleCase } from "@/util";
import { IPreferences } from "@/preferences";
import clone from "just-clone";
import browser from 'webextension-polyfill';
import { MSG_UPDATE_PREFS } from "@/messaging";
import { defaultPrefs } from "@/preferences";
import { OverrideService } from "@/services/override-service";


export async function loadPreferencesFromStorage(): Promise<IPreferences> {
    const result = await browser.storage.local.get('preferences');
    const storedPrefs = result['preferences'] as IPreferences;
    const overService = await OverrideService.create();
    if (overService.active) {
        const merged: IPreferences = {
            ...storedPrefs,
            ...overService.current?.preferences
        };
        if (!overService.current!.allowedModes.includes(storedPrefs.mode)) {
            merged.mode = overService.current!.allowedModes[0];
        }
    }
    return storedPrefs;
}

export async function savePreferencesToStorage(prefs: IPreferences, skipClone: boolean = false): Promise<void> {
    const clonedPrefs = skipClone ? prefs : clone(prefs);
    await browser.storage.local.set({ 'preferences': clonedPrefs });
}

export async function mergeNewPreferences(prefs: IPreferences): Promise<void> {
    const clonedPrefs = clone(prefs);
    
    const storedPrefs = await loadPreferencesFromStorage();
    const mergedPrefs = {
        ...defaultPrefs,
        ...storedPrefs,
        ...clonedPrefs
    };
    await savePreferencesToStorage(mergedPrefs, true);
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