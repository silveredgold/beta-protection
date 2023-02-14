import { defaultExtensionPrefs, IExtensionPreferences, IOverride, IPreferences, OperationMode } from "@/preferences";
import { OverrideService } from "@/services/override-service";
import { dbg, dbgLog, nameof, setModeBadge } from "@/util";
import clone from "just-clone";
import { defineStore, Pinia } from "pinia";
import browser from 'webextension-polyfill';
import { useOverrideStore } from "./overrides";
import { getPinia } from "./util";

export interface ExtensionState {
    basePreferences?: IExtensionPreferences;
    override?: IOverride<IExtensionPreferences>;
    // allowedModes: OperationMode[],
    // $service: PreferencesService
}

export const buildPreferencesStore = (delayMs?: number, pinia?: Pinia|null|undefined, readOnly?: boolean|undefined) => defineStore('preferencesStore', {
    state: (): ExtensionState => {
        return { basePreferences: undefined!, }
    },
    getters: {
        allowedModes(): OperationMode[] {
          const prefs = this.currentPreferences;
          let allowedModes = [OperationMode.Enabled, OperationMode.OnDemand, OperationMode.Disabled];
          const override = this.currentOverride;
            if (override && override.allowedModes && override.allowedModes.length > 0) {
                    allowedModes = override.allowedModes;
                }
              return allowedModes;
        },
        mode(): OperationMode {
            if (this.basePreferences?.mode && !this.allowedModes.includes(this.basePreferences.mode)) {
                return this.allowedModes[0];
            }
            return this.basePreferences?.mode || OperationMode.Enabled;
        },
        currentPreferences(): IExtensionPreferences {
            // return this.$service?.currentPreferences!;
            const storedPrefs = this.basePreferences;
            const overridePrefs = this.currentOverride?.preferences;
            const merged: IExtensionPreferences = {
                ...storedPrefs!,
                ...overridePrefs
            };
            setModeBadge(merged.mode);
            return merged;
        },
        currentOverride(): IOverride<IExtensionPreferences> | undefined {
          const overrideStore = useOverrideStore(undefined, true);
          // console.log('pulling overrides from store in preferences getter', overrideStore.isOverrideActive, overrideStore.currentOverride);
          const overridePrefs = overrideStore.isOverrideActive ? overrideStore.currentOverride : undefined;
          return overridePrefs;
        }
    },
    actions: {
        async load() {
            // this is only retained for legacy compatibility.
            // rather than calling this no-side-effects action, consumers
            // should just await store.ready in the first place.
            await this.ready;
            return this.currentPreferences;
        },
        async save(prefs?: IExtensionPreferences, skipClone: boolean = false) {
            dbgLog('in store save', prefs);
            prefs = prefs || this.currentPreferences;
            if (prefs) {
                dbg(`not calling service`, prefs.mode);
                this.basePreferences = prefs;
                // await this.$service.save(prefs, skipClone).then(async () => {
                //   await this.load();
                // });
            }
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
            this.$patch({basePreferences: mergedPrefs});
            // await this.$service.merge(prefs, preferSaved);
        },
        async setMode(mode: OperationMode) {
            dbg(`saving new mode ${mode}`);
            if (this.currentPreferences && mode) {
              if (this.allowedModes.includes(mode)) {
                dbg(`updating current prefs from ${this.currentPreferences.mode} to ${mode}`);
                this.currentPreferences.mode = mode;
                await this.save({...this.currentPreferences, mode});
              } else {
                dbg('rejecting mode change as not allowed');
              }
            }
            // await this.load();
            setModeBadge(this.currentPreferences!.mode);
        }
    }, debounce: {save: delayMs || 400}, readOnly, subKey: 'basePreferences'
})(pinia);

export const usePreferencesStore = buildPreferencesStore;

// export const usePreferencesStore = (delayMs?: number) => {
//     return buildPreferencesStore(delayMs);
// }

export const loadPreferencesStore = async (delayMs?: number) => {
    const store = usePreferencesStore(delayMs);
    await store.ready;
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
        const { basePreferences, allowedModes} = await PreferencesService.load();
        return new PreferencesService(basePreferences, allowedModes, undefined);
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
            const overStore = useOverrideStore(getPinia(), true);
            //TODO: re-enable this
            let override: IOverride<IExtensionPreferences>|undefined = undefined;
            let allowedModes = [OperationMode.Enabled, OperationMode.OnDemand, OperationMode.Disabled]
            if (storedPrefs && storedPrefs.mode && overStore.isOverrideActive) {
                override = overStore.currentOverride;
                if (override && override.allowedModes.length > 0) {
                    allowedModes = override.allowedModes;
                }
            }
            return {
                basePreferences, allowedModes, override
            }
    }

    static async save(prefs: IExtensionPreferences, skipClone: boolean = false) {
        const clonedPrefs = skipClone ? prefs : clone(prefs!);
        dbgLog('saving preferences to browser', clonedPrefs);
        // await browser.storage.local.set({ 'preferences': clonedPrefs });
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
