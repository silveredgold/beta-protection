import browser from 'webextension-polyfill';

export const openSettings = () => {
    window.open(browser.runtime.getURL('options.html'));
}

export const openStatistics = () => {
    window.open(browser.runtime.getURL('statistics.html'));
}

export const openOverrides = () => {
    window.open(browser.runtime.getURL('override.html'));
}

export const webExtensionNavigation = {
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
    getAssetUrl: (assetUrl: string) => {
        return browser.runtime.getURL(assetUrl);
    }
}