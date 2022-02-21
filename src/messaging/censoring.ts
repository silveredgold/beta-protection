import { CSSManager } from "@/services/css-manager";
import { IPreferences, loadPreferencesFromStorage, toRaw } from "@/preferences";
import { SubliminalService } from "@/services/subliminal-service";
import { dbgLog, getDomain } from "@/util";
import { RuntimeEvent } from "./util";

export const MSG_CENSOR_REQUEST: RuntimeEvent<any> = {
    event: 'censorRequest',
    handler: async (message, sender, ctx) => {
        const img = String(message.imageURL);
        let preferences: IPreferences;
        if (message.prefs !== undefined) {
            preferences = message.prefs as IPreferences;
        } else {
            preferences = await loadPreferencesFromStorage();
        }
        let requestType = "censorImage";
        if (preferences.autoAnimate || message.forceCensor) {
            dbgLog('forcing to redo message type');
            requestType = "redoCensor";
        }
        const rawPrefs = toRaw(preferences);
        ctx.socketClient.sendObj({
            version: ctx.version,
            msg: requestType,
            url: img,
            tabid: message['tabId'] ?? sender.tab!.id,
            id: message.id,
            priority: message.priority,
            preferences: rawPrefs,
            type: message.type,
            domain: getDomain(message.domain, preferences)
        });
    }
}
export const MSG_INJECT_CSS: RuntimeEvent<void> = {
    event: 'injectCSS',
    handler: async (request, sender, ctx) => {
        console.debug('CSS injection request', sender)
        const tabId = sender.tab?.id;
        if (tabId) {
          const prefs = (request.preferences as IPreferences) ?? await loadPreferencesFromStorage();
          const css = new CSSManager(tabId, prefs);
          console.debug(`injecting CSS to ${tabId}`, prefs);
        //   await css.removeCSS();
        //   await css.removeVideo();
          await css.addCSS();
          await css.addVideo();
        }
    }
}

export const MSG_INJECT_SUBLIMINAL : RuntimeEvent<void> = {
    event: 'runSubliminal',
    handler: async (request, sender, ctx) => {
        if (sender?.tab?.id) {
            const svc = new SubliminalService();
            svc.injectSubliminalScript(sender!.tab)
        }
    }
}

export const MSG_INJECT_SUBLIMINAL_CSS: RuntimeEvent<void> = {
    event: 'injectCSS:subliminal',
    handler: async (request, sender, ctx) => {
        console.debug('subliminal CSS injection request', sender)
        const tabId = sender.tab?.id;
        // console.debug(`got injectCSS for ${tabId}`);
        if (tabId) {
          const prefs = (request.preferences as IPreferences) ?? await loadPreferencesFromStorage();
          const css = new CSSManager(tabId, prefs);
          console.debug(`injecting CSS to ${tabId}`, prefs);
          await css.removeSubliminal();
          await css.addSubliminal();
        }
    }
}