import { MSG_CENSOR_REQUEST, MSG_GET_STATISTICS, MSG_INJECT_CSS, MSG_RESET_STATISTICS, MSG_PLACEHOLDERS_AVAILABLE, MSG_PLACEHOLDERS_ENABLED, MSG_INJECT_SUBLIMINAL, MSG_IMAGE_DATA, MSG_FORWARDING, MSG_API_EXTENSION_VERSION, MSG_API_GET_CURRENT_OVERRIDE } from "./messaging";
import { dbg, dbgLog, getDomain, getExtensionVersion } from "@/util";
import browser from 'webextension-polyfill';
import { ICensorBackend } from "@/transport";
import { PreferencesService } from "./stores";
import { waitForPreferencesStore } from "./stores/util";

export const CMENU_REDO_CENSOR = "BSNG_REDO_CENSOR";
export const CMENU_ENABLE_ONCE = "BP_FORCE_RUN";
export const CMENU_RECHECK_PAGE = "BP_RECHECK_PAGE";



const knownMessages = [MSG_PLACEHOLDERS_AVAILABLE, MSG_PLACEHOLDERS_ENABLED, MSG_CENSOR_REQUEST, MSG_GET_STATISTICS, MSG_RESET_STATISTICS, MSG_INJECT_CSS, MSG_INJECT_SUBLIMINAL, MSG_IMAGE_DATA, MSG_FORWARDING, MSG_API_EXTENSION_VERSION, MSG_API_GET_CURRENT_OVERRIDE];

export function processContextClick(info: browser.Menus.OnClickData, tab: browser.Tabs.Tab|undefined, backendClient: ICensorBackend) {
    const eVersion = getExtensionVersion();
    dbgLog('prcessing context click event', info, tab);
    if (tab && info.menuItemId === CMENU_REDO_CENSOR) {
        browser.tabs.sendMessage(tab.id!, {msg: CMENU_REDO_CENSOR}).then(value => {
            if (value !== undefined && value?.id) {
                waitForPreferencesStore().then(store => {
                    const prefs = store.currentPreferences;
                    backendClient.censorImage({
                        url: value.origSrc,
                        srcId: tab.id,
                        id: value.id,
                        force: true,
                        preferences: prefs,
                        requestData: {
                            type: 'normal'
                        },
                        context: {
                            domain: getDomain(value.domain, prefs)
                        }
                    });
                })
                // PreferencesService.create().then(store => {

                // });
            }
        });
    } else if (tab && info.menuItemId == CMENU_ENABLE_ONCE) {
        browser.tabs.sendMessage(tab.id!, {msg: "enableOnPage"});
    } else if (tab && info.menuItemId === CMENU_RECHECK_PAGE) {
        browser.tabs.sendMessage(tab.id!, {msg: CMENU_RECHECK_PAGE});
    }
}

export type MessageContext = {
    backendClient: ICensorBackend,
    version: string;
};

export interface IWebSocketClient  {
    // sendObj: (message: object, callback?: () => any|void) => void;
    // send: (message: string, callback?: any) => void;
    close: () => void
}

export async function processMessage(message: any, sender: browser.Runtime.MessageSender, ctxFactory: () => Promise<MessageContext>) {
    dbgLog('background processing msg', message, knownMessages.map(e => e.event));
    let msgHandlerFound = false;
    let ctx: MessageContext;
    for (const msg of knownMessages) {
        if (message.msg === msg.event) {
            msgHandlerFound = true;
            ctx ??= await ctxFactory();
            dbg('found matching event handler', msg);
            const result = await msg.handler(message, sender, ctx);
            return result;
        }
    }
    if (!msgHandlerFound) {
        console.warn('did not find a known message handler, unknown runtime message', message, sender);
    }
}
