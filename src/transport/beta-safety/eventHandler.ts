import { RuntimePortManager } from "@/transport/runtimePort";
import { ICensorBackend } from "@/transport";
import browser from 'webextension-polyfill';
import { waitForPreferencesStore } from "@/stores/util";


export class ExtensionEventHandler {
    static RegisterEvents(backend: ICensorBackend, portManager: RuntimePortManager) {
        backend.onImageCensored.subscribe(async (sender, payload) => {
            const store = await waitForPreferencesStore();
            const prefs = payload.responseData['preferences']
                ? payload.responseData['preferences']
                : store.currentPreferences;
            if (payload.error) {
                console.log(`error image response`, payload);
                payload.url = prefs.errorMode === 'normal'
                    ? browser.runtime.getURL("images/error_normal.jpg")
                    : browser.runtime.getURL("images/error_simple.png");
            }
            const body = {
                msg: "setSrc", censorURL: payload.url, id: payload.id,
                tabid: payload.srcId ? +payload.srcId : undefined, error: payload.error
            };
            portManager.sendMessage(body, payload.id);
        })
    }
}
