import { dbg, dbgLog } from "@/util";
import { PiniaCustomProperties, PiniaCustomStateProperties, PiniaPlugin, PiniaPluginContext } from "pinia";
import browser from 'webextension-polyfill';

export const PersistencePlugin: PiniaPlugin = async (context: PiniaPluginContext): Promise<Partial<PiniaCustomProperties & PiniaCustomStateProperties> | void> => {
  const stateStorageId = `${context.store.$id}-state`;
  const stored = await browser.storage.local.get(stateStorageId);
  if (stored) {
    debugger;
    dbgLog('patching store with hydrated state', context.store.$state, stored[stateStorageId]);
    context.store.$patch(stored[stateStorageId]);
  }
  browser.storage.onChanged.addListener((changes, area) => {
    const keys = Object.keys(changes);
    if (area === 'local' && keys.includes(stateStorageId) ) {
      console.log('local change: storage ' + context.store.$id, area, changes);
    }
    // browser.runtime.sendMessage({msg: `storageChange:${area}`, keys, changes});
    // PreferencesService.create().then(ep => setModeBadge(ep.mode)).catch(() => console.debug('failed to set mode badge'));
  });
    // if (stored) {
    //     context.store.$patch(stored)
    // }
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
            `Finished "${name}" after ${
              Date.now() - startTime
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
    context.store.$subscribe(() => {
      dbgLog('updating persistent -state store');
      browser.storage.local.set({[`${context.store.$id}-state`]: {...context.store.$state}});
    });
};
