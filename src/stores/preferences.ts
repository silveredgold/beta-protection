import { defaultExtensionPrefs, IExtensionPreferences, IPreferences, OperationMode } from "@/preferences";
import { OverrideService } from "@/services/override-service";
import { setModeBadge } from "@/util";
import clone from "just-clone";
import { defineStore } from "pinia";
import browser from 'webextension-polyfill';

export interface ExtensionState {
    basePreferences: IExtensionPreferences;
    // preferences: IExtensionPreferences;
    overridePreferences?: Partial<IExtensionPreferences>;
    allowedModes: OperationMode[]
}

const usePreferencesStore = defineStore('preferences', {
    state: (): ExtensionState => {
        return { basePreferences: undefined!, overridePreferences: undefined!, allowedModes: [] }
    },
    getters: {
        mode(): OperationMode {
            if (!this.allowedModes.includes(this.basePreferences.mode)) {
                return this.allowedModes[0];
            }
            return this.basePreferences.mode;
        },
        currentPreferences(): IExtensionPreferences {
            let storedPrefs = this.basePreferences;
            let overridePrefs = this.overridePreferences;
            const merged: IExtensionPreferences = {
                ...storedPrefs,
                ...overridePrefs
            };
            // if (!overService.current!.allowedModes.includes(storedPrefs.mode)) {
            //     merged.mode = overService.current!.allowedModes[0];
            // }
            setModeBadge(this.mode);
            return merged;
        }
    },
    actions: {
        async load() {
            const result = await browser.storage.local.get('preferences');
            let storedPrefs = result['preferences'] as IExtensionPreferences;
            this.basePreferences = storedPrefs;
            const overService = await OverrideService.create();
            this.allowedModes = [OperationMode.Enabled, OperationMode.OnDemand, OperationMode.Disabled]
            if (storedPrefs && storedPrefs.mode && overService.active) {
                this.overridePreferences = overService.current?.preferences;
                if (overService.current && overService.current.allowedModes.length > 0) {
                    this.allowedModes = overService.current.allowedModes;
                }
            }
            return this.currentPreferences
        },
        async save(prefs?: IExtensionPreferences, skipClone: boolean = false) {
            prefs = prefs || this.basePreferences;
            const clonedPrefs = skipClone ? prefs : clone(prefs);
            await browser.storage.local.set({ 'preferences': clonedPrefs });
        },
        async merge(prefs: Partial<IPreferences>, preferSaved: boolean = true) {
            const clonedPrefs = clone(prefs);
            const storedPrefs = this.basePreferences;
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
            await this.save(mergedPrefs, true);
        }
    }
});

const loadPreferencesStore = async () => {
    const store = usePreferencesStore();
    await store.load();
    return store;
}