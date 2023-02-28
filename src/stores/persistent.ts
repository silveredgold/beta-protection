import { dbg, dbgLog } from "@/util";
import clone from "just-clone";
import { PiniaCustomProperties, PiniaCustomStateProperties, PiniaPlugin, PiniaPluginContext, storeToRefs } from "pinia";
import browser from 'webextension-polyfill';
import { isEqual } from "lodash";
import { reactive, toRaw } from "vue";

class Deferred {
  promise: Promise<void>;
  reject!: (reason?: any) => void;
  resolve!: (value?: any) => void;
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.reject = reject;
      this.resolve = resolve;
    });
  }
}

export const ActionLogPlugin: PiniaPlugin = (context: PiniaPluginContext): Partial<PiniaCustomProperties & PiniaCustomStateProperties> | void => {
  context.store.$onAction(
    ({
      name, // name of the action
      store, // store instance, same as `someStore`
      args, // array of parameters passed to the action
      after, // hook after the action returns or resolves
      onError, // hook if the action throws or rejects
    }) => {
      // a shared variable for this specific action call
      const startTime = Date.now()
      // this will trigger before an action on `store` is executed
      dbg(`Start "${name}" with params [${args.join(', ')}].`)

      // this will trigger if the action succeeds and after it has fully run.
      // it waits for any returned promised
      after((result) => {
        dbgLog(
          `Finished "${name}" after ${Date.now() - startTime
          }ms.\nResult: ${result}.`
        )
      })

      // this will trigger if the action throws or returns a promise that rejects
      onError((error) => {
        console.warn(
          `Failed "${name}" after ${Date.now() - startTime}ms.\nError: ${error}.`
        )
      })
    }
  )
}

export const PersistencePlugin: PiniaPlugin = (context: PiniaPluginContext): Partial<PiniaCustomProperties & PiniaCustomStateProperties> | void => {
  const stateStorageId = `${context.store.$id}`;
  const ready = new Deferred();
  context.store.ready = reactive(ready.promise);
  browser.storage.local.get(stateStorageId).then(stored => {
    if (stored) {
      dbgLog(`patching ${stateStorageId} with hydrated state`, context.store.$state, stored[stateStorageId]);
      if (context.options.subKey) {
        context.store.$patch({[context.options.subKey]: stored[stateStorageId]});
      } else {
        context.store.$patch(stored[stateStorageId]);
      }
      ready.resolve();
    }
  });
  browser.storage.onChanged.addListener((changes, area) => {
    const keys = Object.keys(changes);
    if (area === 'local' && keys.includes(stateStorageId)) {
      dbgLog('local change: storage ' + context.store.$id, area, changes);
      if (changes[stateStorageId].newValue) {
        const newData = changes[stateStorageId].newValue;
        dbgLog('local change includes relevant key', stateStorageId, newData);
        if (context.options.subKey) {
          const oldData = toRaw(context.store.$state[context.options.subKey]);
          if (!isEqual(newData, oldData)) {
            dbg('local change new subkey value is different from old', newData, oldData);
            context.store.$patch({[context.options.subKey]: newData});
          }
        } else {
          const oldData = toRaw(context.store.$state);
          if (!isEqual(newData, oldData)) {
            dbg('local change new root value is different from old', newData, oldData);
            context.store.$patch(newData);
          }
        }
      } else {
        context.store.$state = {};
      }
    }
    // browser.runtime.sendMessage({msg: `storageChange:${area}`, keys, changes});
    // PreferencesService.create().then(ep => setModeBadge(ep.mode)).catch(() => console.debug('failed to set mode badge'));
  });

  context.store.$subscribe(() => {
    if (context.options.readOnly !== true) {
      dbgLog(`updating persistent ${stateStorageId} store`, context.options.subKey);
      if (context.options.subKey) {
        const targetProperty = context.store.$state[ context.options.subKey]
        const clonedPrefs = clone(targetProperty);
        browser.storage.local.set({[stateStorageId]: clonedPrefs});
      } else {
        const clonedPrefs = clone({ ...context.store.$state });
        browser.storage.local.set({ [stateStorageId]: clonedPrefs });
      }
    }
  });
};

export const InitializePlugin: PiniaPlugin = (context: PiniaPluginContext): Partial<PiniaCustomProperties & PiniaCustomStateProperties> | void => {
  // const ready = new Deferred();
  // // const readyPromise = new Promise<void>(readyResolve);
  // context.store.ready = reactive(ready.promise);
  // context.store.$subscribe(() => {
  //   dbgLog('ready plugin subscription fired');
  //   if (context.store.$state !== undefined && !isEqual(context.store.$state,{})) {
  //     dbgLog('ready plugin resolving');
  //     ready.resolve();
  //   }
  // });
  // if (!context.store.ready) {
  //   dbgLog('ready plugin waiting');
  //   await ready.promise;
  // }
}
