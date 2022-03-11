import { INavigationService } from '@silveredgold/beta-shared-components';
import browser from 'webextension-polyfill';

export const webExtensionNavigation: INavigationService & {openCensoring: ()=> void} = {
    openSettings: () => {
        window.open(browser.runtime.getURL('options.html'));
    },
    
    openStatistics: () => {
        window.open(browser.runtime.getURL('statistics.html'));
    },
    
    openOverrides: () => {
        window.open(browser.runtime.getURL('override.html'));
    },

    openUrl: (url: string) => {
        window.open(browser.runtime.getURL(url));
    },
    openCensoring: () => {
        window.open(browser.runtime.getURL('local.html'));
    },
    getAssetUrl: (assetUrl: string) => {
        return browser.runtime.getURL(assetUrl);
    }
}