import { dbgLog, hashCode } from "@/util";
import clone from "just-clone";
import { defineStore, Pinia } from "pinia";
import { toRaw, unref } from "vue";
import browser from 'webextension-polyfill';
import { IExtensionPreferences, IOverride, IPreferences, OperationMode } from "@/preferences";
import { services } from "@silveredgold/beta-shared-components";
import { DateTime, Duration } from "luxon";
import { AES, enc } from "crypto-js";
const { FileSystemClient } = services;

export type OverrideResult = {
  success: boolean,
  message: string,
  code: number
};

// const saveOptions = async (prefs: UserOptions, skipClone: boolean = true) => {
//     const clonedPrefs = skipClone ? prefs : clone(prefs!);
//     await browser.storage.local.set({ 'userOptions': clonedPrefs });
// };

export const useOverrideStore = (pinia?: Pinia | null | undefined) => defineStore('override', {
  state: (): Partial<IOverride<IExtensionPreferences>> => {
    return {}
  },
  getters: {
    isOverrideActive(ctx): boolean {
      const state = (ctx as any).$state;
      return !!state.id;
    },
    currentOverride(state): IOverride<IExtensionPreferences> {
      return { ...state } as IOverride<IExtensionPreferences>;
    },
    currentId(ctx): string {
      const state = (ctx as any).$state;
      return state.id ?? "Unknown";
    },
    timeRemaining(ctx): number {
      debugger;
      console.debug('state', ctx);
      const state = (ctx as any).$state;
      if (state === undefined) { return 0 };
      if (state.activatedTime !== undefined && state.activatedTime > 0 &&
        state.minimumTime !== undefined && state.minimumTime > 0) {
        const now = DateTime.now();
        const then = DateTime.fromMillis(state.activatedTime);
        const target = then.plus(Duration.fromObject({ minutes: state.minimumTime }));
        return now > target ? 0 : target.diff(now).toMillis();
      }
      return 0;
    }
  },
  actions: {
    async importOverride(): Promise<OverrideResult> {
      if (this.$state.id) {
        return { success: false, code: 409, message: 'There is already an override active!' };
      }
      try {
        const fs = new FileSystemClient();
        const file = await fs.getFile(overrideFileType);
        const text = await file.file.text();
        const override = JSON.parse(text) as IOverride<IExtensionPreferences>;
        if (override?.id && override.allowedModes && override.allowedModes.length > 0) {
          const importHash = hashCode(JSON.stringify(override.preferences));
          if (override.hash && override.hash != importHash) {
            return { success: false, code: 422, message: 'Override has been modified!' }
          }
          override.activatedTime = new Date().getTime();
          this.$state = override;
          // browser.storage.local.set({ 'override': override });
          return { success: true, code: 200, message: 'Override loaded and saved!' };
        }
        return { success: false, code: 400, message: 'Override is not in a valid format!' };
      } catch {
        return { success: false, code: 500, message: 'Error encountered importing override!' };
      }
    },
    async tryDisable(keyPhrase: string): Promise<OverrideResult> {
      debugger;
      if (!this.$state.id) {
        return { success: true, code: 204, message: 'There is no override active!' };
      }
      const id = this.$state.id;
      const input = this.$state.key;
      const remaining = this.timeRemaining;
      if (remaining > 0) {
        return { success: false, code: 412, message: 'Required time has not passed!' };
      }
      try {
        const bytes = AES.decrypt(input!, keyPhrase);
        const candidate = bytes.toString(enc.Utf8);
        if (candidate === id) {
          // await browser.storage.local.remove('override');
          this.$state = {id: undefined};
          return { success: true, code: 200, message: 'Override successfully disabled!' };
        } else {
          return { success: false, code: 403, message: 'Unlock key did not match!' };
        }
      } catch {
        return { success: false, code: 500, message: 'Error encountered disabling override' };
      }
    },
    async reload(): Promise<void> {
      const storeResult = await browser.storage.local.get({ 'override': {} });
      const currentOverride = storeResult['override'];
      this.$state = currentOverride;
    }
  },
  debounce: {}
})(pinia);

const loadOverrides = async () => {
  const store = useOverrideStore();
  return store;
}

const overrideFileType = [{ accept: { 'text/json': '.betaoverride' }, description: 'Beta Protection Overrides' }];
