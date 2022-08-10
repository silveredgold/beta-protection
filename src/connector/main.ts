import { MSG_API_EXTENSION_VERSION } from "@/messaging"
import browser from 'webextension-polyfill';

window.BetaProtection = {
    getCurrentVersion: async () => {
        const version = await browser.runtime.sendMessage({msg: MSG_API_EXTENSION_VERSION.event});
        return version;
    }
}