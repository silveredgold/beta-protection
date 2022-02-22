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

export type AssetSource = (path: string) => string;