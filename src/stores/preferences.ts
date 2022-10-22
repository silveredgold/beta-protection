import { defaultExtensionPrefs, IExtensionPreferences, IOverride, IPreferences, OperationMode } from "@/preferences";
import { OverrideService } from "@/services/override-service";
import { setModeBadge } from "@/util";
import clone from "just-clone";
import { defineStore } from "pinia";
import browser from 'webextension-polyfill';

export interface ExtensionState {
    basePreferences?: IExtensionPreferences;
    override?: IOverride<IExtensionPreferences>;
    allowedModes: OperationMode[],
    $service: PreferencesService
}

export const buildPreferencesStore = (delayMs?: number) => defineStore('preferences', {
    state: (): ExtensionState => {
        return { basePreferences: undefined!, override: undefined, allowedModes: [], $service: undefined! }
    },
    getters: {
        mode(): OperationMode {
            if (this.basePreferences?.mode && !this.allowedModes.includes(this.basePreferences.mode)) {
                return this.allowedModes[0];
            }
            return this.basePreferences?.mode || OperationMode.Enabled;
        },
        currentPreferences(): IExtensionPreferences {
            return this.$service?.currentPreferences!;
        }, currentOverride(): IOverride<IExtensionPreferences> | undefined {
            return this.override;
        }, overridePreferences(): Partial<IExtensionPreferences> | undefined {
            return this.currentOverride?.preferences;
        }
    },
    actions: {
        async load() {
            this.$service = await PreferencesService.create();
            const { allowedModes, basePreferences, override } = this.$service;
            this.allowedModes = allowedModes;
            this.basePreferences = basePreferences;
            if (override) {
                this.override = override;
            }
            return this.currentPreferences
        },
        async save(prefs?: IExtensionPreferences, skipClone: boolean = false) {
            prefs = prefs || this.basePreferences;
            if (prefs) {
                await this.$service.save(prefs || this.basePreferences, skipClone);
            }
        },
        async merge(prefs: Partial<IPreferences>, preferSaved: boolean = true) {
            await this.$service.merge(prefs, preferSaved);
        },
        async setMode(mode: OperationMode) {
            // dbg(`saving new mode ${mode.value}`);
            if (this.basePreferences && mode) {
                this.basePreferences.mode = mode;
            }
            await this.save();
            await this.load();
            setModeBadge(this.basePreferences!.mode);
        }
    }, debounce: {save: delayMs || 400}
})();

export const usePreferencesStore = buildPreferencesStore;

// export const usePreferencesStore = (delayMs?: number) => {
//     return buildPreferencesStore(delayMs);
// }

export const loadPreferencesStore = async (delayMs?: number) => {
    const store = usePreferencesStore(delayMs);
    await store.load();
    return store;
}

export class PreferencesService {

    basePreferences: IExtensionPreferences 
    override?: IOverride<IExtensionPreferences>
    allowedModes: OperationMode[];
    /**
     *
     */
    private constructor(currentPrefs: IExtensionPreferences, allowedModes: OperationMode[], override?: IOverride<IExtensionPreferences>) {
        this.basePreferences = currentPrefs;
        this.allowedModes = allowedModes;
        this.override = override;
    }

    static async create() {
        const { basePreferences, allowedModes, override } = await PreferencesService.load();
        return new PreferencesService(basePreferences, allowedModes, override);
    }

    async merge(newPrefs: Partial<IPreferences>, preferSaved: boolean = true) {
        await PreferencesService.merge(newPrefs, this.basePreferences, preferSaved);
    }

    async save(prefs?: IExtensionPreferences, skipClone: boolean = false) {
        prefs = prefs || this.basePreferences;
            if (prefs) {
                await PreferencesService.save(prefs, skipClone);
            }
    }

    public get currentPreferences() {
        const storedPrefs = this.basePreferences;
        const overridePrefs = this.override;
        const merged: IExtensionPreferences = {
            ...storedPrefs!,
            ...overridePrefs
        };
        setModeBadge(merged.mode);
        return merged;
    }

    public get mode(): OperationMode {
        if (this.basePreferences?.mode && !this.allowedModes.includes(this.basePreferences.mode)) {
            return this.allowedModes[0];
        }
        return this.basePreferences?.mode || OperationMode.Enabled;
    }

    static async load() {
        const result = await browser.storage.local.get('preferences');
            const storedPrefs = result['preferences'] as IExtensionPreferences;
            const basePreferences = storedPrefs;
            const overService = await OverrideService.create();
            let override: IOverride<IExtensionPreferences>|undefined = undefined;
            let allowedModes = [OperationMode.Enabled, OperationMode.OnDemand, OperationMode.Disabled]
            if (storedPrefs && storedPrefs.mode && overService.active) {
                override = overService.current;
                if (overService.current && overService.current.allowedModes.length > 0) {
                    allowedModes = overService.current.allowedModes;
                }
            }
            return {
                basePreferences, allowedModes, override
            }
    }

    static async save(prefs: IExtensionPreferences, skipClone: boolean = false) {
        const clonedPrefs = skipClone ? prefs : clone(prefs!);
        await browser.storage.local.set({ 'preferences': clonedPrefs });
    }

    static async merge(newPrefs: Partial<IPreferences>, oldPrefs: Partial<IPreferences>, preferSaved: boolean = true) {
        const clonedPrefs = clone(newPrefs);
        const storedPrefs = oldPrefs;
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
        await PreferencesService.save(mergedPrefs, true);
    }
}