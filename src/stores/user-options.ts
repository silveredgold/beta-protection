import { dbgLog } from "@/util";
import clone from "just-clone";
import { defineStore } from "pinia";
import { toRaw, unref } from "vue";
import browser from 'webextension-polyfill';

export interface UserOptions {
    forceOverwriteLocal?: boolean;
    overrideAppliesToLocal?: boolean;
}

// const saveOptions = async (prefs: UserOptions, skipClone: boolean = true) => {
//     const clonedPrefs = skipClone ? prefs : clone(prefs!);
//     await browser.storage.local.set({ 'userOptions': clonedPrefs });
// };

export const useUserOptionsStore = (delayMs?: number) => defineStore('userOptions', {
    state: (): UserOptions => {
        return { forceOverwriteLocal: false, overrideAppliesToLocal: false }
    },
    getters: {
        allowUnsafeLocal(): boolean {
            console.debug('returning from getter', this.forceOverwriteLocal);
            return this.forceOverwriteLocal !== true;
        },
        allowCustomLocalPreferences(): boolean {
          return this.overrideAppliesToLocal !== true;
        }
    },
    actions: {
        async enableForcedOverwriting() {
            this.forceOverwriteLocal = true;
            const currentState = toRaw(unref(this.$state));
            // dbgLog('state', currentState)
            // await saveOptions(currentState);
            // await this.load();
        },
        async enableOverridesOnLocal() {
          this.overrideAppliesToLocal = true;
          const currentState = toRaw(unref(this.$state));
            // dbgLog('state', currentState);
          // await saveOptions(currentState);
          // await this.load();
        },
        async load() {
            // const result = await browser.storage.local.get('userOptions');
            // const storedPrefs = result['userOptions'] as UserOptions;
            // console.debug('got back user options', result);
            // this.forceOverwriteLocal = storedPrefs?.forceOverwriteLocal;
            // this.overrideAppliesToLocal = storedPrefs?.overrideAppliesToLocal;
            return this;
        }
    },
    debounce: {}
})();

const loadUserOptions = async () => {
    const store = useUserOptionsStore();
    await store.load();
    return store;
}
