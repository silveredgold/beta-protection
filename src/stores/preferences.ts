import { defaultExtensionPrefs, IExtensionPreferences, IOverride, IPreferences, OperationMode } from "@/preferences";
import { OverrideService } from "@/services/override-service";
import { setModeBadge } from "@/util";
import clone from "just-clone";
import { defineStore } from "pinia";
import browser from 'webextension-polyfill';

export interface ExtensionState {
    basePreferences?: IExtensionPreferences;
    override?: IOverride<IExtensionPreferences>;
    allowedModes: OperationMode[]
}

export const usePreferencesStore = (delayMs?: number) => defineStore('preferences', {
    state: (): ExtensionState => {
        return { basePreferences: undefined!, override: undefined, allowedModes: [] }
    },
    getters: {
        mode(): OperationMode {
            if (this.basePreferences?.mode && !this.allowedModes.includes(this.basePreferences.mode)) {
                return this.allowedModes[0];
            }
            return this.basePreferences?.mode || OperationMode.Enabled;
        },
        currentPreferences(): IExtensionPreferences {
            const storedPrefs = this.basePreferences;
            const overridePrefs = this.overridePreferences;
            const merged: IExtensionPreferences = {
                ...storedPrefs!,
                ...overridePrefs
            };
            // if (!overService.current!.allowedModes.includes(storedPrefs.mode)) {
            //     merged.mode = overService.current!.allowedModes[0];
            // }
            setModeBadge(this.mode);
            return merged;
        }, currentOverride(): IOverride<IExtensionPreferences> | undefined {
            return this.override;
        }, overridePreferences(): Partial<IExtensionPreferences> | undefined {
            return this.currentOverride?.preferences;
        }
    },
    actions: {
        async load() {
            const result = await browser.storage.local.get('preferences');
            const storedPrefs = result['preferences'] as IExtensionPreferences;
            this.basePreferences = storedPrefs;
            const overService = await OverrideService.create();
            this.allowedModes = [OperationMode.Enabled, OperationMode.OnDemand, OperationMode.Disabled]
            if (storedPrefs && storedPrefs.mode && overService.active) {
                this.override = overService.current;
                if (overService.current && overService.current.allowedModes.length > 0) {
                    this.allowedModes = overService.current.allowedModes;
                }
            }
            return this.currentPreferences
        },
        async save(prefs?: IExtensionPreferences, skipClone: boolean = false) {
            prefs = prefs || this.basePreferences;
            const clonedPrefs = skipClone ? prefs : clone(prefs!);
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
    }, debounce: {save: delayMs || 400}
})();

const loadPreferencesStore = async () => {
    const store = usePreferencesStore();
    await store.load();
    return store;
}